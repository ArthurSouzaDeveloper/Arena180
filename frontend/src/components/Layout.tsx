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
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <p className="font-semibold text-primary-700">GestQuadra</p>
            <p className="text-xs text-gray-500">{quadra?.name}</p>
          </div>
          <nav className="flex gap-4 text-sm">
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
            <span>{user?.name}</span>
            <button onClick={logout} className="rounded bg-gray-100 px-3 py-1 hover:bg-gray-200">
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
