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

/**
 * 清理上传失败的残留文件
 */
export async function deleteFiles(paths: string[]) {
  await Promise.all(paths.map((p) => fs.unlink(path.join(config.rootDir, 'uploads', p)).catch(() => {})));
}

/**
 * GC：扫描 uploads 目录，返回所有未被 DB 引用的文件列表
 * 不自动删除，只返回列表供管理员确认
 */
export async function findOrphanedFiles(allReferenced: string[]): Promise<{ originals: string[]; displays: string[] }> {
  const referenced = new Set(allReferenced.map((p) => path.normalize(p)));

  const [originals, displays] = await Promise.all([
    fs.readdir(paths.originals).catch(() => [] as string[]),
    fs.readdir(paths.displays).catch(() => [] as string[]),
  ]);

  return {
    originals: originals.filter((f) => !referenced.has(path.normalize(`originals/${f}`))),
    displays: displays.filter((f) => !referenced.has(path.normalize(`displays/${f}`))),
  };
}

/**
 * 永久删除闲置文件（GC 执行）
 */
export async function removeOrphanedFiles(originals: string[], displays: string[]) {
  await Promise.all([
    ...originals.map((f) => fs.unlink(path.join(paths.originals, f)).catch(() => {})),
    ...displays.map((f) => fs.unlink(path.join(paths.displays, f)).catch(() => {})),
  ]);
}

/**
 * 裁剪 + 旋转原图，覆盖展示图
 * @returns 新展示图文件大小
 */
export async function cropDisplay(
  originalPath: string,
  displayPath: string,
  opts: { x: number; y: number; width: number; height: number; rotation: number },
): Promise<number> {
  const src = path.join(config.rootDir, 'uploads', originalPath);
  const dest = path.join(config.rootDir, 'uploads', displayPath);

  let pipeline = sharp(src, { failOn: 'none' })
    .extract({ left: opts.x, top: opts.y, width: opts.width, height: opts.height });

  if (opts.rotation) {
    pipeline = pipeline.rotate(opts.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }

  await pipeline
    .resize({ width: config.displayWidth, withoutEnlargement: true })
    .webp({ quality: config.displayQuality })
    .toFile(dest);

  const stat = await fs.stat(dest);
  return stat.size;
}
