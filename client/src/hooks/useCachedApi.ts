import { useState, useEffect, useRef, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const store = new Map<string, CacheEntry<any>>();
const TTL = 60_000; // 1 minute

/**
 * Lightweight stale-while-revalidate hook.
 * Returns cached data immediately, refreshes in background if stale.
 */
export function useCachedApi<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = TTL,
): { data: T | null; loading: boolean; error: string | null; refresh: () => void } {
  const [data, setData] = useState<T | null>(() => {
    const entry = store.get(key);
    return entry ? entry.data : null;
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!store.has(key));
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    const entry = store.get(key);
    if (entry && Date.now() - entry.ts < ttl) {
      setData(entry.data);
      setLoading(false);
      return;
    }

    // Show stale while revalidating
    if (!entry) setLoading(true);
    try {
      const result = await fetcher();
      store.set(key, { data: result, ts: Date.now() });
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
        setError(null);
      }
    } catch (err: any) {
      if (mountedRef.current && !entry) {
        setError(err.message || '加载失败');
        setLoading(false);
      }
    }
  }, [key, fetcher, ttl]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  const refresh = useCallback(() => {
    store.delete(key);
    load();
  }, [key, load]);

  return { data, loading, error, refresh };
}
