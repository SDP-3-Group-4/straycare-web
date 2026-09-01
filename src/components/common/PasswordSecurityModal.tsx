import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Key,
  Mail,
  ShieldCheck,
  X,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";

interface PasswordSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PasswordSecurityModal({
  isOpen,
  onClose,
}: PasswordSecurityModalProps) {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    setSending(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setSent(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send password reset email.");
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col border border-[var(--sc-border)] shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--sc-border)] bg-gray-50/70">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-50 text-[var(--sc-brand-600)]">
              <Key size={18} />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--sc-text-primary)]">
              Password & Security
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors border border-[var(--sc-border)]"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl border border-[var(--sc-border)]">
            <Mail size={20} className="text-gray-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-xs text-gray-500 block">
                Registered Email
              </span>
              <span className="font-bold text-sm text-[var(--sc-text-primary)] truncate block">
                {user?.email}
              </span>
            </div>
          </div>

          <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 text-xs text-gray-600 leading-relaxed">
            <p className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
              <ShieldCheck size={15} /> Secure Password Management
            </p>
            For enhanced security, StrayCare dispatches a cryptographically
            signed password reset link directly to your verified inbox.
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2 border border-red-200">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {sent ? (
            <div className="p-4 bg-green-50 text-green-800 text-xs rounded-2xl flex flex-col items-center text-center gap-2 border border-green-200">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <Check size={20} />
              </div>
              <span className="font-bold text-sm">Reset Email Dispatched</span>
              <span>
                We sent a password reset link to <strong>{user?.email}</strong>.
                Please check your inbox or spam folder.
              </span>
            </div>
          ) : (
            <button
              onClick={handleSendResetEmail}
              disabled={sending}
              className="w-full py-3 font-bold text-white bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending Link...
                </>
              ) : (
                <>
                  <Mail size={16} />
                  Send Password Reset Link
                </>
              )}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
