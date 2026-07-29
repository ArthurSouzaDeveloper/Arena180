import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SuperadminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-8">
          <div>
            <p className="text-lg font-semibold text-brand-700">GestQuadra</p>
            <p className="text-xs text-gray-500">Painel da plataforma</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="hidden sm:inline">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-md px-3 py-2 font-medium hover:bg-gray-100"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
