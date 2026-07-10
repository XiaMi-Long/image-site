import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { imageApi, type ImageItem } from '../lib/api';
import { formatBytes, formatDate } from '../lib/utils';

export default function ImageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [image, setImage] = useState<ImageItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    imageApi.get(id).then(setImage).catch(() => setImage(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="text-sm text-muted">载入中…</span>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="text-base font-bold text-text">图片不存在</div>
        <Link to="/" className="text-sm text-accent">← 返回作品集</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-12 md:py-12">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-block text-xs text-muted hover:text-accent"
      >
        ← 返回
      </button>

      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        {/* 图片 */}
        <div className="bg-surface">
          <img
            src={showOriginal ? image.originalUrl : image.displayUrl}
            alt={image.title}
            className="w-full object-contain"
          />
        </div>

        {/* 信息 */}
        <aside className="space-y-5">
          <div>
            <span className="label-tag">标题</span>
            <h1 className="mt-1.5 text-xl font-bold text-text">{image.title}</h1>
          </div>

          {image.description && (
            <div>
              <span className="label-tag">描述</span>
              <p className="mt-1.5 text-sm text-text">{image.description}</p>
            </div>
          )}

          {image.tags.length > 0 && (
            <div>
              <span className="label-tag">标签</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {image.tags.map((t) => (
                  <Link
                    key={t}
                    to={`/search?q=${encodeURIComponent(t)}`}
                    className="rounded border border-border px-2 py-0.5 text-xs text-text hover:border-accent hover:text-accent"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5 border-t border-border pt-5 text-xs">
            <div className="flex justify-between text-muted">
              <span>文件名</span>
              <span className="text-text">{image.fileName}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>原图大小</span>
              <span className="text-text">{formatBytes(image.size)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>展示图大小</span>
              <span className="text-text">{formatBytes(image.displaySize)}</span>
            </div>
            {image.width && image.height && (
              <div className="flex justify-between text-muted">
                <span>尺寸</span>
                <span className="text-text">{image.width} × {image.height}</span>
              </div>
            )}
            <div className="flex justify-between text-muted">
              <span>上传时间</span>
              <span className="text-text">{formatDate(image.createdAt)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setShowOriginal((s) => !s)}
              className="btn-outline w-full text-xs"
            >
              {showOriginal ? '查看压缩图' : '查看原图'}
            </button>
            <a href={image.downloadUrl} download className="btn-primary w-full text-xs">
              下载原图
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
