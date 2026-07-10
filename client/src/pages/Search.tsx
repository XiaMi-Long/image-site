import { useState, useEffect, useCallback } from 'react';
import { imageApi, tagApi, type ImageItem, type TagItem } from '../lib/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import ImageGrid from '../components/ImageGrid';
import { GridSkeleton } from '../components/Skeleton';
import { useCachedApi } from '../hooks/useCachedApi';

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
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data: tags } = useCachedApi('search-tags', () => tagApi.list());

  const loadImages = useCallback(async (pageNum: number, q: string, tag?: string) => {
    const res = await imageApi.list({ page: pageNum, limit: 24, search: q || undefined, tag });
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
      setActiveTag(null);
      setSearched(true);
      setLoading(true);
      await loadImages(1, q);
      setLoading(false);
    },
    [loadImages],
  );

  const filterByTag = useCallback(
    async (tag: string) => {
      setActiveTag(tag);
      setQuery('');
      setCommitted('');
      setSearched(true);
      setLoading(true);
      await loadImages(1, '', tag);
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
    await loadImages(page + 1, committed, activeTag || undefined);
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

      {tags && tags.length > 0 && !committed && (
        <div className="mb-6">
          <div className="mb-2 text-xs font-medium text-muted">热门标签</div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <button
                key={t.name}
                onClick={() => filterByTag(t.name)}
                className={`rounded px-2.5 py-1 text-xs transition-colors ${
                  activeTag === t.name
                    ? 'bg-accent text-white'
                    : 'border border-border text-text hover:border-accent hover:text-accent'
                }`}
              >
                {t.name} · {t.count}
              </button>
            ))}
          </div>
        </div>
      )}

      {searched && committed && (
        <div className="mb-6 text-sm text-muted">
          {loading ? '搜索中…' : `找到 ${images.length} 个与「${committed}」相关的结果`}
        </div>
      )}

      {activeTag && !committed && (
        <div className="mb-6 text-sm text-muted">
          {loading ? '搜索中…' : `标签「${activeTag}」下的 ${images.length} 个作品`}
        </div>
      )}

      {loading ? (
        <GridSkeleton count={12} />
      ) : images.length === 0 && (committed || activeTag) ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--muted))" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <div className="text-base font-bold text-text">未找到作品</div>
          <p className="text-sm text-muted">试试其他关键词或标签</p>
        </div>
      ) : images.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--muted))" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <div className="text-base font-bold text-text">搜索作品</div>
          <p className="text-sm text-muted">输入关键词或点击标签开始浏览</p>
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
