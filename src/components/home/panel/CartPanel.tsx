import { useState } from "react";
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import MarketplaceCheckoutModal from "../feed/MarketplaceCheckoutModal";
import { useCart } from "../../../contexts/CartContext";

export default function CartPanel() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const {
    items,
    updateQuantity,
    removeFromCart,
    subtotal,
    deliveryZone,
    setDeliveryZone,
    deliveryFee,
    platformFee,
    total,
  } = useCart();

  return (
    <>
      <div className="w-full h-full pb-4 pt-[74px] lg:px-6 flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-[var(--sc-border)] flex flex-col overflow-hidden h-full">
          {/* Header */}
          <div className="p-5 flex justify-between items-center border-b border-[var(--sc-border)]">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[var(--sc-text-primary)] text-xl">
                Your Cart
              </h3>
              <span className="bg-[var(--sc-brand-100)] text-[var(--sc-brand-600)] text-[11px] font-bold px-2 py-0.5 rounded-full">
                {items.reduce((acc, item) => acc + item.quantity, 0)} items
              </span>
            </div>
            <ShoppingBag size={20} className="text-gray-400" />
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 border border-[var(--sc-border)]">
                  <ShoppingBag size={24} className="text-gray-400" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">
                  Your cart is empty
                </h4>
                <p className="text-sm text-gray-500 max-w-[200px]">
                  Add pet supplies or care packages to support animals.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-3 rounded-xl border border-[var(--sc-border)] hover:border-gray-300 transition-colors"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-16 h-16 rounded-lg object-cover bg-gray-50 shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-[var(--sc-text-primary)] truncate">
                          {item.title}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span
                          className="font-bold text-[15px] text-[var(--sc-brand-600)] notranslate"
                          translate="no"
                        >
                          ৳{item.price.toLocaleString()} BDT
                        </span>
                        <div className="flex items-center gap-2 border border-[var(--sc-border)] rounded-lg p-0.5">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="p-1 hover:bg-gray-100 rounded text-gray-500"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="p-1 hover:bg-gray-100 rounded text-gray-500"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary Footer */}
          <div className="p-5 border-t border-[var(--sc-border)] bg-gray-50/50">
            {/* Delivery Location Selector */}
            {items.length > 0 && (
              <div className="mb-3.5 p-2.5 bg-white border border-[var(--sc-border)] rounded-xl shadow-xs">
                <div className="flex items-center justify-between text-[12px] font-bold text-gray-700 mb-1.5">
                  <span>Delivery Destination</span>
                  <span className="text-[11px] font-bold text-[var(--sc-brand-600)]">
                    {deliveryZone === "inside_dhaka"
                      ? "Inside Dhaka (৳80)"
                      : "Outside Dhaka (৳120)"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDeliveryZone("inside_dhaka")}
                    className={`py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      deliveryZone === "inside_dhaka"
                        ? "bg-white text-[var(--sc-brand-700)] shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Inside Dhaka (৳80)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryZone("outside_dhaka")}
                    className={`py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      deliveryZone === "outside_dhaka"
                        ? "bg-white text-[var(--sc-brand-700)] shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Outside Dhaka (৳120)
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 mb-4">
              <div className="flex justify-between text-[13px] text-gray-500">
                <span>Subtotal</span>
                <span
                  className="font-medium text-[var(--sc-text-primary)] notranslate"
                  translate="no"
                >
                  ৳{subtotal.toLocaleString()} BDT
                </span>
              </div>
              <div className="flex justify-between text-[13px] text-gray-500">
                <span>
                  Delivery Fee ({deliveryZone === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka"})
                </span>
                <span
                  className="font-medium text-[var(--sc-text-primary)] notranslate"
                  translate="no"
                >
                  ৳{deliveryFee.toLocaleString()} BDT
                </span>
              </div>
              <div className="flex justify-between text-[13px] text-gray-500">
                <span>Platform Fee</span>
                <span
                  className="font-medium text-[var(--sc-text-primary)] notranslate"
                  translate="no"
                >
                  ৳{platformFee.toLocaleString()} BDT
                </span>
              </div>
              <div className="h-px bg-[var(--sc-border)] my-1"></div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-[15px] text-[var(--sc-text-primary)]">
                  Total
                </span>
                <span
                  className="font-bold text-[18px] text-[var(--sc-brand-600)] notranslate"
                  translate="no"
                >
                  ৳{total.toLocaleString()} BDT
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              disabled={items.length === 0}
              className={`w-full py-3.5 text-[15px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 group ${
                items.length > 0
                  ? "bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Proceed to Checkout
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </div>

      <MarketplaceCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        total={total}
      />
    </>
  );
}
