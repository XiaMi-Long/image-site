import { Router, Response } from 'express';
import path from 'path';
import { Image, IImage } from '../models/Image.js';
import { Album } from '../models/Album.js';
import { config } from '../config.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { saveImage, deleteImage } from '../utils/storage.js';
import mongoose from 'mongoose';

const router = Router();

type LeanImage = Omit<IImage, 'save' | 'deleteOne'> & { _id: mongoose.Types.ObjectId };

function buildQuery(req: AuthRequest) {
  const q: any = {};
  const { search, albumId, tag } = req.query;
  if (search) {
    q.$or = [
      { title: { $regex: String(search), $options: 'i' } },
      { description: { $regex: String(search), $options: 'i' } },
      { tags: { $regex: String(search), $options: 'i' } },
    ];
  }
  if (albumId && mongoose.isValidObjectId(albumId)) {
    q.albumId = new mongoose.Types.ObjectId(String(albumId));
  }
  if (tag) {
    q.tags = String(tag);
  }
  return q;
}

function toPublic(img: LeanImage) {
  return {
    id: img._id,
    title: img.title,
    description: img.description,
    fileName: img.fileName,
    displayUrl: `/uploads/${img.displayPath}`,
    originalUrl: `/uploads/${img.originalPath}`,
    downloadUrl: `/api/images/${img._id}/download`,
    size: img.size,
    displaySize: img.displaySize,
    width: img.width,
    height: img.height,
    albumId: img.albumId,
    tags: img.tags,
    createdAt: img.createdAt,
  };
}

/**
 * 公开：分页列表，支持 search/albumId/tag 过滤
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page)) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit)) || 24));
  const q = buildQuery(req);

  const [images, total] = await Promise.all([
    Image.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Image.countDocuments(q),
  ]);

  res.json({
    data: (images as LeanImage[]).map(toPublic),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
});

/**
 * 公开：单张详情
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: '无效的 ID' });
    return;
  }
  const image = await Image.findById(req.params.id).lean() as LeanImage | null;
  if (!image) {
    res.status(404).json({ error: '图片不存在' });
    return;
  }
  res.json(toPublic(image));
});

/**
 * 公开：下载原图
 */
router.get('/:id/download', async (req: AuthRequest, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: '无效的 ID' });
    return;
  }
  const image = await Image.findById(req.params.id).lean() as LeanImage | null;
  if (!image) {
    res.status(404).json({ error: '图片不存在' });
    return;
  }
  const filePath = path.join(config.rootDir, 'uploads', image.originalPath);
  res.download(filePath, image.fileName);
});

/**
 * 鉴权：批量上传
 */
router.post('/', authMiddleware, upload.array('images', 50), async (req: AuthRequest, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ error: '请选择至少一张图片' });
    return;
  }

  const titles = req.body.titles ? (Array.isArray(req.body.titles) ? req.body.titles : [req.body.titles]) : [];
  const tags = req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : String(req.body.tags).split(',').map((t: string) => t.trim()).filter(Boolean)) : [];
  const albumId = req.body.albumId && mongoose.isValidObjectId(req.body.albumId) ? new mongoose.Types.ObjectId(String(req.body.albumId)) : null;

  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const saved = await saveImage(file.buffer, file.originalname, file.mimetype);
      const image = await Image.create({
        title: titles[i] || file.originalname.replace(/\.[^.]+$/, ''),
        description: '',
        ...saved,
        albumId,
        tags,
      });
      results.push(toPublic(image.toObject() as LeanImage));
    } catch (err: any) {
      results.push({ error: err.message, fileName: file.originalname });
    }
  }

  // 若指定了相册且相册无封面，则用第一张作为封面
  if (albumId && results[0] && !results[0].error) {
    await Album.findByIdAndUpdate(albumId, { $set: { coverImageId: results[0].id } }, { new: true });
  }

  res.status(201).json({ data: results });
});

/**
 * 鉴权：编辑图片（标题/描述/相册/标签）
 */
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: '无效的 ID' });
    return;
  }
  const { title, description, albumId, tags } = req.body;
  const update: any = {};
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (tags !== undefined) update.tags = Array.isArray(tags) ? tags : String(tags).split(',').map((t: string) => t.trim()).filter(Boolean);
  if (albumId !== undefined) {
    update.albumId = albumId && mongoose.isValidObjectId(albumId) ? new mongoose.Types.ObjectId(String(albumId)) : null;
  }

  const image = await Image.findByIdAndUpdate(req.params.id, update, { new: true }).lean() as LeanImage | null;
  if (!image) {
    res.status(404).json({ error: '图片不存在' });
    return;
  }
  res.json(toPublic(image));
});

/**
 * 鉴权：删除图片
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: '无效的 ID' });
    return;
  }
  const image = await Image.findById(req.params.id);
  if (!image) {
    res.status(404).json({ error: '图片不存在' });
    return;
  }
  await deleteImage(image.originalPath, image.displayPath);
  await image.deleteOne();
  res.json({ message: '删除成功' });
});

export default router;
