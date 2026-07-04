import { Router, Response } from 'express';
import { Image } from '../models/Image.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * 公开：获取所有标签及出现次数
 */
router.get('/', async (_req: AuthRequest, res: Response) => {
  const tags = await Image.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, name: '$_id', count: 1 } },
  ]);
  res.json({ data: tags });
});

export default router;
