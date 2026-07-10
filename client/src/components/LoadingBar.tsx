import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

interface LoadingContextValue {
  loading: boolean;
  addPending: () => void;
  removePending: () => void;
}

const LoadingContext = createContext<LoadingContextValue>({ loading: false, addPending: () => {}, removePending: () => {} });

export function useLoading() {
  return useContext(LoadingContext);
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const countRef = useRef(0);

  const addPending = useCallback(() => {
    countRef.current++;
    if (countRef.current === 1) setLoading(true);
  }, []);

  const removePending = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1);
    if (countRef.current === 0) setLoading(false);
  }, []);

  // Track all axios requests globally
  useEffect(() => {
    const reqId = axios.interceptors.request.use((cfg) => {
      // Don't show loading bar for uploads (multipart)
      if (cfg.data instanceof FormData) return cfg;
      addPending();
      return cfg;
    }, (err) => { removePending(); return Promise.reject(err); });
    const resId = axios.interceptors.response.use(
      (res) => { removePending(); return res; },
      (err) => { removePending(); return Promise.reject(err); },
    );
    return () => {
      axios.interceptors.request.eject(reqId);
      axios.interceptors.response.eject(resId);
    };
  }, [addPending, removePending]);

  return (
    <LoadingContext.Provider value={{ loading, addPending, removePending }}>
      {children}
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 overflow-hidden">
          <div className="h-full w-full origin-left animate-loading-bar bg-accent" />
        </div>
      )}
    </LoadingContext.Provider>
  );
}
