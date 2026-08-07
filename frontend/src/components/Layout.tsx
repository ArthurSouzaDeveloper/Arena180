import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Painel", end: true },
  { to: "/produtos", label: "Produtos" },
  { to: "/quadras", label: "Quadras" },
  { to: "/rachas/nova", label: "Nova racha" },
  { to: "/rachas", label: "Histórico" },
];

export function Layout() {
  const { user, quadra, logout } = useAuth();

  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="font-semibold text-primary-700">GestQuadra</p>
            <p className="truncate text-xs text-gray-500">{quadra?.name}</p>
          </div>
          <nav className="hidden gap-4 text-sm sm:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  isActive ? "font-semibold text-primary-600" : "text-gray-600 hover:text-primary-600"
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
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

      <main className="mx-auto max-w-5xl px-4 py-6">
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
