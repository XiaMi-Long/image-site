import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';
import { paths, config } from '../config.js';

async function ensureDirs() {
  await fs.mkdir(paths.originals, { recursive: true });
  await fs.mkdir(paths.displays, { recursive: true });
}

function randomName(ext: string) {
  return crypto.randomBytes(12).toString('hex') + ext;
}

export interface SavedImage {
  fileName: string;
  originalPath: string;
  displayPath: string;
  size: number;
  displaySize: number;
  width: number;
  height: number;
  mimeType: string;
}

/**
 * 保存原图 + 生成展示压缩图
 * @param buffer 上传文件 buffer
 * @param originalName 原始文件名
 * @param mimeType MIME 类型
 */
export async function saveImage(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<SavedImage> {
  await ensureDirs();

  const ext = path.extname(originalName) || '.jpg';
  const baseName = randomName(ext);

  // 原图落盘
  const originalPath = path.join(paths.originals, baseName);
  await fs.writeFile(originalPath, buffer);

  // 生成展示图（压缩 + 限制宽度）
  const displayBaseName = randomName('.webp');
  const displayPath = path.join(paths.displays, displayBaseName);
  const transformer = sharp(buffer, { failOn: 'none' });
  const meta = await transformer.metadata();
  const resized = transformer.resize({ width: config.displayWidth, withoutEnlargement: true });
  // 非图片格式或动画 GIF 一律转 webp；保留 PNG 透明
  let pipeline = resized.webp({ quality: config.displayQuality });
  await pipeline.toFile(displayPath);

  const displayStat = await fs.stat(displayPath);

  return {
    fileName: originalName,
    originalPath: `originals/${baseName}`,
    displayPath: `displays/${displayBaseName}`,
    size: buffer.length,
    displaySize: displayStat.size,
    width: meta.width || 0,
    height: meta.height || 0,
    mimeType,
  };
}

/**
 * 删除原图与展示图
 */
export async function deleteImage(originalPath: string, displayPath: string) {
  await fs.unlink(path.join(config.rootDir, 'uploads', originalPath)).catch(() => {});
  await fs.unlink(path.join(config.rootDir, 'uploads', displayPath)).catch(() => {});
}
