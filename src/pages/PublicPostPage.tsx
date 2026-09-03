import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { fetchPostById } from "../services/api";
import PostCard from "../components/home/feed/PostCard";
import HeaderLogo from "../components/common/HeaderLogo";
import BrandedLoader from "../components/common/BrandedLoader";
import {
  ArrowLeft,
  Heart,
  ShieldCheck,
  Sparkles,
  LogIn,
  UserPlus,
  AlertCircle,
  Home,
} from "lucide-react";

export default function PublicPostPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    fetchPostById(id)
      .then((data) => {
        if (!data || data.error) {
          setError("This post could not be found or may have been deleted.");
        } else {
          setPost(data);
          document.title = data.content
            ? `${data.content.substring(0, 40)}... — StrayCare`
            : "Animal Welfare Post — StrayCare";
        }
      })
      .catch((err) => {
        console.error("Failed to fetch post:", err);
        setError("This post could not be loaded. Please check the link and try again.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const currentRedirect = encodeURIComponent(`/post/${id}`);

  return (
    <div className="min-h-screen bg-[var(--sc-bg,#f8fafc)] flex flex-col selection:bg-[var(--sc-brand-200)]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <HeaderLogo className="w-[140px] sm:w-[170px] h-[38px]" />
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {authLoading ? null : user ? (
              <Link
                to="/"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--sc-brand-50)] hover:bg-[var(--sc-brand-100)] text-[var(--sc-brand-700)] text-xs sm:text-sm font-bold transition-all"
              >
                <Home size={15} />
                <span className="hidden sm:inline">Go to Feed</span>
                <span className="sm:hidden">Feed</span>
              </Link>
            ) : (
              <>
                <Link
                  to={`/auth?redirect=${currentRedirect}`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-gray-700 hover:text-gray-950 hover:bg-gray-100 text-xs sm:text-sm font-bold transition-all"
                >
                  <LogIn size={15} />
                  <span>Log In</span>
                </Link>
                <Link
                  to={`/auth?redirect=${currentRedirect}`}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--sc-brand-500)] hover:bg-[var(--sc-brand-600)] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all"
                >
                  <UserPlus size={15} />
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-3.5 sm:px-4 py-6 sm:py-8">
        {/* Back Link */}
        <div className="mb-4">
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <BrandedLoader />
            <p className="text-xs font-semibold text-gray-500 mt-4 animate-pulse">
              Loading rescue post details...
            </p>
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && error && (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-200 shadow-sm my-8">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
              <AlertCircle size={28} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Post Unavailable
            </h2>
            <p className="text-sm text-gray-600 max-w-sm mx-auto mb-6">
              {error}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--sc-brand-500)] hover:bg-[var(--sc-brand-600)] text-white font-bold text-sm rounded-full transition-all shadow-xs"
            >
              <Home size={16} />
              <span>Explore Community Feed</span>
            </Link>
          </div>
        )}

        {/* Post View */}
        {!loading && post && (
          <div className="space-y-4">
            {/* Logged-Out Guest Banner */}
            {!user && (
              <div className="relative overflow-hidden bg-gradient-to-r from-[var(--sc-brand-50)] via-white to-emerald-50/50 border border-[var(--sc-brand-200)]/80 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--sc-brand-500)] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Join the StrayCare Animal Welfare Community
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                        Sign in to like, comment, volunteer, donate to fundraisers, or report strays in need.
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/auth?redirect=${currentRedirect}`}
                    className="w-full sm:w-auto shrink-0 px-4 py-2 bg-[var(--sc-brand-500)] hover:bg-[var(--sc-brand-600)] text-white text-xs font-bold rounded-full shadow-xs hover:shadow text-center transition-all"
                  >
                    Create Free Account
                  </Link>
                </div>
              </div>
            )}

            {/* Post Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <PostCard
                id={post.id}
                authorId={post.authorId}
                authorName={post.author?.displayName || "User"}
                authorAvatar={post.author?.photoUrl || ""}
                authorHandle={post.author?.handle}
                timeAgo={
                  post.createdAt
                    ? new Date(post.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recently"
                }
                category={post.category}
                content={post.content}
                imageUrl={post.imageUrl || undefined}
                media={post.media}
                location={post.location || undefined}
                likesCount={post.likesCount || 0}
                commentsCount={post.commentsCount || 0}
                fundraiseGoal={post.fundraiseGoal}
                raisedAmount={post.raisedAmount || 0}
                donorsCount={post.donorsCount || 0}
                isVerified={post.author?.verifiedStatus || false}
                onPostDeleted={() => navigate("/")}
              />
            </div>

            {/* Public Community Mission Card */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>Verified Public Animal Welfare Post</span>
              </div>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                StrayCare connects rescuers, donors, and veterinary caretakers across Bangladesh to provide medical care, shelters, and adoptions for street animals.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Public Footer */}
      <footer className="py-6 border-t border-gray-200/60 text-center text-xs text-gray-400 bg-white">
        <p>© {new Date().getFullYear()} StrayCare. Built for animal welfare.</p>
      </footer>
    </div>
  );
}
