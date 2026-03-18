import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { registerSchema, loginSchema, refreshSchema } from './iam.schema.js';
import * as iamController from './iam.controller.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), iamController.register);
router.post('/login', validate(loginSchema), iamController.login);
router.post('/refresh', validate(refreshSchema), iamController.refresh);

// Protected routes
router.post('/logout', authenticate, iamController.logout);
router.get('/me', authenticate, iamController.getMe);

export default router;
