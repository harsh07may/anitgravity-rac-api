import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import prisma  from '../../config/db.js';
import { envConfig } from '../../config/envConfig.js';
import { logger } from '../../config/logger.js';
import { AppError, Conflict, Unauthorized, NotFound } from '../../lib/AppError.js';
import type { RegisterInput, LoginInput, RefreshInput } from './iam.schema.js';
import { SALT_ROUNDS, ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL_MS } from '../../CONSTANTS.js';

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
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw Conflict('An account with this email already exists');

  const customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
  if (!customerRole) throw new AppError('Default role not found — run seed first', 500, false);

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
    select: { id: true, firstName: true, lastName: true, email: true, role: { select: { name: true } } },
  });

  logger.info({ userId: user.id }, 'User registered');
  return user;
}

/** Authenticates a user by email/password and creates a new session. */
export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { role: { select: { name: true } } },
  });

  if (!user || !user.isActive) throw Unauthorized('Invalid email or password');

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw Unauthorized('Invalid email or password');

  const accessToken = signAccessToken(user.id, user.roleId);
  const refreshToken = randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await prisma.session.create({
    data: { userId: user.id, refreshToken, expiresAt },
  });

  logger.info({ userId: user.id }, 'User logged in');

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role.name },
  };
}

/** Issues a new access token using a valid (unexpired) refresh token. */
export async function refresh(input: RefreshInput) {
  const session = await prisma.session.findUnique({
    where: { refreshToken: input.refreshToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    // Clean up expired session if it exists
    if (session) await prisma.session.delete({ where: { id: session.id } });
    throw Unauthorized('Refresh token is invalid or expired');
  }

  const accessToken = signAccessToken(session.user.id, session.user.roleId);

  logger.info({ userId: session.user.id }, 'Access token refreshed');
  return { accessToken };
}

/** Terminates a session by deleting the refresh token. */
export async function logout(refreshToken: string) {
  await prisma.session.deleteMany({ where: { refreshToken } });
  logger.info('Session terminated');
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

  if (!user) throw NotFound('User');
  return user;
}
