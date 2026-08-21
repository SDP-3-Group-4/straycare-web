import { Compass, Navigation } from 'lucide-react';

interface FeedTabsProps {
  selected: string;
  onSelect: (tab: string) => void;
}

export default function FeedTabs({ selected, onSelect }: FeedTabsProps) {
  return (
    <div className="flex w-full border-b border-gray-100 bg-white/95">
      <button 
        onClick={() => onSelect('explore')}
        className="flex-1 py-3.5 flex items-center justify-center cursor-pointer transition-colors relative"
      >
        <span className={`flex items-center gap-2 text-[14px] sm:text-[15px] ${selected === 'explore' ? 'text-[var(--sc-brand-600)] font-bold' : 'text-gray-500 font-medium hover:text-[var(--sc-text-primary)]'}`}>
          <Compass size={18} strokeWidth={selected === 'explore' ? 2.5 : 2} className={selected === 'explore' ? 'text-[var(--sc-brand-600)]' : 'text-gray-400'} />
          Explore
        </span>
        {selected === 'explore' && <div className="absolute bottom-0 inset-x-8 h-[2.5px] bg-[var(--sc-brand-600)] rounded-full"></div>}
      </button>
      
      <button 
        onClick={() => onSelect('nearby')}
        className="flex-1 py-3.5 flex items-center justify-center cursor-pointer transition-colors relative"
      >
        <span className={`flex items-center gap-2 text-[14px] sm:text-[15px] ${selected === 'nearby' ? 'text-[var(--sc-brand-600)] font-bold' : 'text-gray-500 font-medium hover:text-[var(--sc-text-primary)]'}`}>
          <Navigation size={18} strokeWidth={selected === 'nearby' ? 2.5 : 2} className={selected === 'nearby' ? 'text-[var(--sc-brand-600)]' : 'text-gray-400'} />
          Nearby
        </span>
        {selected === 'nearby' && <div className="absolute bottom-0 inset-x-8 h-[2.5px] bg-[var(--sc-brand-600)] rounded-full"></div>}
      </button>
    </div>
  );
}
