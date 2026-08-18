import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="relative group w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search size={18} className="text-[var(--sc-text-muted)] group-focus-within:text-[var(--sc-brand-500)]" />
      </div>
      <input
        type="search"
        className="w-full bg-gray-100 hover:bg-gray-200 focus:bg-white border border-transparent focus:border-[var(--sc-brand-500)] rounded-full py-3 pl-12 pr-4 text-[15px] text-[var(--sc-text-primary)] placeholder-[var(--sc-text-muted)] outline-none transition-colors"
        placeholder="Search"
      />
    </div>
  );
}
