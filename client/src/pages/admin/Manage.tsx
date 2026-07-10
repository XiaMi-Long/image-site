import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { imageApi, albumApi, type ImageItem, type AlbumItem } from '../../lib/api';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import Select from '../../components/Select';
import ConfirmDialog from '../../components/ConfirmDialog';
import CropDialog from '../../components/CropDialog';
import { Skeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { formatBytes, formatDate } from '../../lib/utils';

export default function Manage() {
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
  const [cropImageId, setCropImageId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterAlbumId, setFilterAlbumId] = useState('');

  const loadImages = useCallback(async (pageNum: number) => {
    const res = await imageApi.list({
      page: pageNum,
      limit: 24,
      albumId: filterAlbumId || undefined,
      sortBy,
      sortOrder,
    });
    if (pageNum === 1) {
      setImages(res.data);
    } else {
      setImages((prev) => [...prev, ...res.data]);
    }
    setHasMore(res.pagination.hasMore);
    setPage(pageNum);
  }, [filterAlbumId, sortBy, sortOrder]);

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">作品管理</h1>
      </div>

      {/* 排序/筛选栏 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded border border-border bg-surface p-0.5">
          {[
            { key: 'createdAt', label: '上传时间' },
            { key: 'fileName', label: '文件名' },
            { key: 'size', label: '大小' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`rounded px-2.5 py-1 text-xs transition-colors ${
                sortBy === opt.key
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-text'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
            className="ml-1 rounded p-1 text-muted hover:text-text"
            title={sortOrder === 'desc' ? '降序' : '升序'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {sortOrder === 'desc'
                ? <path d="M6 9l6 6 6-6" />
                : <path d="M6 15l6-6 6 6" />
              }
            </svg>
          </button>
        </div>

        <div className="w-40">
          <Select
            value={filterAlbumId}
            onChange={(val) => setFilterAlbumId(val)}
            options={[
              { value: '', label: '全部相册' },
              ...albums.map((a) => ({ value: a.id, label: a.name })),
            ]}
            placeholder="全部相册"
          />
        </div>
      </div>

      {/* 批量操作栏 */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="mb-4 flex items-center gap-3 rounded border border-border bg-surface p-3"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {images.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--muted))" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <div className="text-base font-bold text-text">还没有作品</div>
          <Link to="/admin/upload" className="btn-primary">去上传</Link>
        </div>
      ) : (
        <motion.div layout>
          <div className="space-y-1.5">
            <AnimatePresence>
              {images.map((img) => {
              const isSelected = selectedIds.has(img.id);
              return (
                <motion.div
                  key={img.id}
                  layout
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
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
                    <button onClick={(e) => { e.stopPropagation(); setCropImageId(img.id); }} className="btn-outline text-xs px-3 py-1 h-auto hover:border-accent hover:text-accent">裁剪</button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(img.id); }} className="btn-outline text-xs px-3 py-1 h-auto hover:border-red-500 hover:text-red-500">删除</button>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
          <div ref={sentinelRef} className="h-8" />
        </motion.div>
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

      {/* 裁剪弹窗 */}
      {cropImageId && (
        <CropDialog
          imageId={cropImageId}
          imageUrl={images.find((i) => i.id === cropImageId)?.displayUrl || ''}
          onClose={() => setCropImageId(null)}
          onDone={() => loadImages(1)}
        />
      )}

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
