import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';

export interface AuthRequest extends Request {
  userId?: string;
  username?: string;
}

export function signToken(userId: string, username: string) {
  return jwt.sign({ sub: userId, username }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: '未登录' });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string; username: string };
    const user = await User.findById(payload.sub);
    if (!user) {
      res.status(401).json({ error: '用户不存在' });
      return;
    }
    req.userId = String(user._id);
    req.username = user.username;
    next();
  } catch {
    res.status(401).json({ error: '登录已过期' });
  }
}
