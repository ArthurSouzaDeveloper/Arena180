import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Painel", end: true },
  { to: "/produtos", label: "Produtos" },
  { to: "/quadras", label: "Quadras" },
  { to: "/reservas", label: "Reservas" },
  { to: "/rachas/nova", label: "Nova racha" },
  { to: "/rachas", label: "Histórico" },
];

export function Layout() {
  const { user, quadra, logout } = useAuth();

  return (
    <div className="min-h-screen pb-16 sm:flex sm:pb-0">
      <aside className="hidden shrink-0 flex-col bg-sidebar px-4 py-6 text-white sm:flex sm:w-56">
        <div className="mb-5 min-w-0 border-b border-white/10 pb-5">
          <p className="font-semibold">GestQuadra</p>
          <p className="mt-0.5 truncate text-xs text-sidebar-muted">{quadra?.name}</p>
        </div>

        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-md border-l-2 px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "border-sidebar-accent font-semibold text-white"
                    : "border-transparent text-sidebar-muted hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-4">
          <span className="truncate text-sm text-sidebar-muted">{user?.name}</span>
          <button
            onClick={logout}
            className="shrink-0 rounded bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
          >
            Sair
          </button>
        </div>
      </aside>

      <header className="border-b bg-white sm:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="font-semibold text-primary-700">GestQuadra</p>
            <p className="truncate text-xs text-gray-500">{quadra?.name}</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="hidden sm:inline">{user?.name}</span>
            <button
              onClick={logout}
              className="shrink-0 rounded bg-gray-100 px-3 py-2 hover:bg-gray-200 sm:py-1"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t bg-white sm:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex-1 px-1 py-2 text-center text-[11px] leading-tight ${
                isActive ? "font-semibold text-primary-600" : "text-gray-600"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
