import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RequireAuth from './components/RequireAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import NovaRacha from './pages/NovaRacha';
import Rachas from './pages/Rachas';
import RachaDetalhe from './pages/RachaDetalhe';
import Configuracoes from './pages/Configuracoes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/rachas" element={<Rachas />} />
            <Route path="/rachas/nova" element={<NovaRacha />} />
            <Route path="/rachas/:id" element={<RachaDetalhe />} />
            <Route path="/nova-racha" element={<Navigate to="/rachas/nova" replace />} />
            <Route path="/historico" element={<Navigate to="/rachas" replace />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
