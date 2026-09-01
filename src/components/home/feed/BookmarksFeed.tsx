import { useState, useEffect } from "react";
import { Bookmark, Filter } from "lucide-react";
import PostCard from "./PostCard";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchBookmarks } from "../../../services/api";

const FILTERS = ["All", "Rescues", "Fundraises", "Adoptions"];

export default function BookmarksFeed() {
  const [activeFilter, setActiveFilter] = useState("All");
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadBookmarks();
    }
  }, [user]);

  const loadBookmarks = async () => {
    if (!user) return;
    try {
      const data = await fetchBookmarks(user.uid);
      setBookmarks(data);
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err);
    }
  };

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Rescues" && bookmark.post?.category === "rescue")
      return true;
    if (
      activeFilter === "Fundraises" &&
      bookmark.post?.category === "fundraise"
    )
      return true;
    if (activeFilter === "Adoptions" && bookmark.post?.category === "adoption")
      return true;
    return false;
  });

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-24 pt-3 sm:pt-6 lg:pt-[74px] px-1 sm:px-0">
      {/* Header & Filter Bar */}
      <div className="sticky-glass px-3.5 py-3 sm:px-5 rounded-2xl shadow-xs mb-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] p-1.5 rounded-xl">
            <Bookmark size={18} className="fill-current" />
          </div>
          <h2 className="font-bold text-[18px] sm:text-[20px] text-[var(--sc-text-primary)] tracking-tight">
            Saved Posts
          </h2>
        </div>

        {/* Expressive Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
          <div className="flex items-center gap-1.5 text-gray-400 mr-1 shrink-0">
            <Filter size={14} />
          </div>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap px-3.5 py-1 rounded-full text-[12px] sm:text-[13px] font-bold transition-all duration-200 border ${
                  isActive
                    ? "bg-[var(--sc-brand-600)] text-white border-[var(--sc-brand-600)] shadow-xs"
                    : "bg-white text-[var(--sc-text-secondary)] border-[var(--sc-border)] hover:bg-gray-50 hover:text-[var(--sc-text-primary)]"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts List */}
      <div className="flex flex-col gap-3">
        {filteredBookmarks.map((bookmark) => {
          const post = bookmark.post;
          if (!post) return null;

          const date = new Date(post.createdAt);
          const timeAgo = !isNaN(date.getTime())
            ? date.toLocaleDateString()
            : "Just now";

          return (
            <PostCard
              key={post.id}
              id={post.id}
              authorId={post.authorId}
              authorName={post.author?.displayName || "User"}
              authorAvatar={post.author?.photoUrl || ""}
              authorHandle={post.author?.handle}
              timeAgo={timeAgo}
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
              isVerified={post.author?.verifiedStatus}
            />
          );
        })}

        {filteredBookmarks.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-[var(--sc-border)] text-gray-500 p-6">
            <Bookmark size={28} className="mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-sm">No saved posts found</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Click the bookmark icon on posts to keep track of important cases.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
