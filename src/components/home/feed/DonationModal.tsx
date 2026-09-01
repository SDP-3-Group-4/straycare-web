import { createPortal } from "react-dom";

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorName: string;
  donationAmount: string;
  setDonationAmount: (amount: string) => void;
  onDonate: () => void;
  isDonating: boolean;
}

export default function DonationModal({
  isOpen,
  onClose,
  authorName,
  donationAmount,
  setDonationAmount,
  onDonate,
  isDonating,
}: DonationModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col border border-[var(--sc-border)] shadow-xl animate-in fade-in zoom-in duration-200 p-5 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-1 text-[var(--sc-text-primary)]">
          Donate to Fundraiser
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mb-4">
          Supporting {authorName}'s cause.
        </p>

        <div className="p-3 bg-[var(--sc-brand-50)] rounded-xl mb-4 border border-[var(--sc-brand-100)]">
          <label className="text-[11px] sm:text-[12px] font-bold text-[var(--sc-brand-800)] mb-1 block">
            Donation Amount (৳)
          </label>
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
            onClick={onClose}
            className="flex-1 py-2.5 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm"
            disabled={isDonating}
          >
            Cancel
          </button>
          <button
            onClick={onDonate}
            className="flex-1 py-2.5 font-bold text-white bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] rounded-xl transition-colors disabled:opacity-50 text-sm"
            disabled={isDonating || !donationAmount}
          >
            {isDonating ? "Processing..." : "Donate"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
