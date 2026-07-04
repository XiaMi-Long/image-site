import { Link, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-canvas/90 backdrop-blur-md border-b border-border' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-12">
        <Link to="/" className="group flex items-center gap-3">
          <span className="font-display text-2xl font-bold tracking-tight text-text">画廊</span>
          <span className="hidden text-xs font-medium uppercase tracking-widest2 text-muted sm:inline">
            Gallery
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-xs font-medium uppercase tracking-widest2 transition-colors ${
                isActive ? 'text-accent' : 'text-text hover:text-accent'
              }`
            }
          >
            作品集
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `text-xs font-medium uppercase tracking-widest2 transition-colors ${
                isActive ? 'text-accent' : 'text-text hover:text-accent'
              }`
            }
          >
            搜索
          </NavLink>
          <NavLink
            to={isAdmin ? '/admin/manage' : '/admin/login'}
            className={({ isActive }) =>
              `text-xs font-medium uppercase tracking-widest2 transition-colors ${
                isActive ? 'text-accent' : 'text-text hover:text-accent'
              }`
            }
          >
            {isAdmin ? '管理' : '后台'}
          </NavLink>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
