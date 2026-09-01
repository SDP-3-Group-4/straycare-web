import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";

interface PostActionsProps {
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  isBookmarked: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
}

export default function PostActions({
  isLiked,
  likesCount,
  commentsCount,
  isBookmarked,
  onLike,
  onComment,
  onShare,
  onBookmark,
}: PostActionsProps) {
  return (
    <div className="flex items-center justify-between text-[var(--sc-text-secondary)] text-xs pt-2.5 mt-1 border-t border-gray-100 px-1">
      {/* Like Button */}
      <button
        onClick={onLike}
        className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full transition-colors whitespace-nowrap ${
          isLiked
            ? "text-red-500 font-bold bg-red-50"
            : "hover:text-red-500 hover:bg-gray-50"
        }`}
        title="Like"
      >
        <Heart size={17} fill={isLiked ? "currentColor" : "none"} />
        <span className="font-semibold text-[13px]">{likesCount}</span>
      </button>

      {/* Comment Button */}
      <button
        onClick={onComment}
        className="flex items-center gap-1.5 py-1.5 px-3 rounded-full hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap"
        title="Comments"
      >
        <MessageCircle size={17} />
        <span className="font-semibold text-[13px]">{commentsCount}</span>
      </button>

      {/* Share Button */}
      <button
        onClick={onShare}
        className="flex items-center gap-1.5 py-1.5 px-3 rounded-full hover:text-gray-900 hover:bg-gray-50 transition-colors"
        title="Share"
      >
        <Share2 size={17} />
      </button>

      {/* Bookmark Button */}
      <button
        onClick={onBookmark}
        className={`py-1.5 px-3 rounded-full transition-colors ${
          isBookmarked
            ? "text-[var(--sc-brand-600)] bg-[var(--sc-brand-50)]"
            : "hover:text-[var(--sc-brand-600)] hover:bg-gray-50"
        }`}
        title="Bookmark"
      >
        <Bookmark size={17} fill={isBookmarked ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
