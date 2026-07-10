import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

const links = [
  { to: '/admin/upload', label: '上传' },
  { to: '/admin/manage', label: '作品管理' },
  { to: '/admin/albums', label: '相册管理' },
];

export default function AdminNav() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="fixed top-14 left-0 right-0 z-30 flex h-10 items-center border-b border-border bg-surface px-6 md:px-12">
      <nav className="mx-auto flex w-full max-w-7xl items-center gap-0.5">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex h-full items-center px-3 text-sm font-medium transition-colors duration-150 border-b-2 ${
                isActive
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-text'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="ml-auto text-xs text-muted transition-colors hover:text-red-500"
        >
          退出
        </button>
      </nav>
    </div>
  );
}
