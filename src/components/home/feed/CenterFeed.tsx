import { useEffect, useState } from 'react';
import FeedTabs from './FeedTabs';
import PostCard from './PostCard';
import CreatePostBox from '../panel/CreatePostBox';
import { fetchPosts, getCachedData } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserLocation } from '../../../hooks/useUserLocation';
import { RefreshCw, Wifi } from 'lucide-react';

export default function CenterFeed() {
  const [activeTab, setActiveTab] = useState('explore');
  const { user } = useAuth();

  // SWR: Initialize state with cached posts for instant 0ms rendering
  const [posts, setPosts] = useState<any[]>(() => {
    const cached = getCachedData<any[]>(`posts_explore_all`);
    return Array.isArray(cached) && cached.length > 0 ? cached : [];
  });
  const [loading, setLoading] = useState(() => {
    const cached = getCachedData<any[]>(`posts_explore_all`);
    return !(Array.isArray(cached) && cached.length > 0);
  });
  const { requestLocation } = useUserLocation();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPosts = (showInitialLoading = false) => {
    if (showInitialLoading) setLoading(true);
    else setIsRefreshing(true);

    if (activeTab === 'nearby') {
      requestLocation().then((loc) => {
        fetchPostsWithLocation(loc.lat, loc.lng);
      });
    } else {
      fetchPostsWithLocation();
    }
  };

  const fetchPostsWithLocation = (lat?: number, lng?: number) => {
    console.log('[CenterFeed] Fetching posts for tab:', activeTab);
    fetchPosts(activeTab, activeTab === 'nearby' ? user?.uid : undefined, lat, lng)
      .then((data) => {
        console.log('[CenterFeed] Received posts:', data);
        if (Array.isArray(data)) {
          let sorted = [...data];
          if (activeTab === 'explore') {
            sorted.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
          console.log('[CenterFeed] Setting sorted posts count:', sorted.length);
          setPosts(sorted);
        } else {
          console.warn('[CenterFeed] Data is not an array:', data);
        }
      })
      .catch((error) => {
        console.error('[CenterFeed] Error fetching posts:', error);
      })
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    // Check if new tab has cached data
    const cached = getCachedData<any[]>(`posts_${activeTab}_all`);
    if (Array.isArray(cached) && cached.length > 0) {
      setPosts(cached);
      setLoading(false);
      loadPosts(false); // Background revalidation
    } else {
      loadPosts(true); // Full fetch if no cache
    }

    const handlePostCreated = () => {
      loadPosts(false);
    };

    const handlePostDeleted = () => {
      loadPosts(false);
    };

    window.addEventListener('postCreated', handlePostCreated);
    window.addEventListener('postDeleted', handlePostDeleted);
    return () => {
      window.removeEventListener('postCreated', handlePostCreated);
      window.removeEventListener('postDeleted', handlePostDeleted);
    };
  }, [activeTab, user?.uid]);

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pt-3 sm:pt-4 pb-24 gap-4 px-0 sm:px-2">
      <div className="lg:hidden w-full"><CreatePostBox /></div>
      
      {/* Sticky Tab Header with Background Refreshing Indicator */}
      <div className="sticky top-0 z-20 flex flex-col bg-white/75 dark:bg-black/65 backdrop-blur-md border-b border-[var(--sc-border)] rounded-2xl shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <FeedTabs selected={activeTab} onSelect={setActiveTab} />
          </div>
          {isRefreshing && (
            <div className="pr-3.5 flex items-center gap-1.5 text-gray-400 text-xs font-medium shrink-0 animate-pulse">
              <RefreshCw size={12} className="animate-spin text-[var(--sc-brand-600)]" />
              <span className="hidden sm:inline text-[11px] text-gray-500">Syncing...</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col w-full min-w-0">
        {loading ? (
          // Shimmer Skeleton Loader (Never a frozen blank screen)
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 border border-[var(--sc-border)] animate-pulse shadow-xs">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-200 rounded-md w-1/3" />
                    <div className="h-2.5 bg-gray-100 rounded-md w-1/4" />
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="h-3 bg-gray-200 rounded-md w-full" />
                  <div className="h-3 bg-gray-200 rounded-md w-5/6" />
                </div>
                <div className="h-44 bg-gray-100 rounded-xl w-full" />
              </div>
            ))}
            <div className="text-center py-2 text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <Wifi size={13} className="text-[var(--sc-brand-600)] animate-pulse" />
              <span>Connecting to StrayCare network...</span>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-[var(--sc-border)] shadow-xs">
            <p className="font-semibold text-[15px] text-gray-700 mb-1">No posts found</p>
            <p className="text-xs text-gray-400">Be the first to share an update or rescue story!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard 
              key={post.id}
              id={post.id}
              authorId={post.authorId}
              authorName={post.author?.displayName || 'User'}
              authorAvatar={post.author?.photoUrl || ''}
              authorHandle={post.author?.handle}
              timeAgo={new Date(post.createdAt).toLocaleDateString()}
              category={post.category}
              content={post.content}
              imageUrl={post.imageUrl}
              media={post.media}
              location={post.location}
              likesCount={post._count?.likes || 0}
              commentsCount={post._count?.comments || 0}
              fundraiseGoal={post.fundraiseGoal}
              raisedAmount={post.raisedAmount}
              donorsCount={post.donorsCount}
              isVerified={post.author?.verifiedStatus}
              onPostDeleted={() => {
                setPosts(prev => prev.filter(p => p.id !== post.id));
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
