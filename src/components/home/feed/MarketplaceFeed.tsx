import { useState, useEffect } from 'react';
import { Search, Filter, ShoppingBag, ArrowRight } from 'lucide-react';
import MarketItemCard from './MarketItemCard';
import type { MarketItem } from './MarketItemCard';
import MarketplaceProductModal from './MarketplaceProductModal';
import MobileCartModal from '../../mobile/MobileCartModal';
import { fetchMarketplaceItems } from '../../../services/api';
import { useCart } from '../../../contexts/CartContext';

const CATEGORIES = [
  'All', 'Healthcare', 'Grooming', 'Food & Nutrition', 
  'Services', 'Training', 'Accessories', 'Furniture', 'Donation'
];

export default function MarketplaceFeed() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [, setLoading] = useState(true);
  const { addToCart, items: cartItems, total: cartTotal } = useCart();
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    fetchMarketplaceItems()
      .then((data: any[]) => {
        const mappedItems: MarketItem[] = data.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          currency: item.currency || '৳',
          imageUrl: item.imageUrl || undefined,
          seller: item.seller?.displayName || 'Unknown Seller',
          category: item.category,
          rating: 4.5, // placeholder
          reviews: Math.floor(Math.random() * 100), // placeholder
          inStock: true, // placeholder
          features: ['Feature 1', 'Feature 2'], // placeholder
          isService: item.category === 'Services' || item.category === 'Training'
        }));
        setItems(mappedItems);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching marketplace items:', error);
        setLoading(false);
      });
  }, []);

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (item: MarketItem, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(item);
  };

  const handleItemClick = (item: MarketItem) => {
    setSelectedItem(item);
  };

  return (
    <div className="flex flex-col w-full pb-24 pt-3 sm:pt-6 lg:pt-[74px] px-1 sm:px-4 lg:px-6">
      
      {/* Search Bar */}
      <div className="relative group mb-4 sm:mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--sc-brand-500)] transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Search products, food, supplies..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-[var(--sc-border)] pl-11 pr-4 py-3 rounded-2xl text-[14px] sm:text-[15px] text-[var(--sc-text-primary)] placeholder:text-gray-400 focus:outline-none focus:border-[var(--sc-brand-500)] focus:ring-4 focus:ring-[var(--sc-brand-500)]/10 transition-all shadow-xs"
        />
      </div>

      {/* Categories Filter */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 border-b border-[var(--sc-border)] mb-5 max-w-full">
        <div className="flex items-center gap-1.5 text-gray-400 mr-1 shrink-0">
          <Filter size={16} />
        </div>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] sm:text-[14px] font-bold transition-all duration-200 border whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--sc-brand-600)] text-white border-[var(--sc-brand-600)] shadow-xs'
                  : 'bg-white text-[var(--sc-text-secondary)] border-[var(--sc-border)] hover:bg-gray-50 hover:text-[var(--sc-text-primary)]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map(item => (
            <MarketItemCard 
              key={item.id} 
              item={item} 
              onClick={handleItemClick}
              onAdd={handleAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-[var(--sc-border)] p-6">
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-400">
            <Search size={22} />
          </div>
          <h3 className="font-bold text-base sm:text-lg text-[var(--sc-text-primary)] mb-1">No items found</h3>
          <p className="text-gray-500 text-xs sm:text-sm">Try adjusting your search query or filter selection.</p>
        </div>
      )}

      {/* Product Detail Modal */}
      <MarketplaceProductModal 
        item={selectedItem} 
        isOpen={selectedItem !== null} 
        onClose={() => setSelectedItem(null)} 
      />

      {/* Floating Mobile Cart Action Bar */}
      {cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-16 left-3 right-3 sm:left-6 sm:right-6 z-30 animate-in slide-in-from-bottom-5 duration-300">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white p-3 sm:p-3.5 rounded-2xl shadow-xl shadow-[var(--sc-brand-600)]/30 flex items-center justify-between transition-all active:scale-[0.98] border border-white/20 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="relative bg-white/20 p-2 rounded-xl">
                <ShoppingBag size={18} className="text-white" />
                <span className="absolute -top-1.5 -right-1.5 bg-white text-[var(--sc-brand-700)] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartItemCount}
                </span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] text-white/80 font-medium">{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in Cart</span>
                <span className="text-sm font-extrabold notranslate" translate="no">৳{cartTotal.toLocaleString()} BDT</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-xs bg-white/20 hover:bg-white/30 px-3.5 py-1.5 rounded-xl transition-colors">
              <span>View Cart</span>
              <ArrowRight size={14} />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Cart Modal */}
      <MobileCartModal
        isOpen={isMobileCartOpen}
        onClose={() => setIsMobileCartOpen(false)}
      />

    </div>
  );
}
