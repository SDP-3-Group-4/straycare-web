import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProfileHeader from './ProfileHeader';
import VetVerificationModal from './VetVerificationModal';
import PostCard from './PostCard';
import { Package, Users, LayoutList, Loader2, User, ShieldCheck, Store, ChevronRight, ChevronUp, ChevronDown, Sparkles, UserMinus, UserPlus, Compass, Share2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { fetchUserProfile, fetchPosts, fetchConnections, fetchUserOrders, fetchVetApplicationStatus, CONNECTIONS_UPDATED_EVENT, disconnectConnection, fetchNetworkSuggestions, requestConnection } from '../../../services/api';
import { avatarOnError, formatHandle } from '../../../constants';

export default function ProfileFeed() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('id') || user?.uid;
  const isOwnProfile = targetUserId === user?.uid;
  
  const [activeTab, setActiveTab] = useState<'posts' | 'orders' | 'connections'>('posts');
  
  const [profileData, setProfileData] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [networkSuggestions, setNetworkSuggestions] = useState<any[]>([]);
  const [connectingMap, setConnectingMap] = useState<Record<string, boolean>>({});
  const [requestedMap, setRequestedMap] = useState<Record<string, boolean>>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [fundraiserStats, setFundraiserStats] = useState({ count: 0, raised: 0, donors: 0, goal: 0 });
  const [loading, setLoading] = useState(true);
  const [vetModalOpen, setVetModalOpen] = useState(false);
  const [merchantToast, setMerchantToast] = useState(false);
  const [accountOpen, setAccountOpen] = useState(true);
  const [vetStatus, setVetStatus] = useState<string | null>(null);
  const [disconnectConfirm, setDisconnectConfirm] = useState<string | null>(null);

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
    const suggestionsPromise = fetchNetworkSuggestions(targetUserId).catch(() => []);
    
    Promise.all([
      fetchUserProfile(targetUserId),
      fetchPosts(),
      connPromise,
      ordersPromise,
      suggestionsPromise
    ])
    .then(([profile, allPosts, userConns, userOrders, netSuggestions]) => {
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
      setNetworkSuggestions(netSuggestions || []);

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
      if (targetUserId) {
        fetchConnections(targetUserId).then(setConnections).catch(console.error);
        fetchNetworkSuggestions(targetUserId).then(setNetworkSuggestions).catch(console.error);
      }
    };
    window.addEventListener(CONNECTIONS_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CONNECTIONS_UPDATED_EVENT, handler);
  }, [targetUserId]);

  useEffect(() => {
    if (activeTab === 'connections' && targetUserId) {
      fetchConnections(targetUserId).then(setConnections).catch(console.error);
      fetchNetworkSuggestions(targetUserId).then(setNetworkSuggestions).catch(console.error);
    }
  }, [activeTab, targetUserId]);

  const handleRequestSuggestion = async (recipientId: string) => {
    if (!recipientId || connectingMap[recipientId]) return;
    setConnectingMap(prev => ({ ...prev, [recipientId]: true }));
    try {
      await requestConnection(recipientId);
      setRequestedMap(prev => ({ ...prev, [recipientId]: true }));
      window.dispatchEvent(new Event(CONNECTIONS_UPDATED_EVENT));
    } catch (e: any) {
      alert(e.message || 'Failed to send connection request');
    } finally {
      setConnectingMap(prev => ({ ...prev, [recipientId]: false }));
    }
  };

  const handleDisconnect = async (otherUserId: string) => {
    if (!otherUserId) return;
    try {
      await disconnectConnection(otherUserId);
      setConnections(prev => prev.filter(c => {
        const other = c.requesterId === user?.uid ? c.recipient : c.requester;
        return other?.id !== otherUserId;
      }));
      setDisconnectConfirm(null);
      window.dispatchEvent(new Event(CONNECTIONS_UPDATED_EVENT));
    } catch (e: any) {
      alert(e.message || 'Failed to disconnect');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="animate-spin text-[var(--sc-brand-600)]" size={36} />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-gray-500 bg-white rounded-2xl border border-[var(--sc-border)] m-4">
        Could not load profile.
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-[640px] w-full pt-3 sm:pt-4 pb-24 sm:pb-8 mx-auto relative animate-in fade-in duration-300 box-border px-1 sm:px-0">
      
      {/* Profile Header Block */}
      <ProfileHeader 
        user={profileData} 
        onProfileUpdate={loadData} 
        onConnectionsClick={() => {
          if (isOwnProfile) {
            setActiveTab('connections');
            setTimeout(() => window.scrollTo({ top: 380, behavior: 'smooth' }), 100);
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
        <div className="bg-white border border-[var(--sc-border)] rounded-2xl mb-4 sm:mb-6 overflow-hidden shadow-xs">
          <button
            onClick={() => setAccountOpen(!accountOpen)}
            className="w-full p-3 sm:p-3.5 flex items-center justify-between bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] transition-colors border-b border-[var(--sc-border)] text-left"
          >
            <span className="text-[12px] sm:text-[13px] font-bold text-white">Account & Verification</span>
            <span className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-semibold text-white/80 hidden xs:inline">Grow profile</span>
              {accountOpen ? (
                <ChevronUp size={16} className="text-white/80" />
              ) : (
                <ChevronDown size={16} className="text-white/80" />
              )}
            </span>
          </button>

          {accountOpen && (
            <>
              {/* Apply for Vet Verification */}
              {!user?.isVet && !user?.verifiedStatus && (
                <>
                  <button
                    onClick={() => setVetModalOpen(true)}
                    className="w-full flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] flex items-center justify-center shrink-0">
                      <ShieldCheck size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--sc-text-primary)] text-[13px] sm:text-[14px]">
                        {vetStatus === 'approved' ? 'Verified Vet' : 'Apply for Vet Verification'}
                      </p>
                      <p className="text-[11px] sm:text-[12px] text-gray-500 truncate">
                        {vetStatus === 'approved'
                          ? 'You are verified — thank you for keeping pets safe'
                          : vetStatus === 'pending'
                            ? 'Application under review'
                            : 'Get a verified badge with authentic credentials'}
                      </p>
                    </div>
                    {vetStatus === 'approved' ? (
                      <span className="flex items-center gap-1 shrink-0 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        <ShieldCheck size={12} /> Verified
                      </span>
                    ) : vetStatus === 'pending' ? (
                      <span className="shrink-0 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>
                    ) : (
                      <ChevronRight size={16} className="shrink-0 text-gray-300" />
                    )}
                  </button>

                  <div className="border-t border-[var(--sc-border)]" />
                </>
              )}

              {/* Become a Merchant */}
              <button
                onClick={() => setMerchantToast(true)}
                className="w-full flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Store size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--sc-text-primary)] text-[13px] sm:text-[14px]">Become a Merchant</p>
                  <p className="text-[11px] sm:text-[12px] text-gray-500 truncate">Sell pet supplies to the community</p>
                </div>
                <span className="flex items-center gap-1 shrink-0 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  <Sparkles size={11} /> Soon
                </span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-[var(--sc-border)] mb-4 sm:mb-6 flex items-center justify-between shadow-xs rounded-2xl p-1.5 mt-1">
        <div className="flex items-center gap-1 w-full">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-[12px] sm:text-[14px] transition-all ${
              activeTab === 'posts' 
                ? 'bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] shadow-xs' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <LayoutList size={16} />
            <span className="truncate">{isOwnProfile ? 'My Posts' : 'Posts'}</span>
          </button>
          {isOwnProfile && (
            <>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-[12px] sm:text-[14px] transition-all ${
                  activeTab === 'orders' 
                    ? 'bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] shadow-xs' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Package size={16} />
                <span className="truncate">Orders</span>
              </button>
              <button 
                onClick={() => setActiveTab('connections')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-[12px] sm:text-[14px] transition-all ${
                  activeTab === 'connections' 
                    ? 'bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] shadow-xs' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Users size={16} />
                <span className="truncate">Network</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex flex-col gap-3 sm:gap-5">
        {activeTab === 'posts' && (
          <>
            {userPosts.length > 0 ? userPosts.map(post => (
              <PostCard 
                key={post.id} 
                id={post.id}
                authorId={post.authorId}
                authorName={post.author?.displayName || profileUser?.name}
                authorAvatar={post.author?.photoUrl || profileUser?.avatar}
                authorHandle={post.author?.handle || profileUser?.handle}
                timeAgo={new Date(post.createdAt).toLocaleDateString()}
                category={post.category}
                content={post.content}
                imageUrl={post.imageUrl || undefined}
                media={post.media}
                location={post.location || undefined}
                likesCount={post._count?.likes || 0}
                commentsCount={post._count?.comments || 0}
                fundraiseGoal={post.fundraiseGoal}
                raisedAmount={post.raisedAmount}
                donorsCount={post.donorsCount}
                isVerified={post.author?.verifiedStatus || profileUser?.isVerified}
              />
            )) : (
              <div className="text-center py-12 text-gray-500 border border-[var(--sc-border)] rounded-2xl bg-white p-6">
                <p className="font-semibold text-sm">No posts yet</p>
                <p className="text-xs text-gray-400 mt-1">Posts by this user will appear here.</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'orders' && (
          <div className="flex flex-col gap-3">
            {orders.length > 0 ? orders.map(order => (
              <div key={order.id} className="bg-white border border-[var(--sc-border)] rounded-2xl p-4 flex items-center justify-between shadow-xs">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-[14px] text-[var(--sc-text-primary)] truncate">Order #{order.id.slice(-8)}</p>
                  <p className="text-xs text-[var(--sc-text-secondary)]">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[15px] text-[var(--sc-brand-600)]">৳{order.total.toFixed(2)}</p>
                  <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-lg uppercase tracking-wider mt-1">{order.status}</span>
                </div>
              </div>
            )) : (
              <div className="bg-white border border-[var(--sc-border)] rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Package className="text-gray-400" size={28} />
                </div>
                <h3 className="text-base font-bold text-[var(--sc-text-primary)] mb-1">No orders yet</h3>
                <p className="text-xs text-[var(--sc-text-secondary)]">Items purchased in the marketplace will show up here.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="flex flex-col gap-6">
            
            {/* Direct Connections Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[13px] sm:text-[14px] font-bold text-[var(--sc-text-primary)] flex items-center gap-1.5">
                  <Users size={16} className="text-[var(--sc-brand-600)]" />
                  Direct Connections ({connections.length})
                </h3>
              </div>

              {connections.length > 0 ? connections.map(conn => {
                const isRequester = conn.requesterId === (user?.uid || targetUserId);
                const otherUser = isRequester ? conn.recipient : conn.requester;
                if (!otherUser) return null;
                const isOwn = isOwnProfile;
                return (
                  <div key={conn.id} className="bg-white border border-[var(--sc-border)] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-gray-50/80 transition-all shadow-xs">
                    <Link 
                      to={`/profile?id=${otherUser.id}`}
                      className="flex items-center gap-3 min-w-0 flex-1 group"
                    >
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 flex-shrink-0 group-hover:ring-2 group-hover:ring-[var(--sc-brand-500)] transition-all">
                        {otherUser.photoUrl ? (
                          <img src={otherUser.photoUrl} alt={otherUser.displayName} onError={avatarOnError} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <User size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-[13px] sm:text-[14px] text-[var(--sc-text-primary)] group-hover:text-[var(--sc-brand-600)] group-hover:underline truncate transition-colors">
                            {otherUser.displayName}
                          </p>
                          <span className="px-1.5 py-0.2 bg-purple-50 text-[var(--sc-brand-700)] border border-[var(--sc-brand-200)] text-[10px] font-bold rounded-md">1st</span>
                        </div>
                        <p className="text-xs text-[var(--sc-text-secondary)] truncate notranslate" translate="no">
                          {formatHandle(otherUser.handle, otherUser.displayName)}
                        </p>
                      </div>
                    </Link>
                    {isOwn ? (
                      <button
                        onClick={() => setDisconnectConfirm(otherUser.id)}
                        className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold shrink-0 active:scale-95 transition-all"
                      >
                        <UserMinus size={12} /> Disconnect
                      </button>
                    ) : (
                      <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-lg uppercase tracking-wider shrink-0">{conn.status}</span>
                    )}
                  </div>
                );
              }) : (
                <div className="bg-white border border-[var(--sc-border)] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2.5">
                    <Users className="text-gray-400" size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--sc-text-primary)] mb-0.5">No direct connections yet</h3>
                  <p className="text-xs text-[var(--sc-text-secondary)]">Explore the suggestions below to expand your rescue network.</p>
                </div>
              )}
            </div>

            {/* Rescue Network Graph Suggestions (2nd-Degree Mutual Discovery) */}
            {networkSuggestions.length > 0 && isOwnProfile && (
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <Compass size={16} className="text-[var(--sc-brand-600)]" />
                    <h3 className="text-[13px] sm:text-[14px] font-bold text-[var(--sc-text-primary)]">
                      Rescue Network Suggestions
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--sc-brand-600)] bg-[var(--sc-brand-50)] border border-[var(--sc-brand-100)] px-2 py-0.5 rounded-full">
                    Graph Discovery
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {networkSuggestions.map(suggested => {
                    const isRequested = requestedMap[suggested.id];
                    const isConnecting = connectingMap[suggested.id];

                    return (
                      <div key={suggested.id} className="bg-white border border-[var(--sc-border)] rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-[var(--sc-brand-200)] transition-all">
                        <div className="flex items-start gap-3 min-w-0">
                          <Link to={`/profile?id=${suggested.id}`} className="shrink-0">
                            <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 hover:ring-2 hover:ring-[var(--sc-brand-500)] transition-all">
                              {suggested.photoUrl ? (
                                <img src={suggested.photoUrl} alt={suggested.displayName} onError={avatarOnError} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                <User size={22} className="text-gray-400" />
                              )}
                            </div>
                          </Link>

                          <div className="flex-1 min-w-0">
                            <Link to={`/profile?id=${suggested.id}`} className="block group">
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-[13px] sm:text-[14px] text-[var(--sc-text-primary)] group-hover:text-[var(--sc-brand-600)] group-hover:underline truncate transition-colors">
                                  {suggested.displayName}
                                </p>
                                <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-md shrink-0">
                                  {suggested.degree === 2 ? '2nd' : '3rd+'}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--sc-text-secondary)] truncate notranslate" translate="no">
                                {formatHandle(suggested.handle || 'user')}
                              </p>
                            </Link>

                            {/* Mutuals Bridge Preview */}
                            {suggested.mutualCount > 0 ? (
                              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-blue-700 font-medium bg-blue-50/70 px-2 py-0.5 rounded-lg">
                                <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                                  {suggested.mutuals?.slice(0, 2).map((m: any) => (
                                    <div key={m.id} className="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-white overflow-hidden bg-gray-200">
                                      {m.photoUrl ? (
                                        <img src={m.photoUrl} alt={m.displayName} onError={avatarOnError} className="h-full w-full object-cover" />
                                      ) : (
                                        <User size={8} className="text-gray-400" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <span className="truncate">{suggested.mutualCount} mutual connection{suggested.mutualCount > 1 ? 's' : ''}</span>
                              </div>
                            ) : suggested.isVet ? (
                              <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-lg">
                                <ShieldCheck size={11} /> Verified Vet
                              </span>
                            ) : (
                              <span className="inline-block mt-1 text-[11px] text-gray-500 font-medium">
                                Active in Rescue Network
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Connect Button */}
                        <button
                          onClick={() => handleRequestSuggestion(suggested.id)}
                          disabled={isRequested || isConnecting}
                          className={`w-full py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 ${
                            isRequested
                              ? 'bg-amber-100 text-amber-700 border border-amber-200 cursor-default'
                              : 'bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white shadow-xs'
                          }`}
                        >
                          {isConnecting ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : isRequested ? (
                            'Request Pending'
                          ) : (
                            <>
                              <UserPlus size={13} />
                              Connect
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
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
          <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-[110] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 bg-gray-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-2xl">
              <Store size={16} className="text-amber-400" />
              Become a Merchant: Coming soon!
            </div>
          </div>
        )}

        {disconnectConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDisconnectConfirm(null)} />
            <div className="relative bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm text-center border border-[var(--sc-border)] shadow-xl">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <UserMinus size={20} />
              </div>
              <h3 className="font-bold text-[15px] sm:text-[16px]">Disconnect?</h3>
              <p className="text-xs sm:text-[13px] text-gray-500 mt-1">You will need to send a new connection request to connect again.</p>
              <div className="flex gap-2.5 mt-4">
                <button onClick={() => setDisconnectConfirm(null)} className="flex-1 py-2 rounded-xl border border-[var(--sc-border)] font-bold text-[13px] sm:text-[14px]">Cancel</button>
                <button onClick={() => handleDisconnect(disconnectConfirm)} className="flex-1 py-2 rounded-xl font-bold text-[13px] sm:text-[14px] text-white bg-red-600 hover:bg-red-700">Disconnect</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
