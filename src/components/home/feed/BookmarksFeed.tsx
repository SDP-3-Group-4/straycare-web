import { useState, useEffect } from 'react';
import { Bookmark, Filter } from 'lucide-react';
import PostCard from './PostCard';
import { useAuth } from '../../../contexts/AuthContext';
import { fetchBookmarks } from '../../../services/api';

const FILTERS = ['All', 'Rescues', 'Fundraises', 'Adoptions'];

export default function BookmarksFeed() {
  const [activeFilter, setActiveFilter] = useState('All');
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadBookmarks();
    }
  }, [user]);

  const loadBookmarks = async () => {
    if (!user) return;
    try {
      const data = await fetchBookmarks(user.uid);
      setBookmarks(data);
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err);
    }
  };

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Rescues' && bookmark.post.category === 'rescue') return true;
    if (activeFilter === 'Fundraises' && bookmark.post.category === 'fundraise') return true;
    if (activeFilter === 'Adoptions' && bookmark.post.category === 'adoption') return true;
    return false;
  });

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-20">
      
      {/* Header & Filter Bar */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-[var(--sc-border)] px-4 py-4 sm:px-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] p-2 rounded-xl">
            <Bookmark size={20} className="fill-current" />
          </div>
          <h2 className="font-bold text-[20px] text-[var(--sc-text-primary)] tracking-tight">Saved Posts</h2>
        </div>
        
        {/* Expressive Material Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-2 text-gray-400 mr-1">
            <Filter size={16} />
          </div>
          {FILTERS.map(filter => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[14px] font-medium transition-all duration-200 border ${
                  isActive
                    ? 'bg-[var(--sc-brand-600)] text-white border-[var(--sc-brand-600)]'
                    : 'bg-white text-[var(--sc-text-secondary)] border-[var(--sc-border)] hover:bg-gray-50 hover:text-[var(--sc-text-primary)]'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts List */}
      <div className="flex flex-col gap-4 px-4 sm:px-0">
        {filteredBookmarks.map((bookmark) => {
          const post = bookmark.post;
          
          const date = new Date(post.createdAt);
          const timeAgo = !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Just now';

          return (
            <PostCard 
              key={post.id} 
              id={post.id}
              authorId={post.authorId}
              authorName={post.author?.displayName || 'Unknown'}
              authorAvatar={post.author?.photoUrl || ''}
              timeAgo={timeAgo}
              category={post.category}
              content={post.content}
              imageUrl={post.imageUrl || undefined}
              location={post.location || undefined}
              likesCount={post._count?.likes || 0}
              commentsCount={post._count?.comments || 0}
              fundraiseGoal={post.fundraiseGoal}
              raisedAmount={post.raisedAmount}
              donorsCount={post.donorsCount}
              isVerified={post.author?.verifiedStatus}
            />
          );
        })}
        
        {filteredBookmarks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No saved posts found for this filter.
          </div>
        )}
      </div>
      
    </div>
  );
}
