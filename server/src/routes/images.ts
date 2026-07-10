import { Router, Response } from 'express';
import path from 'path';
import { Image, IImage } from '../models/Image.js';
import { Album } from '../models/Album.js';
import { config } from '../config.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { saveImage, deleteImage, deleteFiles, findOrphanedFiles, removeOrphanedFiles, cropDisplay } from '../utils/storage.js';
import mongoose from 'mongoose';

const router = Router();

type LeanImage = Omit<IImage, 'save' | 'deleteOne'> & { _id: mongoose.Types.ObjectId };

function hasCJK(text: string): boolean {
  return /[一-鿿㐀-䶿豈-﫿]/.test(text);
}

function buildQuery(req: AuthRequest) {
  const q: any = {};
  const { search, albumId, tag } = req.query;
  if (search) {
    const term = String(search);
    if (hasCJK(term)) {
      q.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { tags: { $regex: term, $options: 'i' } },
      ];
    } else {
      q.$text = { $search: term };
    }
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
  const isTextSearch = !!q.$text;

  // Sort support
  const sortBy = String(req.query.sortBy || 'createdAt');
  const sortOrder = String(req.query.sortOrder || 'desc') === 'asc' ? 1 : -1;
  const allowedSort = ['title', 'fileName', 'size', 'createdAt', 'updatedAt'];
  const sort: Record<string, 1 | -1> = allowedSort.includes(sortBy)
    ? { [sortBy]: sortOrder }
    : { createdAt: -1 };

  const [images, total] = await Promise.all([
    isTextSearch
      ? Image.find(q, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } }).skip((page - 1) * limit).limit(limit).lean()
      : Image.find(q).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
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

  const results = await Promise.allSettled(
    files.map(async (file, i) => {
      const saved = await saveImage(file.buffer, file.originalname, file.mimetype);
      try {
        const image = await Image.create({
          title: titles[i] || file.originalname.replace(/\.[^.]+$/, ''),
          description: '',
          ...saved,
          albumId,
          tags,
        });
        return toPublic(image.toObject() as LeanImage);
      } catch (err) {
        // saveImage 已写入文件，但 DB 写入失败 → 清理残留
        await deleteFiles([saved.originalPath, saved.displayPath]);
        throw err;
      }
    }),
  );

  const processedResults = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return { error: r.reason?.message || '上传失败', fileName: files[i].originalname };
  });

  // 若指定了相册且相册无封面，则用第一张作为封面
  if (albumId && processedResults[0] && !('error' in processedResults[0])) {
    const first = processedResults[0] as ReturnType<typeof toPublic>;
    await Album.findByIdAndUpdate(albumId, { $set: { coverImageId: first.id } }, { new: true });
  }

  res.status(201).json({ data: processedResults });
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
 * 鉴权：裁剪/旋转图片（基于原图重新生成展示图）
 * POST /api/images/:id/crop
 * Body: { x, y, width, height, rotation }
 */
router.post('/:id/crop', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: '无效的 ID' });
    return;
  }
  const image = await Image.findById(req.params.id);
  if (!image) {
    res.status(404).json({ error: '图片不存在' });
    return;
  }

  const { x, y, width, height, rotation } = req.body;
  if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
    res.status(400).json({ error: '参数错误，需要 x, y, width, height' });
    return;
  }

  const newDisplaySize = await cropDisplay(image.originalPath, image.displayPath, {
    x, y, width, height,
    rotation: typeof rotation === 'number' ? rotation : 0,
  });

  image.displaySize = newDisplaySize;
  await image.save();

  const updated = await Image.findById(image._id).lean() as LeanImage | null;
  res.json(toPublic(updated!));
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

/**
 * 鉴权：扫描孤立文件（未被任何 Image 记录引用的上传文件）
 * GET /api/images/gc/scan
 */
router.get('/gc/scan', authMiddleware, async (req: AuthRequest, res: Response) => {
  const images = await Image.find({}).select('originalPath displayPath').lean();
  const referenced = images.flatMap((img) => [img.originalPath, img.displayPath]);
  const orphaned = await findOrphanedFiles(referenced);
  res.json(orphaned);
});

/**
 * 鉴权：删除孤立文件
 * POST /api/images/gc/cleanup
 * Body: { originals: string[], displays: string[] }
 */
router.post('/gc/cleanup', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { originals, displays } = req.body;
  if (!Array.isArray(originals) || !Array.isArray(displays)) {
    res.status(400).json({ error: '参数错误，需要 originals 和 displays 数组' });
    return;
  }
  await removeOrphanedFiles(originals, displays);
  res.json({ message: `清理完成，删除了 ${originals.length + displays.length} 个文件` });
});

export default router;
