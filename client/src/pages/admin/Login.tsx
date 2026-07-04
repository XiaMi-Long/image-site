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
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-12 text-center">
        <span className="text-xs font-bold uppercase tracking-widest2 text-accent">Admin</span>
        <h1 className="mt-4 font-display text-5xl font-bold text-text">登录</h1>
        <p className="mt-3 text-sm text-muted">仅管理员可访问后台</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="label-tag mb-2 block">用户名</label>
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
          <label className="label-tag mb-2 block">密码</label>
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
          <div className="border-l-2 border-red-500 bg-red-500/5 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? '登录中…' : '登 录'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link to="/" className="text-xs uppercase tracking-widest2 text-muted hover:text-accent">
          ← 返回画廊
        </Link>
      </div>
    </div>
  );
}
