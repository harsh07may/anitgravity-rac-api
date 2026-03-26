import type { NextFunction, Request, Response } from 'express';
import { REFRESH_TOKEN_TTL_MS } from '../../CONSTANTS.js';
import { Unauthorized } from '../../lib/AppError.js';
import { sendCreated, sendSuccess } from '../../lib/response.js';
import * as iamService from './iam.service.js';

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
    
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_TTL_MS,
    });
    
    const { refreshToken, ...responsePayload } = result;
    sendSuccess(res, responsePayload);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw Unauthorized('Refresh token is missing or expired in cookies');
    }
    const result = await iamService.refresh(refreshToken);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) await iamService.logout(refreshToken);
    
    res.clearCookie('refreshToken');
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

export async function getRoles(_req: Request, res: Response, next: NextFunction) {
  try {
    const roles = await iamService.getRoles();
    sendSuccess(res, roles);
  } catch (err) {
    next(err);
  }
}

export async function createRole(req: Request, res: Response, next: NextFunction) {
  try {
    const role = await iamService.createRole(req.body);
    sendCreated(res, role);
  } catch (err) {
    next(err);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const role = await iamService.updateRole(req.params.id as string, req.body);
    sendSuccess(res, role);
  } catch (err) {
    next(err);
  }
}

export async function getPermissions(_req: Request, res: Response, next: NextFunction) {
  try {
    const permissions = await iamService.getPermissions();
    sendSuccess(res, permissions);
  } catch (err) {
    next(err);
  }
}

export async function getUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await iamService.getUsers();
    sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await iamService.updateUserRole(req.params.id as string, req.body);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}
