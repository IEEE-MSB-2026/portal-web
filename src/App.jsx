import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useThemeStore } from './store/themeStore';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Committees from './pages/Committees';
import Events from './pages/Events';
import Announcements from './pages/Announcements';
import Gallery from './pages/Gallery';

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

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="committees" element={<Committees />} />
          <Route path="events" element={<Events />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
