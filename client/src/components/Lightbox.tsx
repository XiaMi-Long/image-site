import { useState, useEffect, useCallback } from 'react';
import type { ImageItem } from '../lib/api';

interface Props {
  images: ImageItem[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function Lightbox({ images, index, onClose, onPrev, onNext }: Props) {
  const [showOriginal, setShowOriginal] = useState(false);
  const image = images[index];

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
      else if (e.key === 'o' || e.key === 'O') setShowOriginal((s) => !s);
    },
    [onClose, onPrev, onNext],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  useEffect(() => {
    setShowOriginal(false);
  }, [index]);

  if (!image) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-6 py-4 text-white/80">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-xl font-medium">{image.title}</span>
          <span className="text-xs uppercase tracking-widest2 text-white/50">
            {index + 1} / {images.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOriginal((s) => !s)}
            className="border border-white/30 px-3 py-1.5 text-[10px] uppercase tracking-widest2 text-white/80 transition-colors hover:bg-white/10"
          >
            {showOriginal ? '压缩图' : '原图'}
          </button>
          <a
            href={image.downloadUrl}
            download
            className="border border-white/30 px-3 py-1.5 text-[10px] uppercase tracking-widest2 text-white/80 transition-colors hover:bg-white/10"
          >
            下载
          </a>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border border-white/30 text-white/80 transition-colors hover:bg-white/10"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 图片区 */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-4">
        <button
          onClick={onPrev}
          disabled={index === 0}
          className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center text-white/60 transition-colors hover:text-white disabled:opacity-20"
          aria-label="上一张"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <img
          src={showOriginal ? image.originalUrl : image.displayUrl}
          alt={image.title}
          className="max-h-full max-w-full object-contain fade-in"
          key={image.id + (showOriginal ? '-orig' : '-disp')}
        />

        <button
          onClick={onNext}
          disabled={index === images.length - 1}
          className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center text-white/60 transition-colors hover:text-white disabled:opacity-20"
          aria-label="下一张"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* 底部信息 */}
      <div className="px-6 py-4 text-white/60">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            {image.tags.map((t) => (
              <span key={t} className="uppercase tracking-widest2 text-white/50">
                #{t}
              </span>
            ))}
          </div>
          <span className="uppercase tracking-widest2 text-white/40">
            {showOriginal ? 'Original' : 'Compressed'} · 按 O 切换
          </span>
        </div>
      </div>
    </div>
  );
}
