import { MapPin, Compass, Navigation } from 'lucide-react';

interface FeedTabsProps {
  selected: string;
  onSelect: (tab: string) => void;
}

export default function FeedTabs({ selected, onSelect }: FeedTabsProps) {
  return (
    <div className="flex w-full justify-center border-b border-gray-200">
      <button 
        onClick={() => onSelect('explore')}
        className="flex-1 h-14 flex items-center justify-center cursor-pointer transition-colors relative"
      >
        <span className={`flex items-center gap-2 text-[15px] ${selected === 'explore' ? 'text-[var(--sc-text-primary)] font-bold' : 'text-gray-500 font-medium hover:text-[var(--sc-text-primary)]'}`}>
          <Compass size={18} strokeWidth={selected === 'explore' ? 2.5 : 2} className={selected === 'explore' ? 'text-[var(--sc-brand-500)]' : 'text-gray-400'} />
          Explore
        </span>
        {selected === 'explore' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--sc-brand-500)] mx-4"></div>}
      </button>
      
      <button 
        onClick={() => onSelect('nearby')}
        className="flex-1 h-14 flex items-center justify-center cursor-pointer transition-colors relative"
      >
        <span className={`flex items-center gap-2 text-[15px] ${selected === 'nearby' ? 'text-[var(--sc-text-primary)] font-bold' : 'text-gray-500 font-medium hover:text-[var(--sc-text-primary)]'}`}>
          <Navigation size={18} strokeWidth={selected === 'nearby' ? 2.5 : 2} className={selected === 'nearby' ? 'text-[var(--sc-brand-500)]' : 'text-gray-400'} />
          Nearby
        </span>
        {selected === 'nearby' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--sc-brand-500)] mx-4"></div>}
      </button>
    </div>
  );
}
