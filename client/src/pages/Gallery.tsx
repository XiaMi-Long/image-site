import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { imageApi, albumApi, tagApi, type ImageItem, type AlbumItem, type TagItem } from '../lib/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import ImageGrid from '../components/ImageGrid';
import { GridSkeleton, Skeleton } from '../components/Skeleton';
import { useCachedApi } from '../hooks/useCachedApi';

interface Props {
  onImageClick: (images: ImageItem[], index: number) => void;
}

export default function Gallery({ onImageClick }: Props) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: albumsData } = useCachedApi('gallery-albums', () => albumApi.list());
  const { data: tagsData } = useCachedApi('gallery-tags', () => tagApi.list());
  const albums = albumsData ?? [];
  const tags = tagsData ?? [];

  const loadImages = useCallback(async (pageNum: number) => {
    const res = await imageApi.list({ page: pageNum, limit: 24, tag: activeTag || undefined });
    if (pageNum === 1) {
      setImages(res.data);
    } else {
      setImages((prev) => [...prev, ...res.data]);
    }
    setHasMore(res.pagination.hasMore);
    setPage(pageNum);
  }, [activeTag]);

  useEffect(() => {
    setError(null);
    setLoading(true);
    loadImages(1).catch((e: Error) => {
      setError(e.message || '加载失败');
    }).finally(() => setLoading(false));
  }, [loadImages]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadImages(page + 1);
    setLoadingMore(false);
  };

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-12 md:py-12">
        <div className="mb-8">
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-8 w-24 rounded" />
            <Skeleton className="h-8 w-20 rounded" />
          </div>
        </div>
        <GridSkeleton count={12} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="text-base font-bold text-text">加载失败</div>
        <p className="text-sm text-muted">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary text-xs">
          刷新页面
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 md:px-12 md:py-12">
      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text md:text-3xl">作品集</h1>
      </div>

      {/* 相册导航 */}
      {albums.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap gap-2">
            {albums.map((a) => (
              <Link
                key={a.id}
                to={`/album/${a.id}`}
                className="rounded border border-border px-3 py-1.5 text-sm text-text transition-colors hover:border-accent hover:text-accent"
              >
                {a.name}
                <span className="ml-1 text-xs text-muted">{a.count || 0}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 标签筛选 */}
      {tags.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTag(null)}
              className={`rounded px-2.5 py-1 text-xs transition-colors ${
                !activeTag ? 'bg-accent text-white' : 'border border-border text-text hover:border-accent hover:text-accent'
              }`}
            >
              全部
            </button>
            {tags.map((t) => (
              <button
                key={t.name}
                onClick={() => setActiveTag(t.name)}
                className={`rounded px-2.5 py-1 text-xs transition-colors ${
                  activeTag === t.name ? 'bg-accent text-white' : 'border border-border text-text hover:border-accent hover:text-accent'
                }`}
              >
                {t.name} · {t.count}
              </button>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--muted))" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <div className="text-lg font-bold text-text">还没有作品</div>
          <p className="text-sm text-muted">去上传你的第一张图片</p>
        </div>
      ) : (
        <>
          <ImageGrid
            images={images}
            onImageClick={(img) => onImageClick(images, images.findIndex((i) => i.id === img.id))}
          />
          <div ref={sentinelRef} className="h-8" />
          {loadingMore && (
            <div className="py-6 text-center">
              <span className="text-sm text-muted animate-pulse">载入更多…</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
