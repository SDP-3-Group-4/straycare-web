import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomeFeedPage from './pages/HomeFeedPage';
import CenterFeed from './components/home/feed/CenterFeed';
import NotificationsFeed from './components/home/feed/NotificationsFeed';

import BookmarksFeed from './components/home/feed/BookmarksFeed';
import SettingsFeed from './components/home/feed/SettingsFeed';
import MarketplaceFeed from './components/home/feed/MarketplaceFeed';
import ProfileFeed from './components/home/feed/ProfileFeed';
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
