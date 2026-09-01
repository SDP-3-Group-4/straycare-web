import UserProfileCard from "./UserProfileCard";
import SidebarNav from "./SidebarNav";
import NearbyClinicsWidget from "./NearbyClinicsWidget";
import SearchBar from "../feed/SearchBar";
import HeaderLogo from "../../common/HeaderLogo";

export default function LeftSidebar() {
  return (
    <div className="flex flex-col w-full h-full pb-4 px-2">
      <div className="flex-1 flex flex-col pt-4">
        <div className="flex items-center mb-6 pl-4 pr-2 w-full cursor-pointer">
          <HeaderLogo className="w-full h-auto max-h-10" />
        </div>

        <div className="mb-6 px-4">
          <SearchBar />
        </div>

        <SidebarNav />

        <div className="mt-4 px-2">
          <UserProfileCard />
        </div>

        <div className="mt-3 px-2">
          <NearbyClinicsWidget />
        </div>
      </div>
    </div>
  );
}
