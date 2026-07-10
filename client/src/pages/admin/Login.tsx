import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../lib/api';
import { useAuth } from '../../store/auth';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, username: name } = await authApi.login(username, password);
      login(token, name);
      navigate('/admin/manage');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-6 py-16">
      <div className="mb-10 text-center">
        <h1 className="mb-2 text-2xl font-bold text-text">管理员登录</h1>
        <p className="text-sm text-muted">仅管理员可访问后台</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label-tag mb-1.5 block">用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label className="label-tag mb-1.5 block">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <div className="rounded border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-500">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? '登录中…' : '登录'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link to="/" className="text-sm text-muted transition-colors hover:text-accent">
          返回首页
        </Link>
      </div>
    </div>
  );
}
