import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { albumApi, type AlbumItem } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Skeleton } from '../../components/Skeleton';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

export default function Albums() {
  const { toast } = useToast();
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<{ id: string; name: string } | null>(null);

  const load = () => {
    setLoading(true);
    albumApi.list().then(setAlbums).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await albumApi.create({ name: newName.trim(), description: newDesc.trim() });
      setNewName('');
      setNewDesc('');
      setCreating(false);
      load();
      toast('success', '相册已创建');
    } catch (err: any) {
      toast('error', err.message || '创建失败');
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await albumApi.remove(confirmDeleteId.id);
      setAlbums((prev) => prev.filter((a) => a.id !== confirmDeleteId.id));
      toast('success', '相册已删除');
    } catch (err: any) {
      toast('error', err.message || '删除失败');
    }
    setConfirmDeleteId(null);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8 md:px-12 md:py-12">
        <div className="mb-8 flex items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded border border-border bg-surface p-3">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-7 w-14 shrink-0 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-12 md:py-12">
      {/* 顶栏 */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-text">相册管理</h1>
      </div>

      <div className="mb-6">
        <button onClick={() => setCreating((c) => !c)} className="btn-primary text-xs">
          {creating ? '取消' : '新建相册'}
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="mb-8 rounded border border-border bg-surface p-5">
          <div className="space-y-4">
            <div>
              <label className="label-tag mb-1.5 block">相册名称</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label-tag mb-1.5 block">描述（可选）</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="input-field min-h-[80px] resize-none"
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button type="submit" className="btn-primary">创建</button>
          </div>
        </form>
      )}

      {albums.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--muted))" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          <div className="text-base font-bold text-text">还没有相册</div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {albums.map((a) => (
            <motion.div
              key={a.id}
              layout
              exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
              className="flex items-center gap-4 rounded border border-border bg-surface p-3"
            >
              <Link to={`/album/${a.id}`} className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text hover:text-accent">{a.name}</div>
                {a.description && <div className="mt-0.5 truncate text-xs text-muted">{a.description}</div>}
                <div className="mt-0.5 text-xs text-muted">
                  {a.count || 0} 件作品 · {formatDate(a.createdAt)}
                </div>
              </Link>
              <button
                onClick={() => setConfirmDeleteId({ id: a.id, name: a.name })}
                className="btn-outline text-xs shrink-0 hover:border-red-500 hover:text-red-500"
              >
                删除
              </button>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="删除相册"
        message={`确认删除相册「${confirmDeleteId?.name}」？相册内图片不会被删除，但会变为未分类。`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
