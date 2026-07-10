import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { imageApi, albumApi, tagApi, type ImageItem, type AlbumItem, type TagItem } from '../lib/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import ImageGrid from '../components/ImageGrid';

interface Props {
  onImageClick: (images: ImageItem[], index: number) => void;
}

export default function Gallery({ onImageClick }: Props) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [albumError, setAlbumError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);

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
    setLoading(true);
    loadImages(1).finally(() => setLoading(false));
  }, [loadImages]);

  useEffect(() => {
    albumApi.list().then(setAlbums).catch((e) => setAlbumError(e.message));
    tagApi.list().then(setTags).catch((e) => setTagError(e.message));
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadImages(page + 1);
    setLoadingMore(false);
  };

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="text-sm text-muted">载入中…</span>
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
      {albumError && (
        <div className="mb-6 rounded border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-500">
          相册加载失败: {albumError}
        </div>
      )}
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
      {tagError ? (
        <div className="mb-6 rounded border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-500">
          标签加载失败: {tagError}
        </div>
      ) : tags.length > 0 && (
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
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
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
              <span className="text-sm text-muted">载入更多…</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
