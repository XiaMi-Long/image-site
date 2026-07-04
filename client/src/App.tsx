import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import Navbar from './components/Navbar';
import Gallery from './pages/Gallery';
import AlbumView from './pages/AlbumView';
import Search from './pages/Search';
import ImageDetail from './pages/ImageDetail';
import Login from './pages/admin/Login';
import Upload from './pages/admin/Upload';
import Manage from './pages/admin/Manage';
import Albums from './pages/admin/Albums';
import Lightbox from './components/Lightbox';
import type { ImageItem } from './lib/api';
import { useAuth } from './store/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthed, checking } = useAuth();
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="font-display text-xl text-muted">验证中…</span>
      </div>
    );
  }
  if (!isAuthed) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
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
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        <Routes>
          <Route path="/" element={<Gallery onImageClick={openLightbox} />} />
          <Route path="/album/:id" element={<AlbumView onImageClick={openLightbox} />} />
          <Route path="/search" element={<Search onImageClick={openLightbox} />} />
          <Route path="/image/:id" element={<ImageDetail />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/admin/manage" element={<ProtectedRoute><Manage /></ProtectedRoute>} />
          <Route path="/admin/albums" element={<ProtectedRoute><Albums /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={closeLightbox}
          onPrev={prev}
          onNext={next}
        />
      )}
    </div>
  );
}
