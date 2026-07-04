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
    if (items.length === 0) return;
    setUploading(true);

    // 逐个上传，便于显示进度
    for (let i = 0; i < items.length; i++) {
      if (items[i].status === 'done') continue;
      setItems((prev) => prev.map((it, j) => (j === i ? { ...it, status: 'uploading' } : it)));
      const fd = new FormData();
      fd.append('images', items[i].file);
      fd.append('titles', items[i].title);
      if (albumId) fd.append('albumId', albumId);
      if (tags.trim()) fd.append('tags', tags.trim());
      try {
        await imageApi.upload(fd);
        setItems((prev) => prev.map((it, j) => (j === i ? { ...it, status: 'done' } : it)));
      } catch (err: any) {
        setItems((prev) =>
          prev.map((it, j) => (j === i ? { ...it, status: 'error', message: err.message } : it)),
        );
      }
    }
    setUploading(false);
  };

  const doneCount = items.filter((i) => i.status === 'done').length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-12 md:py-16">
      {/* 顶栏 */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest2 text-accent">Admin</span>
          <h1 className="mt-2 font-display text-4xl font-bold text-text">上传作品</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/manage" className="btn-outline">管理</Link>
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

      {/* 上传区 */}
      <UploadDropzone onFiles={handleFiles} />

      {/* 配置 */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <label className="label-tag mb-2 block">归入相册（可选）</label>
          <select
            value={albumId}
            onChange={(e) => setAlbumId(e.target.value)}
            className="input-field cursor-pointer"
          >
            <option value="">不归入任何相册</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-tag mb-2 block">标签（逗号分隔）</label>
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
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <span className="label-tag">待上传 {items.length} 项 · 已完成 {doneCount}</span>
            <button
              onClick={uploadAll}
              disabled={uploading || doneCount === items.length}
              className="btn-primary"
            >
              {uploading ? '上传中…' : '开始上传'}
            </button>
          </div>

          <div className="space-y-2">
            {items.map((it, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border border-border bg-surface p-3"
              >
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden bg-canvas">
                  <img src={URL.createObjectURL(it.file)} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={it.title}
                    onChange={(e) => updateTitle(i, e.target.value)}
                    disabled={it.status === 'done'}
                    className="w-full border-b border-transparent bg-transparent py-1 font-display text-lg text-text focus:border-accent focus:outline-none"
                  />
                  <div className="mt-1 text-xs text-muted">
                    {formatBytes(it.file.size)}
                    {it.status === 'error' && <span className="ml-2 text-red-500">{it.message}</span>}
                  </div>
                </div>
                <div className="w-20 text-right">
                  {it.status === 'pending' && (
                    <button onClick={() => removeItem(i)} className="text-xs uppercase tracking-widest2 text-muted hover:text-red-500">
                      移除
                    </button>
                  )}
                  {it.status === 'uploading' && <span className="text-xs text-accent">上传中</span>}
                  {it.status === 'done' && <span className="text-xs text-green-600">✓ 完成</span>}
                  {it.status === 'error' && <span className="text-xs text-red-500">失败</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
