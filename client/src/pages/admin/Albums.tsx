import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { albumApi, type AlbumItem } from '../../lib/api';
import { useAuth } from '../../store/auth';
import { formatDate } from '../../lib/utils';

export default function Albums() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

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
    } catch (err: any) {
      alert(err.message || '创建失败');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确认删除相册「${name}」？相册内图片不会被删除，但会变为未分类。`)) return;
    try {
      await albumApi.remove(id);
      load();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-12 md:py-12">
      {/* 顶栏 */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">相册管理</h1>
        <div className="flex items-center gap-2">
          <Link to="/admin/upload" className="btn-outline text-xs">上传</Link>
          <Link to="/admin/manage" className="btn-outline text-xs">作品</Link>
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

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <span className="text-sm text-muted">载入中…</span>
        </div>
      ) : albums.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3">
          <div className="text-base font-bold text-text">还没有相册</div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {albums.map((a) => (
            <div key={a.id} className="flex items-center gap-4 rounded border border-border bg-surface p-3">
              <Link to={`/album/${a.id}`} className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text hover:text-accent">{a.name}</div>
                {a.description && <div className="mt-0.5 truncate text-xs text-muted">{a.description}</div>}
                <div className="mt-0.5 text-xs text-muted">
                  {a.count || 0} 件作品 · {formatDate(a.createdAt)}
                </div>
              </Link>
              <button
                onClick={() => handleDelete(a.id, a.name)}
                className="btn-outline text-xs shrink-0 hover:border-red-500 hover:text-red-500"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
