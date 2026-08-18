import { useState } from 'react';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import MarketplaceCheckoutModal from '../feed/MarketplaceCheckoutModal';
import { useCart } from '../../../contexts/CartContext';

export default function CartPanel() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { items, updateQuantity, removeFromCart, subtotal, tax, total } = useCart();

  return (
    <>
      <div className="w-full h-full pb-4 pt-[74px] lg:px-6 flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-[var(--sc-border)] flex flex-col overflow-hidden h-full">
          {/* Header */}
          <div className="p-5 flex justify-between items-center border-b border-[var(--sc-border)]">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[var(--sc-text-primary)] text-xl">Your Cart</h3>
              <span className="bg-[var(--sc-brand-100)] text-[var(--sc-brand-600)] text-[11px] font-bold px-2 py-0.5 rounded-full">
                {items.reduce((acc, item) => acc + item.quantity, 0)} items
              </span>
            </div>
            <ShoppingBag size={20} className="text-gray-400" />
          </div>

          {/* Cart Items List */}
          <div className="flex flex-col overflow-y-auto flex-1 p-3 gap-3">
            {items.map(item => (
              <div key={item.id} className="flex gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-[var(--sc-border)]">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col flex-1">
                  <h4 className="font-semibold text-[13px] text-[var(--sc-text-primary)] leading-tight line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="font-bold text-[14px] text-[var(--sc-brand-600)] mt-1">
                    {item.currency}{item.price.toLocaleString()}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 bg-white border border-[var(--sc-border)] rounded-full px-2 py-0.5">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="text-gray-400 hover:text-[var(--sc-brand-500)] transition-colors"
                      >
                        <Minus size={12} strokeWidth={3} />
                      </button>
                      <span className="text-[12px] font-bold w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="text-gray-400 hover:text-[var(--sc-brand-500)] transition-colors"
                      >
                        <Plus size={12} strokeWidth={3} />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                <ShoppingBag size={48} className="mb-4 opacity-20" />
                <p className="text-[14px] font-medium">Your cart is empty</p>
              </div>
            )}
          </div>

          {/* Summary Footer */}
          <div className="p-5 border-t border-[var(--sc-border)] bg-gray-50/50">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex justify-between text-[13px] text-gray-500">
                <span>Subtotal</span>
                <span className="font-medium text-[var(--sc-text-primary)]">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[13px] text-gray-500">
                <span>Tax (5%)</span>
                <span className="font-medium text-[var(--sc-text-primary)]">৳{tax.toLocaleString()}</span>
              </div>
              <div className="h-px bg-[var(--sc-border)] my-1"></div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-[15px] text-[var(--sc-text-primary)]">Total</span>
                <span className="font-bold text-[18px] text-[var(--sc-brand-600)]">৳{total.toLocaleString()}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsCheckoutOpen(true)}
              disabled={items.length === 0}
              className={`w-full py-3.5 text-[15px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 group ${
                items.length > 0
                  ? 'bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Proceed to Checkout
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
