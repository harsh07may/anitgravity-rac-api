import type { Request, Response, NextFunction } from 'express';
import * as iamService from './iam.service.js';
import { sendSuccess, sendCreated } from '../../lib/response.js';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await iamService.register(req.body);
    sendCreated(res, user);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await iamService.login(req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await iamService.refresh(req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    await iamService.logout(refreshToken);
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await iamService.getMe(req.user!.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}
