import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CreditCard,
  Banknote,
  Building,
  Smartphone,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { createOrder, initiatePayment } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { useCart } from "../../../contexts/CartContext";
import PaymentGatewayModal from "../../common/PaymentGatewayModal";

interface MarketplaceCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
}

export default function MarketplaceCheckoutModal({
  isOpen,
  onClose,
  total,
}: MarketplaceCheckoutModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [isProcessing, setIsProcessing] = useState(false);
  const [gatewayUrl, setGatewayUrl] = useState<string | null>(null);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [orderAmount, setOrderAmount] = useState(total);

  const { user } = useAuth();
  const {
    clearCart,
    subtotal,
    deliveryZone,
    setDeliveryZone,
    deliveryFee,
    platformFee,
  } = useCart();

  if (!isOpen) return null;

  const paymentMethods = [
    {
      id: "online",
      name: "Online Payment (bKash / Nagad / Cards / Bank)",
      subtitle: "Instant & secured checkout via SSLCommerz Sandbox",
      icon: <CreditCard size={20} className="text-[var(--sc-brand-600)]" />,
    },
    {
      id: "cod",
      name: "Cash on Delivery (COD)",
      subtitle: "Pay in cash when your order arrives at your address",
      icon: <Banknote size={20} className="text-emerald-600" />,
    },
  ];

  const handlePlaceOrder = async () => {
    if (!user) return;
    const finalAmount = orderAmount > 0 ? orderAmount : total;
    if (finalAmount <= 0) {
      alert("Order total must be greater than 0");
      return;
    }

    setIsProcessing(true);
    try {
      const order = await createOrder(finalAmount);

      if (paymentMethod === "cod") {
        clearCart();
        setStep(3);
      } else {
        // Launch SSLCommerz Sandbox Payment Gateway directly
        const res = await initiatePayment({
          amount: finalAmount,
          paymentType: "ORDER",
          orderId: order?.id,
        });
        if (res?.gatewayUrl) {
          window.location.href = res.gatewayUrl;
          return;
        }
        clearCart();
        setStep(3);
      }
    } catch (error: any) {
      console.error("Failed to place order", error);
      alert(error?.message || "Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          if (step !== 3 && !isProcessing) onClose();
        }}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-[var(--sc-border)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--sc-border)] bg-gray-50/50">
          <h2 className="text-xl font-bold text-[var(--sc-text-primary)]">
            {step === 1
              ? "Shipping Address"
              : step === 2
                ? "Payment Method"
                : "Order Confirmed"}
          </h2>
          {step !== 3 && !isProcessing && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors border border-[var(--sc-border)]"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="bg-[var(--sc-brand-50)] text-[var(--sc-brand-700)] p-4 rounded-xl flex items-start gap-3 border border-[var(--sc-brand-100)] mb-2">
                <Truck className="mt-0.5 shrink-0" size={18} />
                <p className="text-[14px]">
                  Please provide your delivery address. For services, this will
                  be the location where the service is provided.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[var(--sc-text-secondary)] ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue={user?.displayName || "John Doe"}
                  className="w-full bg-white border border-[var(--sc-border)] px-4 py-3 rounded-xl focus:outline-none focus:border-[var(--sc-brand-500)] text-[15px]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[var(--sc-text-secondary)] ml-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  defaultValue="+880 1712-345678"
                  className="w-full bg-white border border-[var(--sc-border)] px-4 py-3 rounded-xl focus:outline-none focus:border-[var(--sc-brand-500)] text-[15px]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[var(--sc-text-secondary)] ml-1">
                  Street Address
                </label>
                <textarea
                  rows={3}
                  defaultValue="House 12, Road 4, Banani"
                  className="w-full bg-white border border-[var(--sc-border)] px-4 py-3 rounded-xl focus:outline-none focus:border-[var(--sc-brand-500)] text-[15px] resize-none"
                />
              </div>

              {/* Delivery Zone Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[var(--sc-text-secondary)] ml-1">
                  Delivery Destination
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryZone("inside_dhaka")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                      deliveryZone === "inside_dhaka"
                        ? "border-[var(--sc-brand-500)] bg-[var(--sc-brand-50)] text-[var(--sc-brand-700)] font-bold shadow-xs"
                        : "border-[var(--sc-border)] bg-white hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="text-[13px]">Inside Dhaka</span>
                    <span className="text-[12px] font-bold text-[var(--sc-brand-600)]">
                      ৳80 BDT
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryZone("outside_dhaka")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                      deliveryZone === "outside_dhaka"
                        ? "border-[var(--sc-brand-500)] bg-[var(--sc-brand-50)] text-[var(--sc-brand-700)] font-bold shadow-xs"
                        : "border-[var(--sc-border)] bg-white hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="text-[13px]">Outside Dhaka</span>
                    <span className="text-[12px] font-bold text-[var(--sc-brand-600)]">
                      ৳120 BDT
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              {/* Order Cost Breakdown */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-[var(--sc-border)] flex flex-col gap-1.5 text-[13px]">
                <div className="flex justify-between text-gray-500">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    ৳{subtotal.toLocaleString()} BDT
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>
                    Delivery ({deliveryZone === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka"})
                  </span>
                  <span className="font-semibold text-gray-900">
                    ৳{deliveryFee.toLocaleString()} BDT
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Platform Fee</span>
                  <span className="font-semibold text-gray-900">
                    ৳{platformFee.toLocaleString()} BDT
                  </span>
                </div>
                <div className="h-px bg-gray-200 my-1"></div>
                <div className="flex justify-between items-center text-[15px]">
                  <span className="font-bold text-[var(--sc-text-primary)]">
                    Total to Pay
                  </span>
                  <span
                    className="font-extrabold text-[20px] text-[var(--sc-brand-600)] notranslate"
                    translate="no"
                  >
                    ৳{total.toLocaleString()} BDT
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      paymentMethod === method.id
                        ? "border-[var(--sc-brand-500)] bg-[var(--sc-brand-50)] text-[var(--sc-brand-700)]"
                        : "border-[var(--sc-border)] bg-white hover:bg-gray-50 text-[var(--sc-text-primary)]"
                    }`}
                  >
                    <div
                      className={
                        paymentMethod === method.id
                          ? "text-[var(--sc-brand-600)]"
                          : "text-gray-400"
                      }
                    >
                      {method.icon}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-[14px] text-gray-900">{method.name}</span>
                      <span className="text-[12px] text-gray-500 font-normal">{method.subtitle}</span>
                    </div>
                    <div className="ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0">
                      {paymentMethod === method.id ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--sc-brand-500)]" />
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 text-[12px] text-gray-500 mt-4">
                <ShieldCheck size={14} className="text-green-500" />
                Secure, encrypted payment processing
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h3 className="font-bold text-2xl text-[var(--sc-text-primary)]">
                Order Successful!
              </h3>
              <p className="text-[15px] text-gray-500 max-w-xs leading-relaxed">
                Your order has been placed. You will receive an email
                confirmation shortly.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--sc-border)] bg-gray-50/50 flex gap-3">
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white text-[15px] font-bold rounded-xl transition-all border border-[var(--sc-brand-700)]"
            >
              Continue to Payment
            </button>
          )}

          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                disabled={isProcessing}
                className="w-1/3 py-3.5 bg-white border border-[var(--sc-border)] text-[var(--sc-text-primary)] hover:bg-gray-50 text-[15px] font-bold rounded-xl transition-all disabled:opacity-50"
              >
                Back
              </button>
              <button
                disabled={!paymentMethod || isProcessing}
                onClick={handlePlaceOrder}
                className={`w-2/3 py-3.5 text-[15px] font-bold rounded-xl transition-all flex justify-center items-center gap-2 ${
                  paymentMethod && !isProcessing
                    ? "bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white border border-[var(--sc-brand-700)]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
                }`}
              >
                {isProcessing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  "Place Order"
                )}
              </button>
            </>
          )}

          {step === 3 && (
            <button
              onClick={() => {
                onClose();
                setStep(1); // reset for demo
              }}
              className="w-full py-3.5 bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white text-[15px] font-bold rounded-xl transition-all border border-[var(--sc-brand-700)]"
            >
              Back to Marketplace
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
