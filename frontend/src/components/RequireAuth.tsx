import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

interface RequireAuthProps {
  children: JSX.Element;
  role?: Role;
}

export default function RequireAuth({ children, role }: RequireAuthProps) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  // Superadmin e admin de arena têm painéis distintos; cada um é redirecionado
  // para o seu em vez de ver uma tela vazia ou quebrada.
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'SUPERADMIN' ? '/plataforma' : '/'} replace />;
  }

  return children;
}
