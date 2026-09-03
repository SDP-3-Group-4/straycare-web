import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import ProfileHeader from "./ProfileHeader";
import VetVerificationModal from "./VetVerificationModal";
import DisconnectConfirmModal from "../../common/DisconnectConfirmModal";
import PostCard from "./PostCard";
import {
  Package,
  Users,
  LayoutList,
  Loader2,
  User,
  ShieldCheck,
  Store,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sparkles,
  UserMinus,
  UserPlus,
  Compass,
  Share2,
  CheckCircle2,
  Clock,
  CreditCard,
  Truck,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  fetchUserProfile,
  fetchPosts,
  fetchConnections,
  fetchUserOrders,
  deleteOrder,
  cleanupAllOrders,
  initiatePayment,
  fetchVetApplicationStatus,
  CONNECTIONS_UPDATED_EVENT,
  disconnectConnection,
  fetchNetworkSuggestions,
  requestConnection,
} from "../../../services/api";
import { avatarOnError, formatHandle } from "../../../constants";

export default function ProfileFeed() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("id") || user?.uid;
  const isOwnProfile = targetUserId === user?.uid;

  const [activeTab, setActiveTab] = useState<
    "posts" | "orders" | "connections"
  >("posts");

  const [profileData, setProfileData] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [networkSuggestions, setNetworkSuggestions] = useState<any[]>([]);
  const [connectingMap, setConnectingMap] = useState<Record<string, boolean>>(
    {},
  );
  const [requestedMap, setRequestedMap] = useState<Record<string, boolean>>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [fundraiserStats, setFundraiserStats] = useState({
    count: 0,
    raised: 0,
    donors: 0,
    goal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [vetModalOpen, setVetModalOpen] = useState(false);
  const [merchantToast, setMerchantToast] = useState(false);
  const [accountOpen, setAccountOpen] = useState(true);
  const [vetStatus, setVetStatus] = useState<string | null>(null);
  const [disconnectConfirm, setDisconnectConfirm] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (isOwnProfile && user?.uid) {
      fetchVetApplicationStatus(user.uid)
        .then((app) => setVetStatus(app?.status || null))
        .catch(() => setVetStatus(null));
    } else {
      setVetStatus(null);
    }
  }, [isOwnProfile, user?.uid]);

  const [isClearingOrders, setIsClearingOrders] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [gatewayUrl, setGatewayUrl] = useState<string | null>(null);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [activeOrderAmount, setActiveOrderAmount] = useState(0);

  const handleClearAllOrders = async () => {
    if (
      !window.confirm(
        "Clear all stale orders across the system? This will delete old test records so you can start fresh.",
      )
    )
      return;
    setIsClearingOrders(true);
    try {
      await cleanupAllOrders();
      setOrders([]);
      alert("All stale orders cleared successfully!");
    } catch (err: any) {
      console.error("Failed to clear orders:", err);
      alert(err?.message || "Failed to clear orders.");
    } finally {
      setIsClearingOrders(false);
    }
  };

  const handleDeleteSingleOrder = async (orderId: string) => {
    if (!window.confirm("Remove this order record?")) return;
    setDeletingOrderId(orderId);
    try {
      await deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: any) {
      console.error("Failed to delete order:", err);
      alert(err?.message || "Failed to delete order.");
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handlePayOrder = async (orderId: string, amount: number) => {
    if (amount <= 0) {
      alert("Order amount must be greater than 0 to proceed with payment.");
      return;
    }
    try {
      const res = await initiatePayment({
        amount,
        paymentType: "ORDER",
        orderId,
      });
      if (res?.gatewayUrl) {
        window.open(res.gatewayUrl, "_blank");
      } else {
        alert("Could not initialize SSLCommerz gateway for this order.");
      }
    } catch (err: any) {
      console.error("Order payment error:", err);
      alert(err?.message || "Failed to launch SSLCommerz gateway.");
    }
  };

  // Cross-tab synchronization when paying order in a new tab
  useEffect(() => {
    const handlePaymentComplete = (data: any) => {
      if (data?.status === "success" || data?.status === "VALID") {
        loadData();
      }
    };

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel("straycare_payment");
        channel.onmessage = (e) => {
          if (e.data) handlePaymentComplete(e.data);
        };
      } catch (err) {}
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "straycare_payment_event" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handlePaymentComplete(parsed);
        } catch (err) {}
      }
    };
    window.addEventListener("storage", handleStorage);

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "PAYMENT_COMPLETE") {
        handlePaymentComplete(e.data);
      }
    };
    window.addEventListener("message", handleMessage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    if (!merchantToast) return;
    const t = setTimeout(() => setMerchantToast(false), 2600);
    return () => clearTimeout(t);
  }, [merchantToast]);

  const loadData = () => {
    if (!user || !targetUserId) return;
    setLoading(true);
    const connPromise = fetchConnections(targetUserId).catch(() => []);
    const ordersPromise = isOwnProfile
      ? fetchUserOrders(targetUserId).catch(() => [])
      : Promise.resolve([]);
    const suggestionsPromise = fetchNetworkSuggestions(targetUserId).catch(
      () => [],
    );

    console.log(
      "[ProfileFeed] Loading profile data for targetUserId:",
      targetUserId,
    );
    Promise.all([
      fetchUserProfile(targetUserId).catch((e) => {
        console.warn("[ProfileFeed] fetchUserProfile failed:", e);
        return null;
      }),
      fetchPosts().catch((e) => {
        console.warn("[ProfileFeed] fetchPosts failed:", e);
        return [];
      }),
      connPromise,
      ordersPromise,
      suggestionsPromise,
    ])
      .then(([rawProfile, allPosts, userConns, userOrders, netSuggestions]) => {
        console.log(
          "[ProfileFeed] Received allPosts count:",
          allPosts?.length,
          "rawProfile:",
          rawProfile,
        );
        let profile = rawProfile;
        if (!profile && isOwnProfile && user) {
          profile = {
            id: user.uid,
            displayName: user.displayName,
            handle: user.handle,
            photoUrl: user.photoUrl,
            coverImageUrl: user.coverImageUrl,
            bio: user.bio,
            location: user.location,
            website: user.website,
            createdAt: user.createdAt,
            verifiedStatus: user.verifiedStatus,
            isVet: user.isVet,
            topContributor: user.topContributor,
            pets: user.pets || [],
          };
        }
        if (!profile) {
          setProfileData(null);
          setLoading(false);
          return;
        }
        // Format profile to match expected structure
        const formattedProfile = {
          id: profile.id,
          name: profile.displayName,
          handle: profile.handle,
          bio: profile.bio || "",
          avatar: profile.photoUrl || "",
          coverImage: profile.coverImageUrl || "",
          location: profile.location || "",
          website: profile.website || "",
          joinedDate: profile.createdAt
            ? new Date(profile.createdAt).toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })
            : "Recently joined",
          isVerified: profile.verifiedStatus,
          isVet: profile.isVet,
          topContributor: profile.topContributor,
          pets: profile.pets || [],
        };

        setProfileData(formattedProfile);

        // Filter posts for this user
        const filtered = allPosts.filter(
          (p: any) => p.authorId === targetUserId,
        );
        setUserPosts(filtered);

        setConnections(userConns || []);
        setOrders((userOrders || []).filter((o: any) => o && o.total > 0));
        setNetworkSuggestions(netSuggestions || []);

        const fundraiserPosts = filtered.filter(
          (p: any) => p.fundraiseGoal != null,
        );
        setFundraiserStats({
          count: fundraiserPosts.length,
          raised: fundraiserPosts.reduce(
            (sum: number, p: any) => sum + (p.raisedAmount || 0),
            0,
          ),
          donors: fundraiserPosts.reduce(
            (sum: number, p: any) => sum + (p.donorsCount || 0),
            0,
          ),
          goal: fundraiserPosts.reduce(
            (sum: number, p: any) => sum + (p.fundraiseGoal || 0),
            0,
          ),
        });

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching profile data:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [user, targetUserId]);

  useEffect(() => {
    const handlePostChange = () => {
      loadData();
    };
    window.addEventListener("postCreated", handlePostChange);
    window.addEventListener("postDeleted", handlePostChange);
    return () => {
      window.removeEventListener("postCreated", handlePostChange);
      window.removeEventListener("postDeleted", handlePostChange);
    };
  }, [targetUserId]);

  useEffect(() => {
    const handler = () => {
      if (targetUserId) {
        fetchConnections(targetUserId)
          .then(setConnections)
          .catch(console.error);
        fetchNetworkSuggestions(targetUserId)
          .then(setNetworkSuggestions)
          .catch(console.error);
      }
    };
    window.addEventListener(CONNECTIONS_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CONNECTIONS_UPDATED_EVENT, handler);
  }, [targetUserId]);

  useEffect(() => {
    if (activeTab === "connections" && targetUserId) {
      fetchConnections(targetUserId).then(setConnections).catch(console.error);
      fetchNetworkSuggestions(targetUserId)
        .then(setNetworkSuggestions)
        .catch(console.error);
    }
  }, [activeTab, targetUserId]);

  const handleRequestSuggestion = async (recipientId: string) => {
    if (!recipientId || connectingMap[recipientId]) return;
    setConnectingMap((prev) => ({ ...prev, [recipientId]: true }));
    try {
      await requestConnection(recipientId);
      setRequestedMap((prev) => ({ ...prev, [recipientId]: true }));
      window.dispatchEvent(new Event(CONNECTIONS_UPDATED_EVENT));
    } catch (e: any) {
      alert(e.message || "Failed to send connection request");
    } finally {
      setConnectingMap((prev) => ({ ...prev, [recipientId]: false }));
    }
  };

  const handleDisconnect = async (otherUserId: string) => {
    if (!otherUserId) return;
    try {
      await disconnectConnection(otherUserId);
      setConnections((prev) =>
        prev.filter((c) => {
          const other = c.requesterId === user?.uid ? c.recipient : c.requester;
          return other?.id !== otherUserId;
        }),
      );
      setDisconnectConfirm(null);
      window.dispatchEvent(new Event(CONNECTIONS_UPDATED_EVENT));
    } catch (e: any) {
      alert(e.message || "Failed to disconnect");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2
          className="animate-spin text-[var(--sc-brand-600)]"
          size={36}
        />
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
            setActiveTab("connections");
            setTimeout(
              () => window.scrollTo({ top: 380, behavior: "smooth" }),
              100,
            );
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
            <span className="text-[12px] sm:text-[13px] font-bold text-white">
              Account & Verification
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-semibold text-white/80 hidden xs:inline">
                Grow profile
              </span>
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
                        {vetStatus === "approved"
                          ? "Verified Vet"
                          : "Apply for Vet Verification"}
                      </p>
                      <p className="text-[11px] sm:text-[12px] text-gray-500 truncate">
                        {vetStatus === "approved"
                          ? "You are verified — thank you for keeping pets safe"
                          : vetStatus === "pending"
                            ? "Application under review"
                            : "Get a verified badge with authentic credentials"}
                      </p>
                    </div>
                    {vetStatus === "approved" ? (
                      <span className="flex items-center gap-1 shrink-0 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        <ShieldCheck size={12} /> Verified
                      </span>
                    ) : vetStatus === "pending" ? (
                      <span className="shrink-0 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Pending
                      </span>
                    ) : (
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-gray-300"
                      />
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
                  <p className="font-bold text-[var(--sc-text-primary)] text-[13px] sm:text-[14px]">
                    Become a Merchant
                  </p>
                  <p className="text-[11px] sm:text-[12px] text-gray-500 truncate">
                    Sell pet supplies to the community
                  </p>
                </div>
                <span className="flex items-center gap-1 shrink-0 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  <Sparkles size={11} /> Soon
                </span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Sticky Header & Tabs */}
      <div className="sticky-glass mb-4 sm:mb-6 shadow-xs sm:rounded-2xl mt-1 -mx-2 sm:mx-0 flex flex-col">
        {/* Compact User Info (Sticks to top) */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--sc-border)]/50">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 shrink-0 border-2 border-white shadow-sm flex items-center justify-center">
            {profileData.avatar ? (
              <img
                src={profileData.avatar}
                onError={avatarOnError}
                alt={profileData.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={18} className="text-gray-400" />
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span
              className="font-bold text-[15px] leading-tight text-[var(--sc-text-primary)] truncate notranslate"
              translate="no"
            >
              {profileData.name}
            </span>
            <span
              className="text-[12px] text-[var(--sc-text-secondary)] leading-tight truncate notranslate"
              translate="no"
            >
              {formatHandle(profileData.handle)}
            </span>
          </div>
          {isOwnProfile && (
            <span className="px-2 py-1 bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] text-[10px] font-bold rounded-lg shrink-0">
              You
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 w-full p-1.5">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-[12px] sm:text-[14px] transition-all ${
              activeTab === "posts"
                ? "bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] shadow-xs"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <LayoutList size={16} />
            <span className="truncate">
              {isOwnProfile ? "My Posts" : "Posts"}
            </span>
          </button>
          {isOwnProfile && (
            <>
              <button
                onClick={() => setActiveTab("orders")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-[12px] sm:text-[14px] transition-all ${
                  activeTab === "orders"
                    ? "bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] shadow-xs"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Package size={16} />
                <span className="truncate">Orders</span>
              </button>
              <button
                onClick={() => setActiveTab("connections")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-[12px] sm:text-[14px] transition-all ${
                  activeTab === "connections"
                    ? "bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] shadow-xs"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
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
        {activeTab === "posts" && (
          <>
            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  authorId={post.authorId}
                  authorName={post.author?.displayName || profileData?.name}
                  authorAvatar={post.author?.photoUrl || profileData?.avatar}
                  authorHandle={post.author?.handle || profileData?.handle}
                  timeAgo={new Date(
                    post.createdAt || Date.now(),
                  ).toLocaleDateString()}
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
                  isVerified={
                    post.author?.verifiedStatus || profileData?.isVerified
                  }
                  onPostDeleted={() => {
                    setUserPosts((prev) =>
                      prev.filter((p) => p.id !== post.id),
                    );
                  }}
                />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 border border-[var(--sc-border)] rounded-2xl bg-white p-6">
                <p className="font-semibold text-sm">No posts yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Posts by this user will appear here.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "orders" && (
          <div className="flex flex-col gap-4">
            {/* Tab Controls Bar */}
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-[14px] sm:text-[15px] font-bold text-[var(--sc-text-primary)] flex items-center gap-1.5">
                  <Package size={16} className="text-[var(--sc-brand-600)]" />
                  <span>Marketplace Orders & Tracking ({orders.length})</span>
                </h3>
                <p className="text-xs text-[var(--sc-text-secondary)] mt-0.5">
                  Track care supply orders, payment status, and dispatch progress
                </p>
              </div>

              {orders.length > 0 && isOwnProfile && (
                <button
                  onClick={handleClearAllOrders}
                  disabled={isClearingOrders}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  title="Clear all stale orders"
                >
                  <Trash2 size={13} />
                  <span>{isClearingOrders ? "Clearing..." : "Clear Stale Orders"}</span>
                </button>
              )}
            </div>

            {orders.length > 0 ? (
              orders.map((order) => {
                const isPaid =
                  order.status === "completed" || order.status === "paid";
                const isCancelled = order.status === "cancelled";
                const isPending = !isPaid && !isCancelled;

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-[var(--sc-border)] rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-xs transition-all hover:shadow-sm"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] flex items-center justify-center shrink-0 border border-[var(--sc-brand-100)]">
                          <Package size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-extrabold text-[15px] text-gray-900 tracking-tight">
                              #SC-{order.id.slice(-6).toUpperCase()}
                            </span>
                            {/* Status Badge */}
                            {isPaid && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-full">
                                <CheckCircle2 size={12} />
                                <span>Paid via SSLCommerz</span>
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold rounded-full">
                                <Clock size={12} />
                                <span>Awaiting Payment / Verification</span>
                              </span>
                            )}
                            {isCancelled && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold rounded-full">
                                <AlertCircle size={12} />
                                <span>Cancelled</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--sc-text-secondary)] mt-0.5">
                            Placed on{" "}
                            {new Date(
                              order.createdAt || Date.now(),
                            ).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right shrink-0">
                          <p className="font-extrabold text-[16px] text-gray-900">
                            <span className="font-['Noto_Sans_Bengali',sans-serif]">৳</span>
                            {order.total.toFixed(2)}
                          </p>
                          <span className="text-[11px] text-gray-400 font-medium">
                            Total BDT
                          </span>
                        </div>
                        {isOwnProfile && (
                          <button
                            onClick={() => handleDeleteSingleOrder(order.id)}
                            disabled={deletingOrderId === order.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                            title="Delete this order"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Visual Progress Pipeline */}
                    <div className="pt-2 pb-1 border-t border-gray-100">
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </div>
                          <span className="font-semibold text-emerald-700">
                            Order Placed
                          </span>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isPaid
                                ? "bg-emerald-500 text-white"
                                : isPending
                                  ? "bg-amber-400 text-white animate-pulse"
                                  : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            {isPaid ? "✓" : "2"}
                          </div>
                          <span
                            className={`font-semibold ${
                              isPaid
                                ? "text-emerald-700"
                                : isPending
                                  ? "text-amber-800"
                                  : "text-gray-400"
                            }`}
                          >
                            {isPaid ? "Payment Verified" : "Verification"}
                          </span>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isPaid
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            <Truck size={11} />
                          </div>
                          <span
                            className={`font-semibold ${
                              isPaid ? "text-blue-700" : "text-gray-400"
                            }`}
                          >
                            {isPaid ? "Out for Delivery" : "Dispatch"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action / Info Bar */}
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <span>Standard Courier: 2-3 business days</span>
                      </span>

                      {isPending && order.total > 0 && (
                        <button
                          onClick={() => handlePayOrder(order.id, order.total)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          <CreditCard size={13} />
                          <span>
                            Pay <span className="font-['Noto_Sans_Bengali',sans-serif]">৳</span>{order.total.toFixed(2)} via SSLCommerz
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white border border-[var(--sc-border)] rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Package className="text-gray-400" size={28} />
                </div>
                <h3 className="text-base font-bold text-[var(--sc-text-primary)] mb-1">
                  No orders yet
                </h3>
                <p className="text-xs text-[var(--sc-text-secondary)]">
                  Items purchased in the marketplace will show up here with live SSLCommerz payment tracking.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "connections" && (
          <div className="flex flex-col gap-6">
            {/* Direct Connections Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[13px] sm:text-[14px] font-bold text-[var(--sc-text-primary)] flex items-center gap-1.5">
                  <Users size={16} className="text-[var(--sc-brand-600)]" />
                  Direct Connections ({connections.length})
                </h3>
              </div>

              {connections.length > 0 ? (
                connections.map((conn) => {
                  const isRequester =
                    conn.requesterId === (user?.uid || targetUserId);
                  const otherUser = isRequester
                    ? conn.recipient
                    : conn.requester;
                  if (!otherUser) return null;
                  const isOwn = isOwnProfile;
                  return (
                    <div
                      key={conn.id}
                      className="bg-white border border-[var(--sc-border)] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-gray-50/80 transition-all shadow-xs"
                    >
                      <Link
                        to={`/profile?id=${otherUser.id}`}
                        className="flex items-center gap-3 min-w-0 flex-1 group"
                      >
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 flex-shrink-0 group-hover:ring-2 group-hover:ring-[var(--sc-brand-500)] transition-all">
                          {otherUser.photoUrl ? (
                            <img
                              src={otherUser.photoUrl}
                              alt={otherUser.displayName}
                              onError={avatarOnError}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <User size={20} className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-[13px] sm:text-[14px] text-[var(--sc-text-primary)] group-hover:text-[var(--sc-brand-600)] group-hover:underline truncate transition-colors">
                              {otherUser.displayName}
                            </p>
                            <span className="px-1.5 py-0.2 bg-purple-50 text-[var(--sc-brand-700)] border border-[var(--sc-brand-200)] text-[10px] font-bold rounded-md">
                              1st
                            </span>
                          </div>
                          <p
                            className="text-xs text-[var(--sc-text-secondary)] truncate notranslate"
                            translate="no"
                          >
                            {formatHandle(
                              otherUser.handle,
                              otherUser.displayName,
                            )}
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
                        <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-lg shrink-0">
                          {conn.status}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-white border border-[var(--sc-border)] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2.5">
                    <Users className="text-gray-400" size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--sc-text-primary)] mb-0.5">
                    No direct connections yet
                  </h3>
                  <p className="text-xs text-[var(--sc-text-secondary)]">
                    Explore the suggestions below to expand your rescue network.
                  </p>
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
                  {networkSuggestions.map((suggested) => {
                    const isRequested = requestedMap[suggested.id];
                    const isConnecting = connectingMap[suggested.id];

                    return (
                      <div
                        key={suggested.id}
                        className="bg-white border border-[var(--sc-border)] rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-[var(--sc-brand-200)] transition-all"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <Link
                            to={`/profile?id=${suggested.id}`}
                            className="shrink-0"
                          >
                            <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 hover:ring-2 hover:ring-[var(--sc-brand-500)] transition-all">
                              {suggested.photoUrl ? (
                                <img
                                  src={suggested.photoUrl}
                                  alt={suggested.displayName}
                                  onError={avatarOnError}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <User size={22} className="text-gray-400" />
                              )}
                            </div>
                          </Link>

                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/profile?id=${suggested.id}`}
                              className="block group"
                            >
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-[13px] sm:text-[14px] text-[var(--sc-text-primary)] group-hover:text-[var(--sc-brand-600)] group-hover:underline truncate transition-colors">
                                  {suggested.displayName}
                                </p>
                                <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-md shrink-0">
                                  {suggested.degree === 2 ? "2nd" : "3rd+"}
                                </span>
                              </div>
                              <p
                                className="text-xs text-[var(--sc-text-secondary)] truncate notranslate"
                                translate="no"
                              >
                                {formatHandle(suggested.handle || "user")}
                              </p>
                            </Link>

                            {/* Mutuals Bridge Preview */}
                            {suggested.mutualCount > 0 ? (
                              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-blue-700 font-medium bg-blue-50/70 px-2 py-0.5 rounded-lg">
                                <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                                  {suggested.mutuals
                                    ?.slice(0, 2)
                                    .map((m: any) => (
                                      <div
                                        key={m.id}
                                        className="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-white overflow-hidden bg-gray-200"
                                      >
                                        {m.photoUrl ? (
                                          <img
                                            src={m.photoUrl}
                                            alt={m.displayName}
                                            onError={avatarOnError}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <User
                                            size={8}
                                            className="text-gray-400"
                                          />
                                        )}
                                      </div>
                                    ))}
                                </div>
                                <span className="truncate">
                                  {suggested.mutualCount} mutual connection
                                  {suggested.mutualCount > 1 ? "s" : ""}
                                </span>
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
                              ? "bg-amber-100 text-amber-700 border border-amber-200 cursor-default"
                              : "bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white shadow-xs"
                          }`}
                        >
                          {isConnecting ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : isRequested ? (
                            "Request Pending"
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

        {/* Mobile-friendly Disconnect Confirmation Modal */}
        <DisconnectConfirmModal
          isOpen={Boolean(disconnectConfirm)}
          onClose={() => setDisconnectConfirm(null)}
          onConfirm={() =>
            disconnectConfirm && handleDisconnect(disconnectConfirm)
          }
          userName={(() => {
            const target = connections.find((c) => {
              const other =
                c.requesterId === user?.uid ? c.recipient : c.requester;
              return other?.id === disconnectConfirm;
            });
            return target
              ? target.requesterId === user?.uid
                ? target.recipient?.displayName
                : target.requester?.displayName
              : undefined;
          })()}
        />
      </div>
    </div>
  );
}
