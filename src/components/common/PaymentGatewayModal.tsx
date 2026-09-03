import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ShieldCheck, Loader2, RefreshCw } from "lucide-react";

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  gatewayUrl: string | null;
  title?: string;
  amount?: number;
  onSuccess?: () => void;
}

export default function PaymentGatewayModal({
  isOpen,
  onClose,
  gatewayUrl,
  title = "SSLCommerz Payment Gateway",
  amount,
  onSuccess,
}: PaymentGatewayModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Reset loading state when new gateway URL loads
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
    }
  }, [isOpen, gatewayUrl]);

  // Listen for payment completion from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "PAYMENT_COMPLETE") {
        if (e.data.status === "success") {
          onSuccess?.();
        }
      } else if (e.data?.type === "CLOSE_PAYMENT_MODAL") {
        onClose();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess, onClose]);

  if (!isOpen || !gatewayUrl) return null;

  const handleCloseAttempt = () => {
    if (
      window.confirm(
        "Are you sure you want to exit the payment gateway? Any incomplete transaction will be cancelled.",
      )
    ) {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCloseAttempt}
      />

      {/* Modal Container Overlay */}
      <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-[var(--sc-border)] shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50/90 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-gray-900 truncate">
                  {title}
                </h3>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-extrabold rounded-full shrink-0">
                  SANDBOX
                </span>
              </div>
              {amount !== undefined && (
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Amount:{" "}
                  <span className="font-bold text-gray-900">
                    ৳{amount.toLocaleString()} BDT
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsLoading(true)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/60 transition-colors"
              title="Reload gateway"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={handleCloseAttempt}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200/60 transition-colors"
              title="Close payment frame"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Gateway Frame Body */}
        <div className="relative flex-1 w-full bg-gray-50 overflow-hidden flex flex-col min-h-[540px] sm:min-h-[620px]">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xs gap-3">
              <Loader2 className="animate-spin text-[var(--sc-brand-600)]" size={32} />
              <p className="text-xs sm:text-sm font-semibold text-gray-600">
                Opening SSLCommerz Sandbox Gateway...
              </p>
            </div>
          )}

          <iframe
            src={gatewayUrl}
            title="SSLCommerz Payment Gateway"
            allow="payment"
            onLoad={() => setIsLoading(false)}
            className="w-full flex-1 h-full min-h-[540px] sm:min-h-[620px] border-0 bg-white"
          />
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center text-[11px] text-gray-400 shrink-0">
          Secured with SSLCommerz 128-bit Sandbox Gateway • Do not share confidential PINs
        </div>
      </div>
    </div>,
    document.body,
  );
}
