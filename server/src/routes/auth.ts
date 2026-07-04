import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { config } from '../config.js';
import { signToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * 登录：POST /api/auth/login
 */
router.post('/login', async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码必填' });
    return;
  }
  const user = await User.findOne({ username });
  if (!user) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }
  const token = signToken(String(user._id), user.username);
  res.json({ token, username: user.username });
});

/**
 * 验证 token：GET /api/auth/me
 */
router.get('/me', async (req: AuthRequest, res: Response) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.json({ valid: false });
    return;
  }
  try {
    const jwt = (await import('jsonwebtoken')).default;
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as { sub: string };
    const user = await User.findById(payload.sub);
    if (!user) {
      res.json({ valid: false });
      return;
    }
    res.json({ valid: true, username: user.username });
  } catch {
    res.json({ valid: false });
  }
});

/**
 * 首次启动时根据 env 创建管理员
 */
export async function seedAdmin() {
  const exists = await User.findOne({ username: config.adminUsername });
  if (exists) return;
  const passwordHash = await bcrypt.hash(config.adminPassword, 10);
  await User.create({ username: config.adminUsername, passwordHash });
  console.log(`[seed] admin created: ${config.adminUsername}`);
}

export default router;
