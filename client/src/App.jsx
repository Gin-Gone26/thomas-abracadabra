import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/common/Navbar';
import AdminLayout from './components/admin/AdminLayout';
import HomePage from './pages/public/HomePage';
import TrackOrderPage from './pages/public/TrackOrderPage';
import LoginPage from './pages/admin/LoginPage';
import ManageBookings from './pages/admin/ManageBookings';
import ManageServices from './pages/admin/ManageServices';
import ManageCharacters from './pages/admin/ManageCharacters';
import AccountSettings from './pages/admin/AccountSettings';

function ProtectedAdminRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return <AdminLayout>{children}</AdminLayout>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Navbar />
                  <HomePage />
                </>
              }
            />
            <Route
              path="/cek-pesanan"
              element={
                <>
                  <Navbar />
                  <TrackOrderPage />
                </>
              }
            />
            <Route
              path="/admin/login"
              element={
                <>
                  <Navbar />
                  <LoginPage />
                </>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <ManageBookings />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/layanan"
              element={
                <ProtectedAdminRoute>
                  <ManageServices />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/karakter"
              element={
                <ProtectedAdminRoute>
                  <ManageCharacters />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/akun"
              element={
                <ProtectedAdminRoute>
                  <AccountSettings />
                </ProtectedAdminRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}