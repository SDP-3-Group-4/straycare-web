import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProfileHeader from './ProfileHeader';
import PostCard from './PostCard';
import { Package, Users, LayoutList, Loader2, MapPin, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { fetchUserProfile, fetchPosts, fetchConnections, fetchUserOrders } from '../../../services/api';
import { avatarOnError } from '../../../constants';

export default function ProfileFeed() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('id') || user?.uid;
  const isOwnProfile = targetUserId === user?.uid;
  
  const [activeTab, setActiveTab] = useState<'posts' | 'orders' | 'connections'>('posts');
  
  const [profileData, setProfileData] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [fundraiserStats, setFundraiserStats] = useState({ count: 0, raised: 0, donors: 0, goal: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    if (!user || !targetUserId) return;
    setLoading(true);
    
    Promise.all([
      fetchUserProfile(targetUserId),
      fetchPosts(),
      fetchConnections(targetUserId),
      fetchUserOrders(targetUserId)
    ])
    .then(([profile, allPosts, userConns, userOrders]) => {
      // Format profile to match expected structure
      const formattedProfile = {
        id: profile.id,
        name: profile.displayName,
        handle: profile.handle,
        bio: profile.bio || '',
        avatar: profile.photoUrl || '',
        coverImage: profile.coverImageUrl || '',
        location: profile.location || '',
        website: profile.website || '',
        joinedDate: new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
        isVerified: profile.verifiedStatus,
        isVet: profile.isVet,
        topContributor: profile.topContributor,
        pets: profile.pets || []
      };
      
      setProfileData(formattedProfile);
      
      // Filter posts for this user
      const filtered = allPosts.filter((p: any) => p.authorId === targetUserId);
      setUserPosts(filtered);
      
      setConnections(userConns || []);
      setOrders(userOrders || []);

      const fundraiserPosts = filtered.filter((p: any) => p.fundraiseGoal != null);
      setFundraiserStats({
        count: fundraiserPosts.length,
        raised: fundraiserPosts.reduce((sum: number, p: any) => sum + (p.raisedAmount || 0), 0),
        donors: fundraiserPosts.reduce((sum: number, p: any) => sum + (p.donorsCount || 0), 0),
        goal: fundraiserPosts.reduce((sum: number, p: any) => sum + (p.fundraiseGoal || 0), 0)
      });
      
      setLoading(false);
    })
    .catch(error => {
      console.error("Error fetching profile data:", error);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [user, targetUserId]);

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="animate-spin text-[var(--sc-primary)]" size={40} />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-gray-500">
        Could not load profile.
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-[600px] w-full pt-4 pb-20 sm:pb-4 mx-auto relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Profile Header Block */}
      <ProfileHeader 
        user={profileData} 
        onProfileUpdate={loadData} 
        connectionsCount={connections.length}
        fundraisersCount={fundraiserStats.count}
        totalRaised={fundraiserStats.raised}
        totalDonors={fundraiserStats.donors}
        totalGoal={fundraiserStats.goal}
        isOwnProfile={isOwnProfile}
      />

      {/* Tabs */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[var(--sc-border)] mb-6 flex items-center justify-between shadow-sm rounded-2xl px-2 py-2 mt-2">
        <div className="flex items-center gap-1 w-full">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[14px] transition-all ${
              activeTab === 'posts' 
                ? 'bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)]' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <LayoutList size={18} />
            {isOwnProfile ? 'My Posts' : 'Posts'}
          </button>
          {isOwnProfile && (
            <>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[14px] transition-all ${
                  activeTab === 'orders' 
                    ? 'bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)]' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Package size={18} />
                Order History
              </button>
              <button 
                onClick={() => setActiveTab('connections')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[14px] transition-all ${
                  activeTab === 'connections' 
                    ? 'bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)]' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Users size={18} />
                Connections
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex flex-col gap-6">
        {activeTab === 'posts' && (
          <>
            {userPosts.length > 0 ? userPosts.map(post => (
              <PostCard 
                key={post.id} 
                id={post.id}
                authorId={post.authorId}
                authorName={post.author.displayName}
                authorAvatar={post.author.photoUrl}
                timeAgo={new Date(post.createdAt).toLocaleDateString()}
                category={post.category}
                content={post.content}
                imageUrl={post.imageUrl || undefined}
                location={post.location || undefined}
                likesCount={post._count?.likes || 0}
                commentsCount={post._count?.comments || 0}
                fundraiseGoal={post.fundraiseGoal}
                raisedAmount={post.raisedAmount}
                donorsCount={post.donorsCount}
                isVerified={post.author.verifiedStatus}
              />
            )) : (
              <div className="text-center py-8 text-gray-500 border border-[var(--sc-border)] rounded-2xl bg-white">
                No posts yet.
              </div>
            )}
          </>
        )}

        {activeTab === 'orders' && (
          <div className="flex flex-col gap-4">
            {orders.length > 0 ? orders.map(order => (
              <div key={order.id} className="bg-white border border-[var(--sc-border)] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[var(--sc-text-primary)]">Order #{order.id.slice(-8)}</p>
                  <p className="text-sm text-[var(--sc-text-secondary)]">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[var(--sc-brand-600)]">৳{order.total.toFixed(2)}</p>
                  <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg uppercase tracking-wider mt-1">{order.status}</span>
                </div>
              </div>
            )) : (
              <div className="bg-white border border-[var(--sc-border)] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="text-gray-400" size={32} />
                </div>
                <h3 className="text-lg font-bold text-[var(--sc-text-primary)] mb-2">No orders yet</h3>
                <p className="text-[var(--sc-text-secondary)]">You haven't placed any orders in the marketplace.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="flex flex-col gap-4">
            {connections.length > 0 ? connections.map(conn => {
              const otherUser = conn.initiatorId === user?.uid ? conn.receiver : conn.initiator;
              return (
                <div key={conn.id} className="bg-white border border-[var(--sc-border)] rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 flex-shrink-0">
                    {otherUser.photoUrl ? (
                      <img src={otherUser.photoUrl} alt={otherUser.displayName} onError={avatarOnError} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <User size={22} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-[var(--sc-text-primary)]">{otherUser.displayName}</p>
                    <p className="text-sm text-[var(--sc-text-secondary)]">{otherUser.handle}</p>
                  </div>
                  <span className="ml-auto inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg uppercase tracking-wider">{conn.status}</span>
                </div>
              );
            }) : (
              <div className="bg-white border border-[var(--sc-border)] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="text-gray-400" size={32} />
                </div>
                <h3 className="text-lg font-bold text-[var(--sc-text-primary)] mb-2">No connections</h3>
                <p className="text-[var(--sc-text-secondary)]">Start interacting with other users to build your network.</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
