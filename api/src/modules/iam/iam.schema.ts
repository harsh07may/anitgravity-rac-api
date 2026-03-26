import z from 'zod';

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').toUpperCase(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(), // Array of permission actions e.g. ["read:users"]
});

export const updateRoleSchema = z.object({
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export const updateUserRoleSchema = z.object({
  roleId: z.string().uuid("Invalid role ID"),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
