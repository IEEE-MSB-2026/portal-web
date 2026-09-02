import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './stores/authStore';
import { api } from './services/api';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ToastContainer from './components/ui/ToastContainer';

import Home from './pages/Home';
import About from './pages/About';
import Committees from './pages/Committees';
import Events from './pages/Events';
import Announcements from './pages/Announcements';
import Gallery from './pages/Gallery';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import Join from './pages/Join';
import HRStudio from './pages/HRStudio';
import PRStudio from './pages/PRStudio';

function NotFound() {
  return (
    <div className="section" style={{ textAlign: 'center' }}>
      <div className="container container-narrow">
        <div className="bento-card" style={{ padding: 'var(--space-16)' }}>
          <h1 style={{ fontSize: '3rem', color: 'var(--color-primary)', marginBottom: 'var(--space-2)' }}>404</h1>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-4)' }}>Page Not Found</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
            The requested page does not exist or has moved.
          </p>
          <div>
            <Link to="/" className="btn btn-primary">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const initTheme = useThemeStore((state) => state.initTheme);
  const initSync = useAuthStore((state) => state.initSync);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    initTheme();
    initSync();

    // Proactive background session validation
    if (isAuthenticated) {
      api.getMe().catch((err) => {
        console.warn('Session verification fallback:', err.message);
      });
    }
  }, [initTheme, initSync, isAuthenticated]);

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Standalone full-screen auth routes without global Navbar and Footer */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Main application routes with global Navbar & Footer */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="committees" element={<Committees />} />
          <Route path="events" element={<Events />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="gallery" element={<Gallery />} />
          <Route
            path="join"
            element={
              <ProtectedRoute>
                <Join />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute requireCommittee>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="workspace"
            element={
              <ProtectedRoute requireCommittee>
                <Workspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="profile/:userId" element={<Profile />} />
          <Route
            path="hr"
            element={
              <ProtectedRoute>
                <HRStudio />
              </ProtectedRoute>
            }
          />
          <Route
            path="pr"
            element={
              <ProtectedRoute>
                <PRStudio />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

