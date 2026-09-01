import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { MarketItem } from "./MarketItemCard";
import { useCart } from "../../../contexts/CartContext";

interface MarketplaceProductModalProps {
  item: MarketItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MarketplaceProductModal({
  item,
  isOpen,
  onClose,
}: MarketplaceProductModalProps) {
  const { addToCart } = useCart();
  if (!isOpen || !item) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-[var(--sc-border)]">
        {/* Header/Image */}
        <div className="relative h-64 sm:h-80 w-full bg-gray-100 shrink-0">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full backdrop-blur-sm transition-colors border border-[var(--sc-border)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-[var(--sc-brand-50)] text-[var(--sc-brand-700)] text-[11px] font-bold px-3 py-1 rounded-full ">
                  {item.category}
                </span>
                {item.isService && (
                  <span className="bg-[var(--sc-brand-500)] text-white text-[11px] font-bold px-3 py-1 rounded-full ">
                    Service
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--sc-text-primary)] leading-tight mb-2">
                {item.title}
              </h2>

              <p className="text-[14px] text-gray-500 mb-6 font-medium">
                Sold by{" "}
                <span className="text-[var(--sc-brand-600)] cursor-pointer">
                  {item.seller}
                </span>
              </p>

              <h3 className="font-bold text-[16px] text-[var(--sc-text-primary)] mb-2">
                Description
              </h3>
              <p className="text-[15px] text-gray-500 leading-relaxed mb-6">
                {item.description}
              </p>

              <h3 className="font-bold text-[16px] text-[var(--sc-text-primary)] mb-3">
                Features
              </h3>
              <ul className="flex flex-col gap-2">
                {item.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-[14px] text-gray-600 bg-gray-50 px-4 py-2.5 rounded-xl border border-[var(--sc-border)]"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--sc-brand-500)] shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right column: Action */}
            <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
              <div className="bg-gray-50 rounded-2xl p-5 border border-[var(--sc-border)]">
                <div className="text-[12px] text-gray-400 font-bold mb-1">
                  Price
                </div>
                <div
                  className="flex items-baseline gap-1 mb-4 notranslate"
                  translate="no"
                >
                  <span className="text-xl font-bold text-[var(--sc-brand-700)]">
                    {item.currency || "৳"}
                  </span>
                  <span className="text-3xl font-extrabold text-[var(--sc-brand-700)]">
                    {item.price.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-gray-400 ml-1">
                    BDT
                  </span>
                </div>

                {item.isService ? (
                  <div className="flex flex-col gap-3 mb-6 border-t border-[var(--sc-border)] pt-4">
                    <label className="text-[13px] font-bold text-[var(--sc-text-secondary)]">
                      Select Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-white border border-[var(--sc-border)] px-3 py-2 rounded-xl focus:outline-none focus:border-[var(--sc-brand-500)] text-[14px]"
                    />
                    <label className="text-[13px] font-bold text-[var(--sc-text-secondary)]">
                      Select Time
                    </label>
                    <input
                      type="time"
                      className="w-full bg-white border border-[var(--sc-border)] px-3 py-2 rounded-xl focus:outline-none focus:border-[var(--sc-brand-500)] text-[14px]"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mb-6 border-t border-[var(--sc-border)] pt-4">
                    <div className="flex justify-between text-[13px] text-gray-500">
                      <span>Delivery:</span>
                      <span className="font-bold text-[var(--sc-text-primary)]">
                        2-3 Days
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px] text-gray-500">
                      <span>Shipping:</span>
                      <span className="font-bold text-[var(--sc-text-primary)]">
                        ৳60
                      </span>
                    </div>
                  </div>
                )}

                <button
                  disabled={!item.inStock}
                  onClick={() => {
                    addToCart(item);
                    onClose();
                  }}
                  className={`w-full py-3.5 text-[15px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    item.inStock
                      ? "bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white border border-[var(--sc-brand-700)]"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  }`}
                >
                  {item.inStock
                    ? item.isService
                      ? "Confirm Booking"
                      : "Add to Cart"
                    : "Out of Stock"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
