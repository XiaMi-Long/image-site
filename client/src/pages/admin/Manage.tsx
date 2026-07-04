import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { imageApi, albumApi, type ImageItem, type AlbumItem } from '../../lib/api';
import { useAuth } from '../../store/auth';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { formatBytes, formatDate } from '../../lib/utils';

export default function Manage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editing, setEditing] = useState<ImageItem | null>(null);

  const loadImages = useCallback(async (pageNum: number) => {
    const res = await imageApi.list({ page: pageNum, limit: 24 });
    if (pageNum === 1) {
      setImages(res.data);
    } else {
      setImages((prev) => [...prev, ...res.data]);
    }
    setHasMore(res.pagination.hasMore);
    setPage(pageNum);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadImages(1).finally(() => setLoading(false));
    albumApi.list().then(setAlbums).catch(() => {});
  }, [loadImages]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadImages(page + 1);
    setLoadingMore(false);
  };

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此图片？原图与展示图都会被删除。')) return;
    try {
      await imageApi.remove(id);
      setImages((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      const updated = await imageApi.update(editing.id, {
        title: editing.title,
        description: editing.description,
        albumId: editing.albumId,
        tags: editing.tags,
      });
      setImages((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setEditing(null);
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-12 md:py-16">
      {/* 顶栏 */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest2 text-accent">Admin</span>
          <h1 className="mt-2 font-display text-4xl font-bold text-text">作品管理</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/upload" className="btn-outline">上传</Link>
          <Link to="/admin/albums" className="btn-outline">相册</Link>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="btn-outline"
          >
            退出
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <span className="font-display text-xl text-muted">载入中…</span>
        </div>
      ) : images.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-4">
          <div className="font-display text-3xl font-bold text-text">还没有作品</div>
          <Link to="/admin/upload" className="btn-primary">去上传</Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {images.map((img) => (
              <div
                key={img.id}
                className="flex items-center gap-4 border border-border bg-surface p-3"
              >
                <Link to={`/image/${img.id}`} className="h-20 w-20 flex-shrink-0 overflow-hidden bg-canvas">
                  <img src={img.displayUrl} alt={img.title} className="h-full w-full object-cover" />
                </Link>
                <div className="flex-1">
                  <div className="font-display text-xl font-medium text-text">{img.title}</div>
                  <div className="mt-1 text-xs text-muted">
                    {formatBytes(img.size)} · {formatDate(img.createdAt)}
                    {img.tags.length > 0 && ` · ${img.tags.map((t) => '#' + t).join(' ')}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(img)}
                    className="border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest2 text-text hover:border-accent hover:text-accent"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest2 text-text hover:border-red-500 hover:text-red-500"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div ref={sentinelRef} className="h-12" />
        </>
      )}

      {/* 编辑弹窗 */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div
            className="w-full max-w-md border border-border bg-canvas p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-6 font-display text-2xl font-bold text-text">编辑作品</h2>

            <div className="space-y-4">
              <div>
                <label className="label-tag mb-2 block">标题</label>
                <input
                  type="text"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-tag mb-2 block">描述</label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="input-field min-h-[80px] resize-none"
                />
              </div>
              <div>
                <label className="label-tag mb-2 block">相册</label>
                <select
                  value={editing.albumId || ''}
                  onChange={(e) => setEditing({ ...editing, albumId: e.target.value || null })}
                  className="input-field cursor-pointer"
                >
                  <option value="">无</option>
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-tag mb-2 block">标签（逗号分隔）</label>
                <input
                  type="text"
                  value={editing.tags.join(', ')}
                  onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="btn-outline">取消</button>
              <button onClick={handleSaveEdit} className="btn-primary">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
