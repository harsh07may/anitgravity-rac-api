import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate, requirePermission } from '../../middleware/auth.middleware.js';
import { registerSchema, loginSchema, createRoleSchema, updateRoleSchema, updateUserRoleSchema } from './iam.schema.js';
import * as iamController from './iam.controller.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), iamController.register);
router.post('/login', validate(loginSchema), iamController.login);
router.post('/refresh', iamController.refresh);

// Protected routes (Self)
router.post('/logout', authenticate, iamController.logout);
router.get('/me', authenticate, iamController.getMe);

// Protected routes (Admin / RBAC)
router.get('/roles', authenticate, requirePermission('read:roles'), iamController.getRoles);
router.post('/roles', authenticate, requirePermission('manage:roles'), validate(createRoleSchema), iamController.createRole);
router.patch('/roles/:id', authenticate, requirePermission('manage:roles'), validate(updateRoleSchema), iamController.updateRole);

router.get('/permissions', authenticate, requirePermission('read:permissions'), iamController.getPermissions);

router.get('/users', authenticate, requirePermission('read:users'), iamController.getUsers);
router.patch('/users/:id/role', authenticate, requirePermission('manage:users'), validate(updateUserRoleSchema), iamController.updateUserRole);

export default router;
