import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, X, ShieldCheck } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import MarketplaceCheckoutModal from '../home/feed/MarketplaceCheckoutModal';

interface MobileCartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileCartModal({ isOpen, onClose }: MobileCartModalProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { items, updateQuantity, removeFromCart, subtotal, tax, total } = useCart();
  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          onClick={onClose}
        />

        {/* Bottom Sheet / Modal Dialog */}
        <div className="relative w-full max-w-lg bg-[var(--sc-card-bg,white)] rounded-t-[28px] sm:rounded-3xl border border-[var(--sc-border)] shadow-2xl flex flex-col max-h-[88vh] z-10 animate-in slide-in-from-bottom-8 duration-300 overflow-hidden">
          
          {/* Top Grab Bar for Mobile */}
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--sc-border)] bg-[var(--sc-card-bg,white)] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] flex items-center justify-center shrink-0 border border-[var(--sc-brand-100)]">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-[var(--sc-text-primary)] text-lg leading-tight">Your Cart</h3>
                <span className="text-[11px] font-bold text-[var(--sc-text-secondary)]">
                  {totalCount} {totalCount === 1 ? 'item' : 'items'} selected
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex flex-col overflow-y-auto flex-1 p-4 gap-3 overscroll-contain">
            {items.map(item => (
              <div 
                key={item.id} 
                className="flex gap-3.5 p-3 rounded-2xl bg-gray-50/70 dark:bg-white/[0.03] border border-[var(--sc-border)] hover:border-[var(--sc-brand-200)] transition-all"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 border border-[var(--sc-border)]">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <h4 className="font-bold text-[13px] text-[var(--sc-text-primary)] leading-snug line-clamp-1">
                    {item.title}
                  </h4>
                  <div className="font-extrabold text-[14px] text-[var(--sc-brand-600)] mt-0.5 notranslate" translate="no">
                    ৳{item.price.toLocaleString()} <span className="text-[10px] font-medium text-gray-400">BDT</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-200/60 dark:border-gray-800">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-[var(--sc-border)] rounded-full px-2 py-0.5 shadow-2xs">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="text-gray-400 hover:text-[var(--sc-brand-600)] p-0.5 transition-colors active:scale-90"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} strokeWidth={3} />
                      </button>
                      <span className="text-[12px] font-extrabold w-4 text-center text-[var(--sc-text-primary)] notranslate" translate="no">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="text-gray-400 hover:text-[var(--sc-brand-600)] p-0.5 transition-colors active:scale-90"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} strokeWidth={3} />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3 text-gray-400">
                  <ShoppingBag size={28} />
                </div>
                <p className="text-[15px] font-bold text-[var(--sc-text-primary)]">Your cart is empty</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Explore the marketplace to add pet food, supplies, and healthcare items.</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-5 py-2 bg-[var(--sc-brand-600)] text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all"
                >
                  Start Shopping
                </button>
              </div>
            )}
          </div>

          {/* Summary & Checkout Footer */}
          {items.length > 0 && (
            <div className="p-5 border-t border-[var(--sc-border)] bg-gray-50/80 dark:bg-white/[0.02] shrink-0">
              <div className="flex flex-col gap-1.5 mb-4 text-[13px]">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-[var(--sc-text-primary)] notranslate" translate="no">৳{subtotal.toLocaleString()} BDT</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tax (5%)</span>
                  <span className="font-bold text-[var(--sc-text-primary)] notranslate" translate="no">৳{tax.toLocaleString()} BDT</span>
                </div>
                <div className="h-px bg-[var(--sc-border)] my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[15px] text-[var(--sc-text-primary)]">Total</span>
                  <span className="font-extrabold text-[19px] text-[var(--sc-brand-600)] notranslate" translate="no">৳{total.toLocaleString()} BDT</span>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-3.5 bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white text-[15px] font-bold rounded-2xl shadow-lg shadow-[var(--sc-brand-600)]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={17} />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 mt-2.5">
                <ShieldCheck size={13} className="text-green-500" />
                <span>100% Secure Checkout in BDT (Bangladeshi Taka)</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <MarketplaceCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => {
            setIsCheckoutOpen(false);
            onClose();
          }}
          total={total}
        />
      )}
    </>
  , document.body);
}
