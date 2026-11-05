import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { I18nProvider } from './context/I18nContext.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DeliveriesPage from './pages/DeliveriesPage.jsx';
import DisputesPage from './pages/DisputesPage.jsx';
import KaryaPage from './pages/KaryaPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RatingsPage from './pages/RatingsPage.jsx';
import ReturnsPage from './pages/ReturnsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="deliveries" element={<DeliveriesPage />} />
                <Route path="returns" element={<ReturnsPage />} />
                <Route path="karya" element={<KaryaPage />} />
                <Route path="disputes" element={<DisputesPage />} />
                <Route path="ratings" element={<RatingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}
