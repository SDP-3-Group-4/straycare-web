import { useState, useEffect } from 'react';
import './PostCard.css';
import { Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, BadgeCheck, Pencil, Trash2 } from "lucide-react";
import { createPortal } from 'react-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { toggleLike, fetchLikeStatus, toggleBookmark, fetchBookmarkStatus, deletePost, updatePost, donateToPost, requestConnection } from '../../../services/api';
import CommentSheet from './CommentSheet';

interface PostCardProps {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  timeAgo: string;
  category: 'adoption' | 'fun' | 'rescue' | 'fundraise' | string;
  content: string;
  imageUrl?: string;
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
  fundraise: { label: 'Fundraise', colorClass: 'bg-purple-100 text-purple-700' },
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

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  useEffect(() => {
    if (user) {
      fetchLikeStatus(user.uid, id).then(res => setIsLiked(res.liked)).catch(console.error);
      fetchBookmarkStatus(user.uid, id).then(res => setIsBookmarked(res.bookmarked)).catch(console.error);
    }
  }, [user, id]);

  const handleLike = async () => {
    if (!user) return;
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    try {
      const res = await toggleLike(user.uid, id);
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
      const res = await toggleBookmark(user.uid, id);
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
      await deletePost(id, user.uid);
      if (onPostDeleted) onPostDeleted();
    } catch (err) {
      console.error(err);
      alert('Failed to delete post.');
    }
  };

  const handleSaveEdit = async () => {
    if (!user) return;
    try {
      await updatePost(id, user.uid, { content: editContent });
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
      await donateToPost(id, user.uid, amount);
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
    <article className="bg-white rounded-2xl p-5 mb-4 border border-[var(--sc-border)]">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <Avatar src={authorAvatar} size="md" className="flex-shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-bold text-[var(--sc-text-primary)] hover:underline">{authorName}</span>
              {isVerified && <BadgeCheck size={16} className="text-[var(--sc-brand-500)]" />}
              {user && user.uid !== authorId && (
                <button 
                  onClick={async () => {
                    try {
                      await requestConnection(user.uid, authorId!);
                      alert('Connection request sent!');
                    } catch(e) {
                      console.error(e);
                      alert('Failed to send connection request or already sent.');
                    }
                  }}
                  className="ml-2 text-xs font-bold text-[var(--sc-brand-600)] hover:text-[var(--sc-brand-700)] bg-[var(--sc-brand-50)] px-2 py-0.5 rounded-full transition-colors"
                >
                  + Connect
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-[var(--sc-text-muted)]">@user • {timeAgo}</span>
              {location && (
                <span className="text-[var(--sc-text-muted)]">• {location}</span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cat.colorClass}`}>
                {cat.label}
              </span>
            </div>
          </div>
        </div>
        
        {user?.uid === authorId && (
          <Dropdown>
            <DropdownTrigger>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Post Actions">
              <DropdownItem key="edit" startContent={<Pencil size={16} />} onPress={() => setIsEditing(true)}>
                Edit Post
              </DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 size={16} />} onPress={handleDeletePost}>
                Delete Post
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
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
            <button onClick={() => setIsEditing(false)} className="text-sm text-gray-500 font-medium">Cancel</button>
            <button onClick={handleSaveEdit} className="text-sm bg-[var(--sc-brand-500)] text-white px-4 py-1.5 rounded-full font-bold">Save</button>
          </div>
        </div>
      ) : (
        <p className="text-[var(--sc-text-primary)] text-[15px] mb-4 whitespace-pre-wrap">{editContent}</p>
      )}
      
      {/* Image */}
      {imageUrl && !isEditing && (
        <div className="mb-4">
          <img 
            src={imageUrl} 
            alt="Post content" 
            className="w-full h-auto max-h-[500px] object-cover rounded-xl border border-gray-100"
          />
        </div>
      )}

      {/* Fundraise Progress */}
      {category === 'fundraise' && fundraiseGoal && (
        <div className="mb-4 bg-purple-50 rounded-xl p-4 border border-purple-100">
          <div className="flex justify-between text-[13px] mb-2 font-bold">
            <span className="text-purple-800">Raised: ৳{raisedAmount}</span>
            <span className="text-purple-600">Goal: ৳{fundraiseGoal}</span>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min((raisedAmount / fundraiseGoal) * 100, 100)}%` }}></div>
          </div>
          <div className="text-[12px] text-purple-600 mt-2 flex justify-between items-center">
            <span>{donorsCount} people donated</span>
            <span className="font-medium">{Math.min(100, Math.round((raisedAmount / fundraiseGoal) * 100))}% funded</span>
          </div>
          <button 
            onClick={() => setIsDonationModalOpen(true)}
            className="w-full mt-4 bg-purple-600 hover:bg-purple-700 transition-colors text-white font-bold py-2 rounded-full"
            disabled={user?.uid === authorId}
          >
            {user?.uid === authorId ? 'Your Fundraiser' : 'Donate Now'}
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center text-[var(--sc-text-secondary)] text-sm font-medium pt-2 border-t border-gray-50">
        <div className="flex gap-6">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
            <span>{likesCount} Likes</span>
          </button>
          <button 
            onClick={() => setIsCommentSheetOpen(true)}
            className="flex items-center gap-2 hover:text-gray-700 transition-colors"
          >
            <MessageCircle size={18} />
            <span>{commentsCount} Comments</span>
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 hover:text-gray-700 transition-colors"
          >
            <Share2 size={18} />
            <span>Share</span>
          </button>
        </div>
        <button 
          onClick={handleBookmark}
          className={`transition-colors ${isBookmarked ? 'text-[var(--sc-brand-500)]' : 'hover:text-[var(--sc-brand-500)]'}`}
        >
          <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDonationModalOpen(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col border border-[var(--sc-border)] shadow-xl animate-in fade-in zoom-in duration-200 p-6">
            <h2 className="text-xl font-bold mb-1 text-[var(--sc-text-primary)]">Donate to Fundraiser</h2>
            <p className="text-sm text-gray-500 mb-4">Supporting {authorName}'s cause.</p>
            
            <div className="p-3 bg-purple-50 rounded-xl mb-4 border border-purple-100">
              <label className="text-[12px] font-bold text-purple-800 uppercase tracking-wider mb-1 block">Donation Amount</label>
              <div className="flex items-center text-xl font-bold text-purple-900">
                <span className="mr-1">৳</span>
                <input 
                  type="number"
                  placeholder="500"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="bg-transparent outline-none w-full placeholder-purple-300"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setIsDonationModalOpen(false)}
                className="flex-1 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                disabled={isDonating}
              >
                Cancel
              </button>
              <button 
                onClick={handleDonate}
                className="flex-1 py-3 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors disabled:opacity-50"
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
