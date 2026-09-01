import "./HomeFeedPage.css";
import { Outlet, useLocation } from "react-router-dom";
import LeftSidebar from "../components/home/sidebar/LeftSidebar";
import RightPanel from "../components/home/panel/RightPanel";
import CartPanel from "../components/home/panel/CartPanel";
import MobileBanner from "../components/mobile/MobileBanner";
import MobileHeader from "../components/mobile/MobileHeader";
import MobileNav from "../components/mobile/MobileNav";

export default function HomeFeedPage() {
  const location = useLocation();
  const isMarketplace = location.pathname.includes("/marketplace");

  return (
    <div className="home-feed-page">
      <MobileBanner />
      <MobileHeader />
      <div className="home-feed-page__container">
        <aside className="home-feed-page__left">
          <LeftSidebar />
        </aside>

        <main className="home-feed-page__center min-h-screen pb-20 lg:pb-0">
          <Outlet />
        </main>

        <aside className="home-feed-page__right">
          {isMarketplace ? <CartPanel /> : <RightPanel />}
        </aside>
      </div>
      <MobileNav />
    </div>
  );
}
