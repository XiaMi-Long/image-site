import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { imageApi, albumApi, type ImageItem, type AlbumItem } from '../lib/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import ImageGrid from '../components/ImageGrid';

interface Props {
  onImageClick: (images: ImageItem[], index: number) => void;
}

export default function AlbumView({ onImageClick }: Props) {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<AlbumItem | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadImages = useCallback(
    async (pageNum: number) => {
      if (!id) return;
      const res = await imageApi.list({ page: pageNum, limit: 24, albumId: id });
      if (pageNum === 1) {
        setImages(res.data);
      } else {
        setImages((prev) => [...prev, ...res.data]);
      }
      setHasMore(res.pagination.hasMore);
      setPage(pageNum);
    },
    [id],
  );

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([albumApi.get(id), loadImages(1)])
      .then(([a]) => setAlbum(a))
      .finally(() => setLoading(false));
  }, [id, loadImages]);

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
      <Link to="/" className="mb-8 inline-block text-xs uppercase tracking-widest2 text-muted hover:text-accent">
        ← 返回作品集
      </Link>

      <div className="mb-12">
        <span className="text-xs font-bold uppercase tracking-widest2 text-accent">Album</span>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-text md:text-7xl">
          {album?.name || '相册'}
        </h1>
        {album?.description && (
          <p className="mt-4 max-w-xl text-sm text-muted">{album.description}</p>
        )}
      </div>

      {images.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
          <div className="font-display text-3xl font-bold text-text">相册暂无图片</div>
        </div>
      ) : (
        <>
          <ImageGrid
            images={images}
            onImageClick={(img) => onImageClick(images, images.findIndex((i) => i.id === img.id))}
          />
          <div ref={sentinelRef} className="h-12" />
        </>
      )}
    </div>
  );
}
