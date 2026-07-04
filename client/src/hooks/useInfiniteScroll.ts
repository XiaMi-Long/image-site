import { useEffect, useRef, useCallback } from 'react';

/**
 * 无限滚动加载
 * @param onLoadMore 触发加载
 * @param hasMore 是否还有更多
 * @param loading 当前是否在加载
 */
export function useInfiniteScroll(onLoadMore: () => void, hasMore: boolean, loading: boolean) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const callback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, loading],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(callback, { rootMargin: '300px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [callback]);

  return sentinelRef;
}
