import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Album, IAlbum } from '../models/Album.js';
import { Image } from '../models/Image.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

type LeanAlbum = Omit<IAlbum, 'save' | 'deleteOne'> & { _id: mongoose.Types.ObjectId };

function toPublic(album: LeanAlbum) {
  return {
    id: album._id,
    name: album.name,
    description: album.description,
    coverImageId: album.coverImageId,
    createdAt: album.createdAt,
  };
}

/**
 * 公开：相册列表
 */
router.get('/', async (_req: AuthRequest, res: Response) => {
  const albums = await Album.find().sort({ createdAt: -1 }).lean();
  // 附带每个相册的图片数量
  const counts = await Image.aggregate([
    { $match: { albumId: { $ne: null } } },
    { $group: { _id: '$albumId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c: any) => [String(c._id), c.count]));
  res.json({
    data: (albums as LeanAlbum[]).map((a) => ({ ...toPublic(a), count: countMap.get(String(a._id)) || 0 })),
  });
});

/**
 * 公开：单个相册
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: '无效的 ID' });
    return;
  }
  const album = await Album.findById(req.params.id).lean() as LeanAlbum | null;
  if (!album) {
    res.status(404).json({ error: '相册不存在' });
    return;
  }
  res.json(toPublic(album));
});

/**
 * 鉴权：创建相册
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: '相册名称必填' });
    return;
  }
  const exists = await Album.findOne({ name });
  if (exists) {
    res.status(409).json({ error: '相册名称已存在' });
    return;
  }
  const album = await Album.create({ name, description: description || '' });
  res.status(201).json(toPublic(album.toObject() as LeanAlbum));
});

/**
 * 鉴权：编辑相册
 */
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: '无效的 ID' });
    return;
  }
  const { name, description, coverImageId } = req.body;
  const update: any = {};
  if (name !== undefined) update.name = name;
  if (description !== undefined) update.description = description;
  if (coverImageId !== undefined) {
    update.coverImageId = coverImageId && mongoose.isValidObjectId(coverImageId) ? new mongoose.Types.ObjectId(String(coverImageId)) : null;
  }
  const album = await Album.findByIdAndUpdate(req.params.id, update, { new: true }).lean() as LeanAlbum | null;
  if (!album) {
    res.status(404).json({ error: '相册不存在' });
    return;
  }
  res.json(toPublic(album));
});

/**
 * 鉴权：删除相册（同时把图片的 albumId 置空）
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: '无效的 ID' });
    return;
  }
  const album = await Album.findByIdAndDelete(req.params.id);
  if (!album) {
    res.status(404).json({ error: '相册不存在' });
    return;
  }
  await Image.updateMany({ albumId: album._id }, { $set: { albumId: null } });
  res.json({ message: '删除成功' });
});

export default router;
