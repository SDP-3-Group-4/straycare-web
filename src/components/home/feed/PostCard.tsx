import { useState, useEffect } from 'react';
import './PostCard.css';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, BadgeCheck, Pencil, Trash2, UserPlus, User, Loader2 } from "lucide-react";
import { createPortal } from 'react-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { toggleLike, fetchLikeStatus, toggleBookmark, fetchBookmarkStatus, deletePost, updatePost, donateToPost, requestConnection, fetchConnectionStatus } from '../../../services/api';
import CommentSheet from './CommentSheet';
import { Link } from 'react-router-dom';
import { avatarOnError } from '../../../constants';

interface PostCardProps {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  timeAgo: string;
  category: 'adoption' | 'fun' | 'rescue' | 'fundraise' | string;
  content: string;
  imageUrl?: string;
  media?: { url: string; type: 'image' | 'video' }[];
  location?: string;
  likesCount: number;
  commentsCount: number;
  fundraiseGoal?: number;
  raisedAmount?: number;
  donorsCount?: number;
  isVerified?: boolean;
  onPostDeleted?: () => void;
}

const categoryConfig: Record<string, { label: string, colorClass: string }> = {
  adoption: { label: 'Adoption', colorClass: 'bg-green-100 text-green-700' },
  fun: { label: 'Fun', colorClass: 'bg-blue-100 text-blue-700' },
  rescue: { label: 'Rescue', colorClass: 'bg-red-100 text-red-700' },
  fundraise: { label: 'Fundraise', colorClass: 'bg-[var(--sc-brand-100)] text-[var(--sc-brand-700)]' },
};

export default function PostCard({
  id,
  authorId,
  authorName,
  authorAvatar,
  timeAgo,
  category,
  content,
  imageUrl,
  media,
  location,
  likesCount: initialLikesCount,
  commentsCount: initialCommentsCount,
  fundraiseGoal,
  raisedAmount: initialRaisedAmount,
  donorsCount: initialDonorsCount,
  isVerified = false,
  onPostDeleted
}: PostCardProps) {
  const cat = categoryConfig[category] || { label: category, colorClass: 'bg-gray-100 text-gray-700' };
  const { user } = useAuth();

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);

  // Fundraise State
  const [raisedAmount, setRaisedAmount] = useState(initialRaisedAmount || 0);
  const [donorsCount, setDonorsCount] = useState(initialDonorsCount || 0);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [isDonating, setIsDonating] = useState(false);
  
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (user && authorId && user.uid !== authorId) {
      fetchConnectionStatus(user.uid, authorId).then(data => {
        setConnectionStatus(data.status);
      }).catch(console.error);
    }
  }, [user, authorId]);

  // Actions Menu State
  const [showActions, setShowActions] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [activeMedia, setActiveMedia] = useState<number | null>(null);
  const mediaList: { url: string; type: 'image' | 'video' }[] = (media && Array.isArray(media) && media.length ? media : imageUrl ? [{ url: imageUrl, type: 'image' as const }] : []) as any;

  useEffect(() => {
    if (user) {
      fetchLikeStatus(id, user.uid).then(res => setIsLiked(res.liked)).catch(console.error);
      fetchBookmarkStatus(id, user.uid).then(res => setIsBookmarked(res.bookmarked)).catch(console.error);
    }
  }, [user, id]);

  const handleLike = async () => {
    if (!user) return;
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    try {
      const res = await toggleLike(id);
      setIsLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch (err) {
      setIsLiked(!isLiked);
      setLikesCount(prev => !isLiked ? prev - 1 : prev + 1);
    }
  };

  const handleBookmark = async () => {
    if (!user) return;
    setIsBookmarked(!isBookmarked);
    try {
      const res = await toggleBookmark(id);
      setIsBookmarked(res.bookmarked);
    } catch (err) {
      setIsBookmarked(!isBookmarked);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${authorName}`,
          text: content,
          url: `${window.location.origin}/post/${id}`,
        });
      } catch (e) {
        console.error("Error sharing", e);
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
      alert("Link copied to clipboard!");
    }
  };

  const handleDeletePost = async () => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost(id);
      if (onPostDeleted) onPostDeleted();
    } catch (err) {
      console.error(err);
      alert('Failed to delete post.');
    }
  };

  const handleSaveEdit = async () => {
    if (!user) return;
    try {
      await updatePost(id, { content: editContent });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert('Failed to update post');
    }
  };

  const handleDonate = async () => {
    if (!user) return;
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    
    setIsDonating(true);
    try {
      await donateToPost(id, amount);
      setRaisedAmount(prev => prev + amount);
      setDonorsCount(prev => prev + 1);
      setIsDonationModalOpen(false);
      setDonationAmount("");
      alert("Thank you for your donation!");
    } catch (e) {
      console.error(e);
      alert("Failed to process donation.");
    } finally {
      setIsDonating(false);
    }
  };

  return (
    <article className="bg-white rounded-2xl p-3.5 sm:p-5 mb-3 sm:mb-4 border border-[var(--sc-border)] overflow-hidden w-full max-w-full box-border shadow-xs">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          {/* Avatar */}
          <Link to={`/profile?id=${authorId}`} className="shrink-0 relative block">
            <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 shrink-0 ${isVerified ? 'ring-2 ring-offset-2 ring-[var(--sc-brand-500)]' : ''}`}>
              {(authorId === user?.uid ? (user?.photoURL || user?.photoUrl || authorAvatar) : authorAvatar) ? (
                <img 
                  src={(authorId === user?.uid ? (user?.photoURL || user?.photoUrl || authorAvatar) : authorAvatar) || undefined} 
                  alt={authorName || 'Author'}
                  onError={avatarOnError}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User size={18} className="text-gray-400" />
              )}
            </div>
            {isVerified && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-xs">
                <BadgeCheck size={13} className="text-[var(--sc-brand-500)]" />
              </div>
            )}
          </Link>

          {/* Author Name + Category + Subtitle */}
          <div className="flex flex-col min-w-0 flex-1 justify-center">
            <div className="flex items-center gap-1.5 min-w-0">
              <Link to={`/profile?id=${authorId}`} className="font-bold text-[14px] sm:text-[15px] text-[var(--sc-text-primary)] hover:underline truncate">
                {authorName}
              </Link>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${cat.colorClass}`}>
                {cat.label}
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-[11px] sm:text-[12px] text-[var(--sc-text-muted)] truncate mt-0.5">
              <span className="shrink-0">{timeAgo}</span>
              {location && (
                <>
                  <span className="shrink-0">•</span>
                  <span className="truncate">{location}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Right header actions: Connect & Options menu */}
        <div className="flex items-center gap-1 shrink-0">
          {user && user.uid !== authorId && (
            <button
              onClick={async () => {
                if (connectionStatus !== 'none' || isConnecting) return;
                setIsConnecting(true);
                try {
                  await requestConnection(authorId!);
                  setConnectionStatus('pending');
                } catch(e) {
                  console.error(e);
                } finally {
                  setIsConnecting(false);
                }
              }}
              disabled={connectionStatus !== 'none' || isConnecting}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 ${
                connectionStatus === 'none'
                  ? 'bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-100)]'
                  : connectionStatus === 'pending'
                    ? 'bg-amber-50 text-amber-600'
                    : connectionStatus === 'accepted'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-500'
              }`}
            >
              {isConnecting ? <Loader2 size={11} className="animate-spin" /> : connectionStatus === 'none' ? <UserPlus size={11} /> : null}
              <span>
                {isConnecting ? '...' : connectionStatus === 'pending' ? 'Pending' : connectionStatus === 'accepted' ? 'Friends' : 'Connect'}
              </span>
            </button>
          )}

          {user?.uid === authorId && (
            <div className="relative">
              <button 
                className="text-gray-400 hover:text-[var(--sc-brand-600)] transition-colors p-1.5 rounded-full hover:bg-[var(--sc-brand-50)]"
                onClick={() => setShowActions(!showActions)}
                aria-label="Post options"
              >
                <MoreHorizontal size={18} />
              </button>
              {showActions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)}></div>
                  <div className="absolute right-0 mt-1 w-44 bg-white border border-[var(--sc-border)] rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col py-1.5 animate-in fade-in zoom-in-95 duration-200">
                    <button 
                      onClick={() => { setIsEditing(true); setShowActions(false); }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                    >
                      <Pencil size={16} className="text-gray-500" /> 
                      Edit Post
                    </button>
                    <button 
                      onClick={() => { handleDeletePost(); setShowActions(false); }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <Trash2 size={16} className="text-red-500" /> 
                      Delete Post
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      {isEditing ? (
        <div className="mb-4">
          <textarea 
            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--sc-brand-500)]"
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setIsEditing(false)} className="text-sm text-gray-500 font-medium px-3 py-1">Cancel</button>
            <button onClick={handleSaveEdit} className="text-sm bg-[var(--sc-brand-500)] text-white px-4 py-1.5 rounded-full font-bold">Save</button>
          </div>
        </div>
      ) : (
        <p className="text-[var(--sc-text-primary)] text-[14px] sm:text-[15px] mb-3.5 whitespace-pre-wrap break-words leading-relaxed">{editContent}</p>
      )}
      
      {/* Media collage / carousel */}
      {mediaList.length > 0 && !isEditing && (
        <div className="mb-3.5 w-full">
          {mediaList.length === 1 ? (
            <div className="rounded-xl overflow-hidden border border-gray-100 cursor-pointer max-h-[420px] bg-gray-900 flex items-center justify-center" onClick={() => setActiveMedia(0)}>
              {mediaList[0].type === 'video' ? (
                <video src={mediaList[0].url} controls className="w-full max-h-[420px] object-contain" />
              ) : (
                <img src={mediaList[0].url} alt="Post media" className="w-full h-auto max-h-[420px] object-cover" />
              )}
            </div>
          ) : mediaList.length === 2 ? (
            <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-gray-100">
              {mediaList.map((m, i) => (
                <div key={i} className="cursor-pointer bg-black aspect-square sm:h-48" onClick={() => setActiveMedia(i)}>
                  {m.type === 'video' ? <video src={m.url} className="w-full h-full object-cover" muted /> : <img src={m.url} alt={`media ${i}`} className="w-full h-full object-cover" />}
                </div>
              ))}
            </div>
          ) : mediaList.length === 3 ? (
            <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-gray-100">
              <div className="row-span-2 cursor-pointer bg-black min-h-[160px]" onClick={() => setActiveMedia(0)}>
                {mediaList[0].type === 'video' ? <video src={mediaList[0].url} className="w-full h-full object-cover min-h-[160px]" muted /> : <img src={mediaList[0].url} alt="media 0" className="w-full h-full object-cover min-h-[160px]" />}
              </div>
              <div className="cursor-pointer bg-black h-20 sm:h-24" onClick={() => setActiveMedia(1)}>
                {mediaList[1].type === 'video' ? <video src={mediaList[1].url} className="w-full h-full object-cover" muted /> : <img src={mediaList[1].url} alt="media 1" className="w-full h-full object-cover" />}
              </div>
              <div className="cursor-pointer bg-black h-20 sm:h-24 relative" onClick={() => setActiveMedia(2)}>
                {mediaList[2].type === 'video' ? <video src={mediaList[2].url} className="w-full h-full object-cover" muted /> : <img src={mediaList[2].url} alt="media 2" className="w-full h-full object-cover" />}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-gray-100">
              {mediaList.slice(0, 4).map((m, i) => (
                <div key={i} className="relative cursor-pointer bg-black aspect-square sm:h-44" onClick={() => setActiveMedia(i)}>
                  {m.type === 'video' ? <video src={m.url} className="w-full h-full object-cover" muted /> : <img src={m.url} alt={`media ${i}`} className="w-full h-full object-cover" />}
                  {i === 3 && mediaList.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg sm:text-xl">+{mediaList.length - 4}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          {mediaList.length > 1 && <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1">{mediaList.length} media • tap to expand</p>}
        </div>
      )}

      {/* Lightbox / Fullscreen Viewer */}
      {activeMedia !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-2 sm:p-4" onClick={() => setActiveMedia(null)}>
          <button onClick={() => setActiveMedia(null)} className="absolute top-4 right-4 text-white bg-white/20 p-2 rounded-full hover:bg-white/30 z-20"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
          <button onClick={(e) => { e.stopPropagation(); setActiveMedia(prev => (prev! > 0 ? prev! - 1 : mediaList.length - 1)); }} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white bg-white/20 p-2.5 sm:p-3 rounded-full hover:bg-white/30 z-20 flex">‹</button>
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
          <button onClick={(e) => { e.stopPropagation(); setActiveMedia(prev => (prev! < mediaList.length - 1 ? prev! + 1 : 0)); }} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white bg-white/20 p-2.5 sm:p-3 rounded-full hover:bg-white/30 z-20 flex">›</button>
        </div>
      )}

      {/* Fundraise Progress */}
      {category === 'fundraise' && fundraiseGoal && (
        <div className="mb-3.5 bg-[var(--sc-brand-50)] rounded-xl p-3.5 sm:p-4 border border-[var(--sc-brand-100)] w-full box-border">
          <div className="flex justify-between text-[12px] sm:text-[13px] mb-2 font-bold">
            <span className="text-[var(--sc-brand-800)] truncate mr-2">Raised: ৳{raisedAmount}</span>
            <span className="text-[var(--sc-brand-600)] shrink-0">Goal: ৳{fundraiseGoal}</span>
          </div>
          <div className="w-full bg-[var(--sc-brand-200)] rounded-full h-2">
            <div className="bg-[var(--sc-brand-600)] h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min((raisedAmount / fundraiseGoal) * 100, 100)}%` }}></div>
          </div>
          <div className="text-[11px] sm:text-[12px] text-[var(--sc-brand-600)] mt-2 flex justify-between items-center">
            <span>{donorsCount} donated</span>
            <span className="font-medium">{Math.min(100, Math.round((raisedAmount / fundraiseGoal) * 100))}% funded</span>
          </div>
          <button 
            onClick={() => setIsDonationModalOpen(true)}
            className="w-full mt-3 bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] transition-colors text-white font-bold py-2 rounded-full text-xs sm:text-sm active:scale-98"
            disabled={user?.uid === authorId}
          >
            {user?.uid === authorId ? 'Your Fundraiser' : 'Donate Now'}
          </button>
        </div>
      )}

      {/* Modern Compact Actions Bar */}
      <div className="flex items-center justify-between text-[var(--sc-text-secondary)] text-xs pt-2.5 mt-1 border-t border-gray-100 px-1">
        {/* Like Button */}
        <button 
          onClick={handleLike}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full transition-colors whitespace-nowrap ${
            isLiked ? 'text-red-500 font-bold bg-red-50' : 'hover:text-red-500 hover:bg-gray-50'
          }`}
          title="Like"
        >
          <Heart size={17} fill={isLiked ? "currentColor" : "none"} />
          <span className="font-semibold text-[13px]">{likesCount}</span>
        </button>

        {/* Comment Button */}
        <button 
          onClick={() => setIsCommentSheetOpen(true)}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-full hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap"
          title="Comments"
        >
          <MessageCircle size={17} />
          <span className="font-semibold text-[13px]">{commentsCount}</span>
        </button>

        {/* Share Button */}
        <button 
          onClick={handleShare}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-full hover:text-gray-900 hover:bg-gray-50 transition-colors"
          title="Share"
        >
          <Share2 size={17} />
        </button>

        {/* Bookmark Button */}
        <button 
          onClick={handleBookmark}
          className={`py-1.5 px-3 rounded-full transition-colors ${
            isBookmarked ? 'text-[var(--sc-brand-600)] bg-[var(--sc-brand-50)]' : 'hover:text-[var(--sc-brand-600)] hover:bg-gray-50'
          }`}
          title="Bookmark"
        >
          <Bookmark size={17} fill={isBookmarked ? "currentColor" : "none"} />
        </button>
      </div>

      <CommentSheet 
        postId={id} 
        isOpen={isCommentSheetOpen} 
        onClose={() => setIsCommentSheetOpen(false)} 
        onCommentAdded={() => setCommentsCount(c => c + 1)}
        onCommentDeleted={() => setCommentsCount(c => Math.max(0, c - 1))}
      />

      {isDonationModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDonationModalOpen(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col border border-[var(--sc-border)] shadow-xl animate-in fade-in zoom-in duration-200 p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-1 text-[var(--sc-text-primary)]">Donate to Fundraiser</h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-4">Supporting {authorName}'s cause.</p>
            
            <div className="p-3 bg-[var(--sc-brand-50)] rounded-xl mb-4 border border-[var(--sc-brand-100)]">
              <label className="text-[11px] sm:text-[12px] font-bold text-[var(--sc-brand-800)] uppercase tracking-wider mb-1 block">Donation Amount (৳)</label>
              <div className="flex items-center text-lg sm:text-xl font-bold text-[var(--sc-brand-900)]">
                <span className="mr-1">৳</span>
                <input 
                  type="number"
                  placeholder="500"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="bg-transparent outline-none w-full placeholder:text-[var(--sc-brand-300)]"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setIsDonationModalOpen(false)}
                className="flex-1 py-2.5 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm"
                disabled={isDonating}
              >
                Cancel
              </button>
              <button 
                onClick={handleDonate}
                className="flex-1 py-2.5 font-bold text-white bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] rounded-xl transition-colors disabled:opacity-50 text-sm"
                disabled={isDonating || !donationAmount}
              >
                {isDonating ? 'Processing...' : 'Donate'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </article>
  );
}
