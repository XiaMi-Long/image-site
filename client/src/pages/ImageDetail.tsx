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
        <span className="font-display text-xl text-muted">载入中…</span>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="font-display text-3xl font-bold text-text">图片不存在</div>
        <Link to="/" className="text-sm text-accent">← 返回作品集</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-12 md:py-16">
      <button
        onClick={() => navigate(-1)}
        className="mb-8 inline-block text-xs uppercase tracking-widest2 text-muted hover:text-accent"
      >
        ← 返回
      </button>

      <div className="grid gap-10 md:grid-cols-[1fr_320px]">
        {/* 图片 */}
        <div className="bg-surface">
          <img
            src={showOriginal ? image.originalUrl : image.displayUrl}
            alt={image.title}
            className="w-full object-contain"
          />
        </div>

        {/* 信息 */}
        <aside className="space-y-6">
          <div>
            <span className="label-tag">Title</span>
            <h1 className="mt-2 font-display text-4xl font-bold text-text">{image.title}</h1>
          </div>

          {image.description && (
            <div>
              <span className="label-tag">Description</span>
              <p className="mt-2 text-sm text-text">{image.description}</p>
            </div>
          )}

          {image.tags.length > 0 && (
            <div>
              <span className="label-tag">Tags</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {image.tags.map((t) => (
                  <Link
                    key={t}
                    to={`/search?q=${encodeURIComponent(t)}`}
                    className="border border-border px-3 py-1 text-[11px] uppercase tracking-widest2 text-text hover:border-accent hover:text-accent"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 border-t border-border pt-6 text-xs">
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
              className="btn-outline w-full"
            >
              {showOriginal ? '查看压缩图' : '查看原图'}
            </button>
            <a href={image.downloadUrl} download className="btn-primary w-full">
              下载原图
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
