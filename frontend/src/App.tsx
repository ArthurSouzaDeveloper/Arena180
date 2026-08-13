import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SuperadminRoute } from "./components/SuperadminRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProductsPage } from "./pages/ProductsPage";
import { NewRachaPage } from "./pages/NewRachaPage";
import { RachaHistoryPage } from "./pages/RachaHistoryPage";
import { CourtsPage } from "./pages/CourtsPage";
import { ReservationsPage } from "./pages/ReservationsPage";
import { PublicBookingPage } from "./pages/PublicBookingPage";
import { CancelBookingPage } from "./pages/CancelBookingPage";
import { SuperadminPage } from "./pages/SuperadminPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/agendar/:slug" element={<PublicBookingPage />} />
      <Route path="/agendar/:slug/cancelar/:bookingId" element={<CancelBookingPage />} />
      <Route element={<SuperadminRoute />}>
        <Route path="/superadmin" element={<SuperadminPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/produtos" element={<ProductsPage />} />
          <Route path="/quadras" element={<CourtsPage />} />
          <Route path="/reservas" element={<ReservationsPage />} />
          <Route path="/rachas/nova" element={<NewRachaPage />} />
          <Route path="/rachas" element={<RachaHistoryPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
