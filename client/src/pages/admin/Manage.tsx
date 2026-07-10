import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { imageApi, albumApi, type ImageItem, type AlbumItem } from '../../lib/api';
import { useAuth } from '../../store/auth';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import Select from '../../components/Select';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Skeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { formatBytes, formatDate } from '../../lib/utils';

export default function Manage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editing, setEditing] = useState<ImageItem | null>(null);
  const [albumError, setAlbumError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);
  const [batchAlbumId, setBatchAlbumId] = useState('');

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
    loadImages(1).catch((e: Error) => toast('error', e.message)).finally(() => setLoading(false));
    albumApi.list().then(setAlbums).catch((e) => setAlbumError(e.message));
  }, [loadImages, toast]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadImages(page + 1);
    setLoadingMore(false);
  };

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(images.map((i) => i.id)));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await imageApi.remove(id);
      setImages((prev) => prev.filter((i) => i.id !== id));
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      toast('success', '已删除');
    } catch (err: any) {
      toast('error', err.message || '删除失败');
    }
    setConfirmDelete(null);
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(ids.map((id) => imageApi.remove(id)));
      setImages((prev) => prev.filter((i) => !selectedIds.has(i.id)));
      setSelectedIds(new Set());
      toast('success', `已删除 ${ids.length} 项`);
    } catch (err: any) {
      toast('error', err.message || '批量删除失败');
    }
    setConfirmBatchDelete(false);
  };

  const handleBatchMove = async () => {
    if (!batchAlbumId) return;
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(ids.map((id) => imageApi.update(id, { albumId: batchAlbumId })));
      setImages((prev) => prev.map((i) => (selectedIds.has(i.id) ? { ...i, albumId: batchAlbumId } : i)));
      setSelectedIds(new Set());
      setBatchAlbumId('');
      toast('success', `已移动 ${ids.length} 项`);
    } catch (err: any) {
      toast('error', err.message || '批量移动失败');
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
      toast('success', '保存成功');
    } catch (err: any) {
      toast('error', err.message || '保存失败');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-12 md:py-12">
        <div className="mb-8 flex items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded border border-border bg-surface p-2.5">
              <Skeleton className="h-14 w-14 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-7 w-14 rounded-md" />
                <Skeleton className="h-7 w-14 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 md:px-12 md:py-12">
      {/* 顶栏 */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">作品管理</h1>
        <div className="flex items-center gap-2">
          <Link to="/admin/upload" className="btn-outline text-xs">上传</Link>
          <Link to="/admin/albums" className="btn-outline text-xs">相册</Link>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="btn-outline text-xs"
          >
            退出
          </button>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded border border-border bg-surface p-3">
          <span className="text-sm text-text">已选中 {selectedIds.size} 项</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setConfirmBatchDelete(true)} className="btn-danger text-xs">
              删除
            </button>
            <Select
              value={batchAlbumId}
              onChange={setBatchAlbumId}
              options={[
                { value: '', label: '移至相册…' },
                ...albums.map((a) => ({ value: a.id, label: a.name })),
              ]}
              placeholder="移至相册…"
            />
            {batchAlbumId && (
              <button onClick={handleBatchMove} className="btn-primary text-xs">
                移动
              </button>
            )}
          </div>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-muted hover:text-text">
            取消选择
          </button>
        </div>
      )}

      {images.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3">
          <div className="text-base font-bold text-text">还没有作品</div>
          <Link to="/admin/upload" className="btn-primary">去上传</Link>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            {images.map((img) => {
              const isSelected = selectedIds.has(img.id);
              return (
                <div
                  key={img.id}
                  onClick={() => toggleSelect(img.id)}
                  className={`flex items-center gap-3 rounded border p-2.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-accent bg-accent/5'
                      : 'border-border bg-surface hover:border-accent/50'
                  }`}
                >
                  <Link to={`/image/${img.id}`} className="h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-canvas" onClick={(e) => e.stopPropagation()}>
                    <img src={img.displayUrl} alt={img.title} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium text-text">{img.title}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      {formatBytes(img.size)} · {formatDate(img.createdAt)}
                      {img.tags.length > 0 && ` · ${img.tags.map((t) => '#' + t).join(' ')}`}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); setEditing(img); }} className="btn-outline text-xs px-3 py-1 h-auto">编辑</button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(img.id); }} className="btn-outline text-xs px-3 py-1 h-auto hover:border-red-500 hover:text-red-500">删除</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={sentinelRef} className="h-8" />
        </>
      )}

      {/* 确认弹窗 */}
      <ConfirmDialog
        open={confirmBatchDelete}
        title="批量删除"
        message={`确认删除选中的 ${selectedIds.size} 项？原图与展示图都会被删除。`}
        onConfirm={handleBatchDelete}
        onCancel={() => setConfirmBatchDelete(false)}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="删除图片"
        message="确认删除此图片？原图与展示图都会被删除。"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* 编辑弹窗 */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 modal-enter" onClick={() => setEditing(null)}>
          <div
            className="w-full max-w-md rounded-lg border border-border bg-elevated p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-5 text-lg font-bold text-text">编辑作品</h2>

            <div className="space-y-4">
              <div>
                <label className="label-tag mb-1.5 block">标题</label>
                <input
                  type="text"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-tag mb-1.5 block">描述</label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="input-field min-h-[80px] resize-none"
                />
              </div>
              <div>
                <label className="label-tag mb-1.5 block">相册</label>
                  {albumError ? (
                    <div className="text-xs text-red-500">相册加载失败: {albumError}</div>
                  ) : (
                    <Select
                      value={editing.albumId || ''}
                      onChange={(val) => setEditing({ ...editing, albumId: val || null })}
                      options={[
                        { value: '', label: '无' },
                        ...albums.map((a) => ({ value: a.id, label: a.name })),
                      ]}
                      placeholder="无"
                    />
                  )}
              </div>
              <div>
                <label className="label-tag mb-1.5 block">标签（逗号分隔）</label>
                <input
                  type="text"
                  value={editing.tags.join(', ')}
                  onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-outline">取消</button>
              <button onClick={handleSaveEdit} className="btn-primary">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
