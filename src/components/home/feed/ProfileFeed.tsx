import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProfileHeader from './ProfileHeader';
import VetVerificationModal from './VetVerificationModal';
import PostCard from './PostCard';
import { Package, Users, LayoutList, Loader2, User, ShieldCheck, Store, ChevronRight, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { fetchUserProfile, fetchPosts, fetchConnections, fetchUserOrders, fetchVetApplicationStatus, CONNECTIONS_UPDATED_EVENT } from '../../../services/api';
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
  const [vetModalOpen, setVetModalOpen] = useState(false);
  const [merchantToast, setMerchantToast] = useState(false);
  const [accountOpen, setAccountOpen] = useState(true);
  const [vetStatus, setVetStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOwnProfile && user?.uid) {
      fetchVetApplicationStatus(user.uid)
        .then((app) => setVetStatus(app?.status || null))
        .catch(() => setVetStatus(null));
    } else {
      setVetStatus(null);
    }
  }, [isOwnProfile, user?.uid]);

  useEffect(() => {
    if (!merchantToast) return;
    const t = setTimeout(() => setMerchantToast(false), 2600);
    return () => clearTimeout(t);
  }, [merchantToast]);

  const loadData = () => {
    if (!user || !targetUserId) return;
    setLoading(true);
    const connPromise = fetchConnections(targetUserId).catch(() => []);
    const ordersPromise = isOwnProfile ? fetchUserOrders(targetUserId).catch(() => []) : Promise.resolve([]);
    
    Promise.all([
      fetchUserProfile(targetUserId),
      fetchPosts(),
      connPromise,
      ordersPromise
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

  useEffect(() => {
    const handler = () => {
      if (targetUserId) fetchConnections(targetUserId).then(setConnections).catch(console.error);
    };
    window.addEventListener(CONNECTIONS_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CONNECTIONS_UPDATED_EVENT, handler);
  }, [targetUserId]);

  useEffect(() => {
    if (activeTab === 'connections' && targetUserId) {
      fetchConnections(targetUserId).then(setConnections).catch(console.error);
    }
  }, [activeTab, targetUserId]);

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
        onConnectionsClick={() => {
          if (isOwnProfile) {
            setActiveTab('connections');
            setTimeout(() => window.scrollTo({ top: 400, behavior: 'smooth' }), 100);
          }
        }}
        connectionsCount={connections.length}
        fundraisersCount={fundraiserStats.count}
        totalRaised={fundraiserStats.raised}
        totalDonors={fundraiserStats.donors}
        totalGoal={fundraiserStats.goal}
        isOwnProfile={isOwnProfile}
      />

      {/* Account & Verification (own profile) */}
      {isOwnProfile && (
        <div className="bg-white border border-[var(--sc-border)] rounded-2xl mb-6 overflow-hidden">
          <button
            onClick={() => setAccountOpen(!accountOpen)}
            className="w-full p-3.5 flex items-center justify-between bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] transition-colors border-b border-[var(--sc-border)]"
          >
            <span className="text-[13px] font-bold text-white">Account & Verification</span>
            <span className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-white/80">Grow your profile</span>
              {accountOpen ? (
                <ChevronUp size={16} className="text-white/80" />
              ) : (
                <ChevronDown size={16} className="text-white/80" />
              )}
            </span>
          </button>

          {accountOpen && (
            <>
              {/* Apply for Vet Verification (hidden for accounts that already have the vet badge) */}
              {!user?.isVet && !user?.verifiedStatus && (
                <>
                  <button
                    onClick={() => setVetModalOpen(true)}
                    className="w-full flex items-center gap-3 p-3.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--sc-text-primary)] text-[14px]">
                        {vetStatus === 'approved' ? 'Verified Vet' : 'Apply for Vet Verification'}
                      </p>
                      <p className="text-[12px] text-gray-500 truncate">
                        {vetStatus === 'approved'
                          ? 'You are verified — thank you for keeping pets safe'
                          : vetStatus === 'pending'
                            ? 'Application under review — we will get back to you'
                            : 'Get a verified badge with authentic credentials'}
                      </p>
                    </div>
                    {vetStatus === 'approved' ? (
                      <span className="flex items-center gap-1 shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                        <ShieldCheck size={12} /> Verified
                      </span>
                    ) : vetStatus === 'pending' ? (
                      <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Pending</span>
                    ) : (
                      <ChevronRight size={18} className="shrink-0 text-gray-300" />
                    )}
                  </button>

                  <div className="border-t border-[var(--sc-border)]" />
                </>
              )}

              {/* Become a Merchant */}
              <button
                onClick={() => setMerchantToast(true)}
                className="w-full flex items-center gap-3 p-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Store size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--sc-text-primary)] text-[14px]">Become a Merchant</p>
                  <p className="text-[12px] text-gray-500 truncate">Sell pet products to the community</p>
                </div>
                <span className="flex items-center gap-1 shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                  <Sparkles size={12} /> Coming soon
                </span>
              </button>
            </>
          )}
        </div>
      )}

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
              const isRequester = conn.requesterId === user?.uid;
              const otherUser = isRequester ? conn.recipient : conn.requester;
              if (!otherUser) return null;
              return (
                <div key={conn.id} className="bg-white border border-[var(--sc-border)] rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 flex-shrink-0">
                    {otherUser.photoUrl ? (
                      <img src={otherUser.photoUrl} alt={otherUser.displayName} onError={avatarOnError} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <User size={22} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[var(--sc-text-primary)] truncate">{otherUser.displayName}</p>
                    <p className="text-sm text-[var(--sc-text-secondary)] truncate">@{otherUser.handle}</p>
                  </div>
                  <span className="ml-auto inline-block px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg uppercase tracking-wider shrink-0">{conn.status}</span>
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

        {/* Vet Verification modal */}
        {isOwnProfile && user?.uid && (
          <VetVerificationModal
            isOpen={vetModalOpen}
            onClose={() => setVetModalOpen(false)}
            userId={user.uid}
            email={user.email}
            displayName={user.displayName}
          />
        )}

        {/* Merchant coming-soon toast */}
        {merchantToast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl">
              <Store size={16} className="text-amber-400" />
              Become a Merchant: Coming soon!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
