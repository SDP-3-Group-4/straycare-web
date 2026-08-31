import { useState } from 'react';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface PostMediaProps {
  mediaList: MediaItem[];
}

export default function PostMedia({ mediaList }: PostMediaProps) {
  const [activeMedia, setActiveMedia] = useState<number | null>(null);

  if (!mediaList || mediaList.length === 0) return null;

  return (
    <div className="mt-2.5">
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-gray-100">
        {mediaList.slice(0, 4).map((m, i) => (
          <div 
            key={i} 
            className={`relative cursor-pointer bg-black ${
              mediaList.length === 1 ? 'col-span-2 aspect-video sm:h-80' : 
              (mediaList.length === 3 && i === 0) ? 'row-span-2 min-h-[160px]' : 
              'aspect-square sm:h-44'
            }`} 
            onClick={() => setActiveMedia(i)}
          >
            {m.type === 'video' ? (
              <video src={m.url} className="w-full h-full object-cover" muted />
            ) : (
              <img src={m.url} alt={`media ${i}`} className="w-full h-full object-cover" />
            )}
            
            {i === 3 && mediaList.length > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                +{mediaList.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {mediaList.length > 1 && (
        <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1">
          {mediaList.length} media • tap to expand
        </p>
      )}

      {/* Lightbox / Fullscreen Viewer */}
      {activeMedia !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-2 sm:p-4" onClick={() => setActiveMedia(null)}>
          <button onClick={() => setActiveMedia(null)} className="absolute top-4 right-4 text-white bg-white/20 p-2 rounded-full hover:bg-white/30 z-20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); setActiveMedia(prev => (prev! > 0 ? prev! - 1 : mediaList.length - 1)); }} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white bg-white/20 p-2.5 sm:p-3 rounded-full hover:bg-white/30 z-20 flex">
            ‹
          </button>
          
          <div className="max-w-3xl w-full max-h-[85vh] flex flex-col items-center px-2" onClick={e => e.stopPropagation()}>
            {mediaList[activeMedia].type === 'video' ? (
              <video src={mediaList[activeMedia].url} controls autoPlay className="max-w-full max-h-[65vh] sm:max-h-[70vh] rounded-xl object-contain" />
            ) : (
              <img src={mediaList[activeMedia].url} alt={`media ${activeMedia}`} className="max-w-full max-h-[65vh] sm:max-h-[70vh] object-contain rounded-xl" />
            )}
            <div className="flex gap-2 mt-3 overflow-x-auto max-w-full pb-1">
              {mediaList.map((m, i) => (
                <button key={i} onClick={() => setActiveMedia(i)} className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 shrink-0 ${i === activeMedia ? 'border-white' : 'border-transparent opacity-60'}`}>
                  {m.type === 'video' ? <video src={m.url} className="w-full h-full object-cover" muted /> : <img src={m.url} alt={`thumb ${i}`} className="w-full h-full object-cover" />}
                </button>
              ))}
            </div>
            <p className="text-white/70 text-xs mt-1.5">{activeMedia + 1} / {mediaList.length}</p>
          </div>
          
          <button onClick={(e) => { e.stopPropagation(); setActiveMedia(prev => (prev! < mediaList.length - 1 ? prev! + 1 : 0)); }} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white bg-white/20 p-2.5 sm:p-3 rounded-full hover:bg-white/30 z-20 flex">
            ›
          </button>
        </div>
      )}
    </div>
  );
}
