import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { X, Heart, MessageCircle, Sparkles, Loader2 } from "lucide-react";
import HeaderLogo from "../common/HeaderLogo";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actionName?: string; // e.g. "like this post", "donate to this rescue", "leave a comment"
}

export default function AuthPromptModal({
  isOpen,
  onClose,
  title = "Join the StrayCare Community",
  description,
  actionName = "interact with this post",
}: AuthPromptModalProps) {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const currentPath = location.pathname + location.search;

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignIn = () => {
    onClose();
    navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <HeaderLogo className="w-[180px] h-[45px] mb-3" />
          
          <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-[var(--sc-brand-50)] text-[var(--sc-brand-700)] rounded-full text-xs font-semibold mb-3">
            <Sparkles size={13} className="text-[var(--sc-brand-500)]" />
            <span>Animal Welfare Network</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-2">
            {title}
          </h3>

          <p className="text-sm text-gray-600 leading-relaxed max-w-sm mb-6">
            {description || (
              <>
                Sign in to <span className="font-semibold text-gray-800">{actionName}</span>, report sightings, support fundraisers, and connect with local rescuers.
              </>
            )}
          </p>

          {/* Social Proof Badges */}
          <div className="grid grid-cols-2 gap-2.5 w-full mb-6">
            <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-left">
              <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                <Heart size={16} />
              </div>
              <div className="text-xs">
                <p className="font-bold text-gray-800">Support Strays</p>
                <p className="text-gray-500">Donate & volunteer</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-left">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <MessageCircle size={16} />
              </div>
              <div className="text-xs">
                <p className="font-bold text-gray-800">Direct Chat</p>
                <p className="text-gray-500">Help in real-time</p>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 w-full mb-4">
              {error}
            </p>
          )}

          {/* Action buttons */}
          <div className="w-full space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm rounded-2xl border border-gray-200 shadow-sm hover:shadow transition-all disabled:opacity-60 cursor-pointer"
            >
              {isGoogleLoading ? (
                <Loader2 size={18} className="animate-spin text-gray-600" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <button
              onClick={handleEmailSignIn}
              className="w-full py-3 px-4 bg-[var(--sc-brand-500)] hover:bg-[var(--sc-brand-600)] text-white font-bold text-sm rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer"
            >
              Continue with Email or Create Account
            </button>

            <button
              onClick={onClose}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors pt-1"
            >
              Maybe later, just browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
