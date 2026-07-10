import { Link, NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../store/auth';

export default function Navbar() {
  const { isAuthed } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-surface">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 md:px-12">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-base font-semibold text-text">图片收集</span>
        </Link>

        <div className="flex items-center gap-5">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors duration-150 ${
                isActive ? 'text-accent' : 'text-text hover:text-accent'
              }`
            }
          >
            作品集
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors duration-150 ${
                isActive ? 'text-accent' : 'text-text hover:text-accent'
              }`
            }
          >
            搜索
          </NavLink>
          <NavLink
            to={isAuthed ? '/admin/manage' : '/admin/login'}
            className={({ isActive }) =>
              `text-sm font-medium transition-colors duration-150 ${
                isActive ? 'text-accent' : 'text-text hover:text-accent'
              }`
            }
          >
            {isAuthed ? '管理' : '后台'}
          </NavLink>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
