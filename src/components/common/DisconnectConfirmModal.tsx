import { createPortal } from 'react-dom';
import { UserMinus, AlertTriangle, X } from 'lucide-react';

interface DisconnectConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
  isProcessing?: boolean;
}

export default function DisconnectConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isProcessing = false,
}: DisconnectConfirmModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={() => !isProcessing && onClose()}
      />

      {/* Modal / Bottom Sheet */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-[var(--sc-card-bg,white)] rounded-t-[28px] sm:rounded-3xl border border-[var(--sc-border)] shadow-2xl p-5 sm:p-6 flex flex-col z-10 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 overflow-hidden">
        
        {/* Top Grab Bar for Mobile */}
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-3 sm:hidden shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3.5 shadow-sm">
          <UserMinus size={24} strokeWidth={2.2} />
        </div>

        {/* Title & Description */}
        <div className="text-center px-2">
          <h3 className="font-extrabold text-[17px] sm:text-[18px] text-[var(--sc-text-primary)] leading-snug notranslate" translate="no">
            {userName ? `Disconnect from ${userName}?` : 'Disconnect Connection?'}
          </h3>
          <p className="text-xs sm:text-[13px] text-[var(--sc-text-secondary)] mt-1.5 leading-relaxed max-w-xs mx-auto">
            You will no longer be connected. Direct messaging is reserved for active connections, so new messages will be paused until you reconnect.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2.5 mt-5 pt-1">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-[var(--sc-border)] text-[var(--sc-text-primary)] hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs sm:text-sm transition-all active:scale-[0.98] shadow-2xs"
          >
            Keep Connected
          </button>
          
          <button
            type="button"
            disabled={isProcessing}
            onClick={onConfirm}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm transition-all active:scale-[0.98] shadow-md shadow-red-600/20 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <span>Disconnecting...</span>
            ) : (
              <>
                <UserMinus size={15} />
                <span>Disconnect</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
