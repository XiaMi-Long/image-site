import { useState, useEffect, useCallback } from 'react';
import { imageApi, type ImageItem } from '../lib/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import ImageGrid from '../components/ImageGrid';
import { GridSkeleton } from '../components/Skeleton';

interface Props {
  onImageClick: (images: ImageItem[], index: number) => void;
}

export default function Search({ onImageClick }: Props) {
  const [query, setQuery] = useState('');
  const [committed, setCommitted] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);

  const loadImages = useCallback(async (pageNum: number, q: string) => {
    const res = await imageApi.list({ page: pageNum, limit: 24, search: q || undefined });
    if (pageNum === 1) {
      setImages(res.data);
    } else {
      setImages((prev) => [...prev, ...res.data]);
    }
    setHasMore(res.pagination.hasMore);
    setPage(pageNum);
  }, []);

  const doSearch = useCallback(
    async (q: string) => {
      setCommitted(q);
      setSearched(true);
      setLoading(true);
      await loadImages(1, q);
      setLoading(false);
    },
    [loadImages],
  );

  useEffect(() => {
    setLoading(true);
    loadImages(1, '').finally(() => setLoading(false));
  }, [loadImages]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadImages(page + 1, committed);
    setLoadingMore(false);
  };

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 md:px-12 md:py-12">
      <h1 className="mb-6 text-2xl font-bold text-text md:text-3xl">搜索</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          doSearch(query);
        }}
        className="mb-8 flex gap-3"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="按标题、描述或标签搜索…"
          className="input-field flex-1"
        />
        <button type="submit" className="btn-primary">
          搜索
        </button>
      </form>

      {searched && committed && (
        <div className="mb-6 text-sm text-muted">
          {loading ? '搜索中…' : `找到 ${images.length} 个与「${committed}」相关的结果`}
        </div>
      )}

      {loading ? (
        <GridSkeleton count={12} />
      ) : images.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3">
          <div className="text-base font-bold text-text">未找到作品</div>
          <p className="text-sm text-muted">试试其他关键词</p>
        </div>
      ) : (
        <>
          <ImageGrid
            images={images}
            onImageClick={(img) => onImageClick(images, images.findIndex((i) => i.id === img.id))}
          />
          <div ref={sentinelRef} className="h-8" />
        </>
      )}
    </div>
  );
}
