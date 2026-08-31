import { useState, useEffect } from 'react';
import './PostCard.css';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, BadgeCheck, Pencil, Trash2, UserPlus, User, Loader2 } from "lucide-react";
import { createPortal } from 'react-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { toggleLike, fetchLikeStatus, toggleBookmark, fetchBookmarkStatus, deletePost, updatePost, donateToPost, requestConnection, fetchConnectionStatus } from '../../../services/api';
import CommentSheet from './CommentSheet';
import PostMedia from './PostMedia';
import PostActions from './PostActions';
import DonationModal from './DonationModal';
import { Link } from 'react-router-dom';
import { avatarOnError, formatHandle } from '../../../constants';

interface PostCardProps {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  authorHandle?: string;
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
  authorHandle,
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

  const isOwnPost = Boolean(user?.uid && authorId && user.uid === authorId);

  // Synced User Display Data
  const displayAuthorName = (isOwnPost && user?.displayName) ? user.displayName : (authorName || 'User');
  const displayAvatar = (isOwnPost && (user?.photoUrl)) ? (user?.photoUrl) : authorAvatar;
  const rawHandle = (isOwnPost && (user as any)?.handle) 
    ? (user as any).handle 
    : (authorHandle || displayAuthorName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user');
  const displayHandle = formatHandle(rawHandle);

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
          title: `Post by ${displayAuthorName}`,
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
              {displayAvatar ? (
                <img 
                  src={displayAvatar} 
                  alt={displayAuthorName || 'Author'}
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

          {/* Author Name + Handle + Category + Subtitle */}
          <div className="flex flex-col min-w-0 flex-1 justify-center">
            <div className="flex items-center gap-1.5 min-w-0">
              <Link to={`/profile?id=${authorId}`} className="font-bold text-[14px] sm:text-[15px] text-[var(--sc-text-primary)] hover:underline truncate notranslate" translate="no">
                {displayAuthorName}
              </Link>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${cat.colorClass}`}>
                {cat.label}
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-[11px] sm:text-[12px] text-[var(--sc-text-muted)] truncate mt-0.5">
              <span className="text-gray-500 font-medium shrink-0 notranslate" translate="no">{displayHandle}</span>
              <span className="shrink-0">•</span>
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

          {isOwnPost && (
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
          <PostMedia mediaList={mediaList} />
        </div>
      )}

      {/* Fundraise Progress */}
      {category === 'fundraise' && fundraiseGoal && (
        <div className="mb-3.5 bg-[var(--sc-brand-50)] rounded-xl p-3.5 sm:p-4 border border-[var(--sc-brand-100)] w-full box-border">
          <div className="flex justify-between text-[12px] sm:text-[13px] mb-2 font-bold">
            <span className="text-[var(--sc-brand-800)] truncate mr-2">Raised: <span className="notranslate" translate="no">৳{raisedAmount.toLocaleString()}</span></span>
            <span className="text-[var(--sc-brand-600)] shrink-0">Goal: <span className="notranslate" translate="no">৳{fundraiseGoal.toLocaleString()}</span></span>
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
            disabled={isOwnPost}
          >
            {isOwnPost ? 'Your Fundraiser' : 'Donate Now'}
          </button>
        </div>
      )}

      <PostActions 
        isLiked={isLiked}
        likesCount={likesCount}
        commentsCount={commentsCount}
        isBookmarked={isBookmarked}
        onLike={handleLike}
        onComment={() => setIsCommentSheetOpen(true)}
        onShare={handleShare}
        onBookmark={handleBookmark}
      />

      <CommentSheet 
        postId={id} 
        isOpen={isCommentSheetOpen} 
        onClose={() => setIsCommentSheetOpen(false)} 
        onCommentAdded={() => setCommentsCount(c => c + 1)}
        onCommentDeleted={() => setCommentsCount(c => Math.max(0, c - 1))}
      />

      <DonationModal 
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        authorName={displayAuthorName}
        donationAmount={donationAmount}
        setDonationAmount={setDonationAmount}
        onDonate={handleDonate}
        isDonating={isDonating}
      />
    </article>
  );
}
