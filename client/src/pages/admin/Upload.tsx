import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { imageApi, albumApi, type AlbumItem } from '../../lib/api';
import UploadDropzone from '../../components/UploadDropzone';
import Select from '../../components/Select';
import { formatBytes } from '../../lib/utils';

interface PendingItem {
  file: File;
  title: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  message?: string;
}

export default function Upload() {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [albumId, setAlbumId] = useState<string>('');
  const [tags, setTags] = useState('');
  const [items, setItems] = useState<PendingItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [batchPrefix, setBatchPrefix] = useState('');
  const [batchPrefixOpen, setBatchPrefixOpen] = useState(false);

  useEffect(() => {
    albumApi.list().then(setAlbums).catch(() => {});
  }, []);

  const handleFiles = (files: File[]) => {
    const newItems: PendingItem[] = files.map((f) => ({
      file: f,
      title: f.name.replace(/\.[^.]+$/, ''),
      status: 'pending',
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateTitle = (idx: number, title: string) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, title } : it)));
  };

  const uploadAll = async () => {
    const totalItems = items.length;
    if (totalItems === 0) return;
    setUploading(true);

    const CONCURRENCY = 5;

    for (let start = 0; start < totalItems; start += CONCURRENCY) {
      const end = Math.min(start + CONCURRENCY, totalItems);

      for (let i = start; i < end; i++) {
        if (items[i].status === 'done') continue;
        const idx = i;
        setItems((prev) => prev.map((it, j) => (j === idx ? { ...it, status: 'uploading' } : it)));
      }

      const promises = [];
      for (let i = start; i < end; i++) {
        if (items[i].status === 'done') continue;
        const idx = i;
        const fd = new FormData();
        fd.append('images', items[i].file);
        fd.append('titles', items[i].title);
        if (albumId) fd.append('albumId', albumId);
        if (tags.trim()) fd.append('tags', tags.trim());
        promises.push(
          imageApi
            .upload(fd)
            .then(() =>
              setItems((prev) => prev.map((it, j) => (j === idx ? { ...it, status: 'done' } : it))),
            )
            .catch((err) =>
              setItems((prev) =>
                prev.map((it, j) => (j === idx ? { ...it, status: 'error', message: err.message } : it)),
              ),
            ),
        );
      }

      await Promise.allSettled(promises);
    }

    setUploading(false);
  };

  const applyBatchRename = () => {
    const prefix = batchPrefix.trim();
    if (!prefix) return;
    setItems((prev) => prev.map((it, i) => ({ ...it, title: `${prefix} ${i + 1}` })));
    setBatchPrefixOpen(false);
  };

  const doneCount = items.filter((i) => i.status === 'done').length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-12 md:py-12">
      {/* 顶栏 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">上传作品</h1>
      </div>

      {/* 上传区 */}
      <UploadDropzone onFiles={handleFiles} />

      {/* 配置 */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label className="label-tag mb-1.5 block">归入相册</label>
          <Select
            value={albumId}
            onChange={setAlbumId}
            options={[
              { value: '', label: '不归入任何相册' },
              ...albums.map((a) => ({ value: a.id, label: a.name })),
            ]}
            placeholder="不归入任何相册"
          />
        </div>
        <div>
          <label className="label-tag mb-1.5 block">标签（逗号分隔）</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="风景, 城市, 人像"
            className="input-field"
          />
        </div>
      </div>

      {/* 待上传列表 */}
      {items.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-muted">待上传 {items.length} 项 · 已完成 {doneCount}</span>
            <div className="flex items-center gap-2">
              {batchPrefixOpen ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={batchPrefix}
                    onChange={(e) => setBatchPrefix(e.target.value)}
                    placeholder="输入前缀…"
                    className="input-field h-8 w-32 text-xs"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && applyBatchRename()}
                  />
                  <button onClick={applyBatchRename} className="btn-primary text-xs h-8">应用</button>
                  <button onClick={() => setBatchPrefixOpen(false)} className="btn-outline text-xs h-8">取消</button>
                </div>
              ) : (
                <button
                  onClick={() => setBatchPrefixOpen(true)}
                  disabled={uploading || items.length === 0}
                  className="btn-outline text-xs"
                >
                  统一命名
                </button>
              )}
              <button
                onClick={uploadAll}
                disabled={uploading || doneCount === items.length}
                className="btn-primary"
              >
                {uploading ? '上传中…' : '开始上传'}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <AnimatePresence>
              {items.map((it, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex items-center gap-3 rounded border border-border bg-surface p-2.5"
                >
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-canvas">
                    <img src={URL.createObjectURL(it.file)} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={it.title}
                      onChange={(e) => updateTitle(i, e.target.value)}
                      disabled={it.status === 'done'}
                      className="w-full border-b border-transparent bg-transparent py-0.5 text-sm text-text focus:border-accent focus:outline-none"
                    />
                    <div className="mt-0.5 text-xs text-muted">
                      {formatBytes(it.file.size)}
                      {it.status === 'error' && <span className="ml-2 text-red-500">{it.message}</span>}
                    </div>
                  </div>
                  <div className="w-16 shrink-0 text-right text-xs">
                    {it.status === 'pending' && (
                      <button onClick={() => removeItem(i)} className="text-muted hover:text-red-500">
                        移除
                      </button>
                    )}
                    {it.status === 'uploading' && <span className="text-accent">上传中</span>}
                    {it.status === 'done' && <span className="text-green-600">完成</span>}
                    {it.status === 'error' && <span className="text-red-500">失败</span>}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
