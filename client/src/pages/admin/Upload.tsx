import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { imageApi, albumApi, type AlbumItem } from '../../lib/api';
import { useAuth } from '../../store/auth';
import UploadDropzone from '../../components/UploadDropzone';
import { formatBytes } from '../../lib/utils';

interface PendingItem {
  file: File;
  title: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  message?: string;
}

export default function Upload() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [albumId, setAlbumId] = useState<string>('');
  const [tags, setTags] = useState('');
  const [items, setItems] = useState<PendingItem[]>([]);
  const [uploading, setUploading] = useState(false);

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

  const doneCount = items.filter((i) => i.status === 'done').length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-12 md:py-12">
      {/* 顶栏 */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">上传作品</h1>
        <div className="flex items-center gap-2">
          <Link to="/admin/manage" className="btn-outline text-xs">管理</Link>
          <Link to="/admin/albums" className="btn-outline text-xs">相册</Link>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="btn-outline text-xs"
          >
            退出
          </button>
        </div>
      </div>

      {/* 上传区 */}
      <UploadDropzone onFiles={handleFiles} />

      {/* 配置 */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label className="label-tag mb-1.5 block">归入相册</label>
          <select
            value={albumId}
            onChange={(e) => setAlbumId(e.target.value)}
            className="select-field"
          >
            <option value="">不归入任何相册</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
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
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted">待上传 {items.length} 项 · 已完成 {doneCount}</span>
            <button
              onClick={uploadAll}
              disabled={uploading || doneCount === items.length}
              className="btn-primary"
            >
              {uploading ? '上传中…' : '开始上传'}
            </button>
          </div>

          <div className="space-y-1.5">
            {items.map((it, i) => (
              <div
                key={i}
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
