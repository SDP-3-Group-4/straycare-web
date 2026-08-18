import './HomeFeedPage.css';
import { Outlet, useLocation } from 'react-router-dom';
import LeftSidebar from '../components/home/sidebar/LeftSidebar';
import RightPanel from '../components/home/panel/RightPanel';
import CartPanel from '../components/home/panel/CartPanel';

export default function HomeFeedPage() {
  const location = useLocation();
  const isMarketplace = location.pathname.includes('/marketplace');

  return (
    <div className="home-feed-page">
      <div className="home-feed-page__container">
        <aside className="home-feed-page__left">
          <LeftSidebar />
        </aside>
        
        <main className="home-feed-page__center min-h-screen">
          <Outlet />
        </main>
        
        <aside className="home-feed-page__right">
          {isMarketplace ? <CartPanel /> : <RightPanel />}
        </aside>
      </div>
    </div>
  );
}
