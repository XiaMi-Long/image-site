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
    albumApi.list().then(setAlbums).catch(() => {});
    tagApi.list().then(setTags).catch(() => {});
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
        <span className="font-display text-xl text-muted">载入中…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-12 md:py-16">
      {/* 标题区 */}
      <div className="mb-12 md:mb-16">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-widest2 text-accent">Collection</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-text md:text-7xl">
          作 品 集
        </h1>
        <p className="mt-4 max-w-xl text-sm text-muted">
          一个收藏与展示影像的空间。点击作品查看原图，按相册或标签浏览。
        </p>
      </div>

      {/* 相册导航 */}
      {albums.length > 0 && (
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-4">
            <span className="label-tag">Albums</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="flex flex-wrap gap-3">
            {albums.map((a) => (
              <Link
                key={a.id}
                to={`/album/${a.id}`}
                className="group border border-border px-5 py-3 transition-colors hover:border-accent"
              >
                <div className="font-display text-lg font-medium text-text group-hover:text-accent">
                  {a.name}
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-widest2 text-muted">
                  {a.count || 0} 件作品
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 标签筛选 */}
      {tags.length > 0 && (
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-4">
            <span className="label-tag">Tags</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTag(null)}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-widest2 transition-colors ${
                !activeTag ? 'bg-accent text-canvas' : 'border border-border text-text hover:border-accent'
              }`}
            >
              全部
            </button>
            {tags.map((t) => (
              <button
                key={t.name}
                onClick={() => setActiveTag(t.name)}
                className={`px-3 py-1.5 text-[11px] uppercase tracking-widest2 transition-colors ${
                  activeTag === t.name ? 'bg-accent text-canvas' : 'border border-border text-text hover:border-accent'
                }`}
              >
                #{t.name} · {t.count}
              </button>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
          <div className="font-display text-4xl font-bold text-text">画廊空空如也</div>
          <p className="text-sm text-muted">尚未上传任何作品</p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-4">
            <span className="label-tag">Works</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <ImageGrid
            images={images}
            onImageClick={(img) => onImageClick(images, images.findIndex((i) => i.id === img.id))}
          />
          <div ref={sentinelRef} className="h-12" />
          {loadingMore && (
            <div className="py-8 text-center">
              <span className="font-display text-sm text-muted">载入更多…</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
