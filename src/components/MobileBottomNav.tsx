import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Inicio' },
  { to: '/bible', label: 'Biblia' },
  { to: '/goals', label: 'Metas' },
  { to: '/church', label: 'Comunidad' },
  { to: '/profile', label: 'Mi perfil' },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `px-2 py-3 text-center text-xs font-medium ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
