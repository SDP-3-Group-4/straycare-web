import { useEffect, useState } from 'react';
import FeedTabs from './FeedTabs';
import PostCard from './PostCard';
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
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-20">
      <div className="sticky top-0 z-10 flex flex-col bg-white/80 backdrop-blur-md border-b border-[var(--sc-border)]">
        <FeedTabs selected={activeTab} onSelect={setActiveTab} />
      </div>
      
      <div className="flex flex-col">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading feed...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No posts available.</div>
        ) : (
          posts.map((post) => (
            <PostCard 
              key={post.id}
              id={post.id}
              authorId={post.authorId}
              authorName={post.author.displayName}
              authorAvatar={post.author.photoUrl || ''}
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
