import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MobileBottomNav } from '../components/MobileBottomNav';

const navItems = [
  { to: '/', label: 'Inicio' },
  { to: '/bible', label: 'Biblia' },
  { to: '/goals', label: 'Metas' },
  { to: '/church', label: 'Comunidad' },
];

export function AppLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <header className="sticky top-0 z-20 hidden border-b border-slate-200/80 bg-white/95 backdrop-blur-sm md:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold text-slate-900">
            Iglesias
          </Link>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-[var(--primary)] text-white' : 'text-slate-600 hover:bg-slate-100'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="text-sm font-medium text-slate-600 hover:text-[var(--primary)]"
            >
              Mi perfil
            </Link>
            <span className="text-sm text-slate-500">{user?.name ?? user?.email}</span>
            <button onClick={() => signOut()} className="btn-secondary rounded-full px-4 py-2 text-sm">
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto min-h-screen max-w-5xl md:px-4 md:py-6">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}
