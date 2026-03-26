import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import prisma from "../../config/db.js";
import { envConfig } from "../../config/envConfig.js";
import { logger } from "../../config/logger.js";
import {
  AppError,
  Conflict,
  Unauthorized,
  NotFound,
} from "../../lib/AppError.js";
import type {
  RegisterInput,
  LoginInput,
  CreateRoleInput,
  UpdateRoleInput,
  UpdateUserRoleInput,
} from "./iam.schema.js";
import {
  SALT_ROUNDS,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL_MS,
} from "../../CONSTANTS.js";

// Helpers

/** Signs a JWT access token for a given user. */
function signAccessToken(userId: string, roleId: string) {
  return jwt.sign({ sub: userId, roleId }, envConfig.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

// Service Functions

/** Registers a new customer user and hashes their password. */
export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) throw Conflict("An account with this email already exists");

  const customerRole = await prisma.role.findUnique({
    where: { name: "CUSTOMER" },
  });
  if (!customerRole)
    throw new AppError("Default role not found — run seed first", 500, false);

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash,
      roleId: customerRole.id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: { select: { name: true } },
    },
  });

  logger.info({ userId: user.id }, "User registered");
  return user;
}

/** Authenticates a user by email/password and creates a new session. */
export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { role: { select: { name: true } } },
  });

  if (!user || !user.isActive) throw Unauthorized("Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw Unauthorized("Invalid email or password");

  const accessToken = signAccessToken(user.id, user.roleId);
  const refreshToken = randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await prisma.session.create({
    data: { userId: user.id, refreshToken, expiresAt },
  });

  logger.info({ userId: user.id }, "User logged in");

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role.name,
    },
  };
}

/** Issues a new access token using a valid (unexpired) refresh token. */
export async function refresh(token: string) {
  const session = await prisma.session.findUnique({
    where: { refreshToken: token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    // Clean up expired session if it exists
    if (session) await prisma.session.delete({ where: { id: session.id } });
    throw Unauthorized("Refresh token is invalid or expired");
  }

  const accessToken = signAccessToken(session.user.id, session.user.roleId);

  logger.info({ userId: session.user.id }, "Access token refreshed");
  return { accessToken };
}

/** Terminates a session by deleting the refresh token. */
export async function logout(refreshToken: string) {
  await prisma.session.deleteMany({ where: { refreshToken } });
  logger.info("Session terminated");
}

/** Retrieves the profile of the currently authenticated user. */
export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
      role: { select: { name: true } },
    },
  });

  if (!user) throw NotFound("User");
  return user;
}

/** Retrieves all roles along with their assigned permissions. */
export async function getRoles() {
  return prisma.role.findMany({ include: { permissions: true } });
}

/** Creates a new role and optionally binds permissions to it. */
export async function createRole(input: CreateRoleInput) {
  const existing = await prisma.role.findUnique({
    where: { name: input.name },
  });
  if (existing) throw Conflict("A role with this name already exists");

  let permissionsConnect: any = [];
  if (input.permissions && input.permissions.length > 0) {
    permissionsConnect = input.permissions.map((action) => ({ action }));
  }

  const role = await prisma.role.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      permissions: {
        connect: permissionsConnect,
      },
    },
    include: { permissions: true },
  });

  logger.info({ roleId: role.id }, "Role created");
  return role;
}

/** Updates a role and its permissions. */
export async function updateRole(roleId: string, input: UpdateRoleInput) {
  const existing = await prisma.role.findUnique({ where: { id: roleId } });
  if (!existing) throw NotFound("Role");

  let permissionsUpdate: any = undefined;
  if (input.permissions) {
    permissionsUpdate = {
      set: [], // clears existing
      connect: input.permissions.map((action) => ({ action })),
    };
  }

  const updateData: any = {};
  if (input.description !== undefined)
    updateData.description = input.description;
  if (permissionsUpdate) updateData.permissions = permissionsUpdate;

  const role = await prisma.role.update({
    where: { id: roleId },
    data: updateData,
    include: { permissions: true },
  });

  logger.info({ roleId: role.id }, "Role updated");
  return role;
}

/** Retrieves all permissions valid in the system. */
export async function getPermissions() {
  return prisma.permission.findMany();
}

/** Retrieves all users in the system (Admins only). */
export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      role: { select: { id: true, name: true } },
      agency: { select: { id: true, name: true } },
    },
  });
}

/** Updates a user's role. */
export async function updateUserRole(
  userId: string,
  input: UpdateUserRoleInput,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw NotFound("User");

  const role = await prisma.role.findUnique({ where: { id: input.roleId } });
  if (!role) throw NotFound("Role");

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { roleId: input.roleId },
    select: { id: true, email: true, role: { select: { name: true } } },
  });

  logger.info({ userId, roleId: input.roleId }, "User role updated");
  return updatedUser;
}
