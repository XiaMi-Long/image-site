import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('[error]', err.message);
  // multer 错误
  if (err?.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: '文件大小超过限制（50MB）' });
    return;
  }
  if (err?.message?.includes('仅支持图片文件')) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: err.message || '服务器错误' });
}

export function notFoundMiddleware(_req: Request, res: Response) {
  res.status(404).json({ error: '接口不存在' });
}
