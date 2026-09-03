import { useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, Home, HeartHandshake } from "lucide-react";
import HeaderLogo from "../components/common/HeaderLogo";
import { useCart } from "../contexts/CartContext";

export default function PaymentStatusPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const params = new URLSearchParams(location.search);

  const status = params.get("status") || "unknown";
  const tranId = params.get("tran_id") || "";
  const amount = params.get("amount") || "";
  const type = params.get("type") || "donation";
  const postId = params.get("postId");
  const orderId = params.get("orderId");

  const isSuccess = status === "success";
  const isFailed = status === "failed";
  const isCancelled = status === "cancelled";

  useEffect(() => {
    if (isSuccess && type === "order") {
      clearCart();
    }
  }, [isSuccess, type]);

  const isOpenedTab = Boolean(window.opener && !window.opener.closed);

  useEffect(() => {
    const payload = {
      type: "PAYMENT_COMPLETE",
      status,
      tranId,
      amount,
      type,
      postId,
      orderId,
    };

    // 1. BroadcastChannel across all StrayCare tabs
    if (typeof BroadcastChannel !== "undefined") {
      try {
        const bc = new BroadcastChannel("straycare_payment");
        bc.postMessage(payload);
      } catch (e) {}
    }

    // 2. LocalStorage event fallback
    try {
      localStorage.setItem(
        "straycare_payment_event",
        JSON.stringify({ ...payload, timestamp: Date.now() }),
      );
    } catch (e) {}

    // 3. Opener postMessage
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(payload, "*");
      } catch (e) {}
    }

    // 4. If framed
    if (window.self !== window.top) {
      try {
        window.parent.postMessage(payload, "*");
      } catch (e) {}
    }

    // Attempt automatic window close if opened in new tab
    if (isOpenedTab) {
      const timer = setTimeout(() => {
        try {
          window.close();
        } catch (e) {}
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status, tranId, amount, type, postId, orderId, isOpenedTab]);

  const handleCloseFrame = () => {
    if (isOpenedTab) {
      try {
        window.close();
      } catch (e) {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  };

  return (
    <div
      className={`min-h-screen bg-[var(--sc-bg,#f8fafc)] flex flex-col justify-between ${
        isInIframe ? "p-2 bg-transparent" : ""
      }`}
    >
      {/* Top Header - Hidden when inside iframe modal */}
      {!isInIframe && (
        <header className="w-full bg-white border-b border-gray-200/80 shadow-xs">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <HeaderLogo className="w-[150px] h-[36px]" />
            </Link>
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3.5 py-1.5 rounded-full transition-all"
            >
              <Home size={14} />
              <span>Feed</span>
            </Link>
          </div>
        </header>
      )}

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xl text-center animate-scaleUp">
          {isOpenedTab && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-2 text-left">
              <span className="text-xs text-purple-900 font-semibold">
                Payment verified! Your original StrayCare tab has been updated.
              </span>
              <button
                onClick={() => window.close()}
                className="px-3 py-1.5 bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer"
              >
                Close Tab
              </button>
            </div>
          )}

          {/* Success State */}
          {isSuccess && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100/60 text-emerald-700 rounded-full text-xs font-bold mb-2">
                  <HeartHandshake size={14} />
                  <span>Verified SSLCommerz Payment</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                  {type === "donation" ? "Donation Successful!" : "Order Placed Successfully!"}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {type === "donation"
                    ? "Thank you for supporting this stray animal fundraiser."
                    : "Your marketplace order has been confirmed."}
                </p>
              </div>

              {/* Transaction Box */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left space-y-2 text-xs">
                {amount && (
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-500 font-medium">Amount Paid:</span>
                    <span className="font-bold text-gray-900 text-sm">৳{parseFloat(amount).toLocaleString()} BDT</span>
                  </div>
                )}
                {tranId && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Transaction ID:</span>
                    <span className="font-mono text-[11px] font-semibold text-gray-700 break-all">{tranId}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Gateway:</span>
                  <span className="font-semibold text-gray-700">SSLCommerz Sandbox</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                {isOpenedTab ? (
                  <button
                    onClick={() => window.close()}
                    className="w-full py-3.5 px-4 flex items-center justify-center gap-2 bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white font-bold text-sm rounded-2xl shadow-sm transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>Close Tab & Return to StrayCare</span>
                  </button>
                ) : (
                  <>
                    {postId && (
                      <Link
                        to={`/post/${postId}`}
                        className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-[var(--sc-brand-500)] hover:bg-[var(--sc-brand-600)] text-white font-bold text-sm rounded-2xl shadow-sm transition-all"
                      >
                        <span>View Fundraiser Post</span>
                        <ArrowRight size={16} />
                      </Link>
                    )}
                    <Link
                      to="/"
                      className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-2xl transition-all"
                    >
                      <Home size={16} />
                      <span>Return to Home Feed</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Failed State */}
          {isFailed && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-inner">
                <XCircle size={36} />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                  Payment Failed
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  The transaction was declined or could not be completed by SSLCommerz. Your account was not charged.
                </p>
              </div>

              {tranId && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs flex justify-between">
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="font-mono text-gray-700">{tranId}</span>
                </div>
              )}

              <div className="pt-2 space-y-2.5">
                {isInIframe ? (
                  <button
                    onClick={handleCloseFrame}
                    className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-2xl transition-all cursor-pointer"
                  >
                    Close Window & Return
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
                      className="w-full py-3 px-4 bg-[var(--sc-brand-500)] hover:bg-[var(--sc-brand-600)] text-white font-bold text-sm rounded-2xl shadow-sm transition-all cursor-pointer"
                    >
                      Try Again
                    </button>
                    <Link
                      to="/"
                      className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-2xl transition-all"
                    >
                      <Home size={16} />
                      <span>Return to Feed</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Cancelled State */}
          {(isCancelled || (!isSuccess && !isFailed)) && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner">
                <AlertTriangle size={36} />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                  Payment Cancelled
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  You cancelled the transaction before completing checkout.
                </p>
              </div>

              <div className="pt-2">
                {isInIframe ? (
                  <button
                    onClick={handleCloseFrame}
                    className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-2xl transition-all cursor-pointer"
                  >
                    Close Window
                  </button>
                ) : (
                  <Link
                    to="/"
                    className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-[var(--sc-brand-500)] hover:bg-[var(--sc-brand-600)] text-white font-bold text-sm rounded-2xl shadow-sm transition-all"
                  >
                    <Home size={16} />
                    <span>Return to Home Feed</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-gray-200 text-center text-xs text-gray-400 bg-white">
        <p>© {new Date().getFullYear()} StrayCare. Secured with SSLCommerz Sandbox.</p>
      </footer>
    </div>
  );
}
