import { useEffect, useState } from 'react';
import FeedTabs from './FeedTabs';
import PostCard from './PostCard';
import CreatePostBox from '../panel/CreatePostBox';
import { fetchPosts } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function CenterFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('explore');
  const { user } = useAuth();

  const loadPosts = () => {
    setLoading(true);

    if (activeTab === 'nearby') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchPostsWithLocation(position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.error("Error getting location:", error);
            // Fallback to fetching without precise location
            fetchPostsWithLocation();
          }
        );
      } else {
        // Geolocation not supported, fallback
        fetchPostsWithLocation();
      }
    } else {
      fetchPostsWithLocation();
    }
  };

  const fetchPostsWithLocation = (lat?: number, lng?: number) => {
    fetchPosts(activeTab, user?.uid, lat, lng)
      .then((data) => {
        // If explore, sort by newest. If nearby, it's already sorted by backend distance
        let sorted = data;
        if (activeTab === 'explore') {
          sorted = data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        setPosts(sorted);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching posts:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPosts();

    const handlePostCreated = () => {
      loadPosts();
    };

    window.addEventListener('postCreated', handlePostCreated);
    return () => window.removeEventListener('postCreated', handlePostCreated);
  }, [activeTab, user]);

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pt-3 sm:pt-4 pb-24 gap-4 px-0 sm:px-2">
      <div className="lg:hidden w-full"><CreatePostBox /></div>
      <div className="sticky top-0 z-20 flex flex-col bg-white/90 backdrop-blur-md border-b border-[var(--sc-border)] rounded-2xl shadow-xs overflow-hidden">
        <FeedTabs selected={activeTab} onSelect={setActiveTab} />
      </div>
      
      <div className="flex flex-col w-full min-w-0">
        {loading ? (
          <div className="p-8 text-center text-gray-500 font-medium bg-white rounded-2xl border border-[var(--sc-border)]">
            <div className="w-8 h-8 border-3 border-[var(--sc-brand-600)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading feed...
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-[var(--sc-border)]">
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
            />
          ))
        )}
      </div>
    </div>
  );
}
