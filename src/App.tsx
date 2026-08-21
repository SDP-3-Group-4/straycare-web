import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import HomeFeedPage from './pages/HomeFeedPage';
import CenterFeed from './components/home/feed/CenterFeed';
import NotificationsFeed from './components/home/feed/NotificationsFeed';

import BookmarksFeed from './components/home/feed/BookmarksFeed';
import SettingsFeed from './components/home/feed/SettingsFeed';
import MarketplaceFeed from './components/home/feed/MarketplaceFeed';
import ProfileFeed from './components/home/feed/ProfileFeed';
import ProtectedRoute from './components/auth/ProtectedRoute';

const TITLE_MAP: Record<string, string> = {
  '/auth': 'StrayCare — Sign In',
  '/': 'StrayCare — Home',
  '/notifications': 'StrayCare — Notifications',
  '/marketplace': 'StrayCare — Marketplace',
  '/bookmarks': 'StrayCare — Bookmarks',
  '/settings': 'StrayCare — Settings',
  '/profile': 'StrayCare — Profile',
};

function TitleManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = TITLE_MAP[pathname] ?? 'StrayCare';
  }, [pathname]);
  return null;
}

function AppRoutes() {
  return (
    <>
      <TitleManager />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<ProtectedRoute><HomeFeedPage /></ProtectedRoute>}>
          <Route index element={<CenterFeed />} />
          <Route path="notifications" element={<NotificationsFeed />} />
          <Route path="marketplace" element={<MarketplaceFeed />} />
          <Route path="bookmarks" element={<BookmarksFeed />} />
          <Route path="settings" element={<SettingsFeed />} />
          <Route path="profile" element={<ProfileFeed />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
