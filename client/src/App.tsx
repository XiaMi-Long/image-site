import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import AdminNav from './components/AdminNav';
import BackgroundEffect from './components/BackgroundEffect';
import PageTransition from './components/PageTransition';
import Gallery from './pages/Gallery';
import AlbumView from './pages/AlbumView';
import Search from './pages/Search';
import ImageDetail from './pages/ImageDetail';
import Login from './pages/admin/Login';
import Upload from './pages/admin/Upload';
import Manage from './pages/admin/Manage';
import Albums from './pages/admin/Albums';
import Lightbox from './components/Lightbox';
import BackToTop from './components/BackToTop';
import { LoadingProvider } from './components/LoadingBar';
import type { ImageItem } from './lib/api';
import { useAuth, AuthProvider } from './store/auth';
import { ToastProvider } from './components/Toast';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthed, checking } = useAuth();
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-muted">验证中…</span>
      </div>
    );
  }
  if (!isAuthed) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';
  // 全局 Lightbox 状态
  const [lightbox, setLightbox] = useState<{ images: ImageItem[]; index: number } | null>(null);

  const openLightbox = useCallback((images: ImageItem[], index: number) => {
    setLightbox({ images, index });
  }, []);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  const next = useCallback(() => {
    setLightbox((lb) => (lb ? { ...lb, index: Math.min(lb.index + 1, lb.images.length - 1) } : null));
  }, []);

  const prev = useCallback(() => {
    setLightbox((lb) => (lb ? { ...lb, index: Math.max(lb.index - 1, 0) } : null));
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <LoadingProvider>
        <div className="min-h-screen">
          <BackgroundEffect />
          <Navbar />
          {isAdminRoute && <AdminNav />}
        <main className={isAdminRoute ? 'pt-24' : 'pt-14'}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><Gallery onImageClick={openLightbox} /></PageTransition>} />
              <Route path="/album/:id" element={<PageTransition><AlbumView onImageClick={openLightbox} /></PageTransition>} />
              <Route path="/search" element={<PageTransition><Search onImageClick={openLightbox} /></PageTransition>} />
              <Route path="/image/:id" element={<PageTransition><ImageDetail /></PageTransition>} />
              <Route path="/admin/login" element={<PageTransition><Login /></PageTransition>} />
              <Route path="/admin/upload" element={<PageTransition><ProtectedRoute><Upload /></ProtectedRoute></PageTransition>} />
              <Route path="/admin/manage" element={<PageTransition><ProtectedRoute><Manage /></ProtectedRoute></PageTransition>} />
              <Route path="/admin/albums" element={<PageTransition><ProtectedRoute><Albums /></ProtectedRoute></PageTransition>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {lightbox && (
            <Lightbox
              images={lightbox.images}
              index={lightbox.index}
              onClose={closeLightbox}
              onPrev={prev}
              onNext={next}
            />
          )}
        </AnimatePresence>
        <BackToTop />
        </div>
        </LoadingProvider>
        </ToastProvider>
      </AuthProvider>
  );
}
