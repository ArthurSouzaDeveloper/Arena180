import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SuperadminRoute } from "./components/SuperadminRoute";
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProductsPage } from "./pages/ProductsPage";
import { NewRachaPage } from "./pages/NewRachaPage";
import { RachaHistoryPage } from "./pages/RachaHistoryPage";
import { CourtsPage } from "./pages/CourtsPage";
import { ReservationsPage } from "./pages/ReservationsPage";
import { PublicBookingPage } from "./pages/PublicBookingPage";
import { CancelBookingPage } from "./pages/CancelBookingPage";
import { CancelSubscriptionPage } from "./pages/CancelSubscriptionPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { SuperadminPage } from "./pages/SuperadminPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/esqueci-minha-senha" element={<ForgotPasswordPage />} />
      <Route path="/agendar/:slug" element={<PublicBookingPage />} />
      <Route path="/agendar/:slug/cancelar/:bookingId" element={<CancelBookingPage />} />
      <Route path="/agendar/:slug/minhas-reservas" element={<MyBookingsPage />} />
      <Route path="/agendar/:slug/mensalista/:subscriptionId/cancelar" element={<CancelSubscriptionPage />} />
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
