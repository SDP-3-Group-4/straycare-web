import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import MarketItemCard from './MarketItemCard';
import type { MarketItem } from './MarketItemCard';
import MarketplaceProductModal from './MarketplaceProductModal';
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
  const [items, setItems] = useState<MarketItem[]>([]);
  const [, setLoading] = useState(true);
  const { addToCart } = useCart();

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
    <div className="flex flex-col w-full pb-20 pt-[92px] px-4 sm:px-6">
      
      {/* Search Bar */}
      <div className="relative group mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--sc-brand-500)] transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search products, services, food..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-[var(--sc-border)] pl-12 pr-4 py-3.5 rounded-2xl text-[15px] text-[var(--sc-text-primary)] placeholder:text-gray-400 focus:outline-none focus:border-[var(--sc-brand-500)] focus:ring-4 focus:ring-[var(--sc-brand-500)]/10 transition-all"
        />
      </div>

      {/* Categories Filter */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-6 border-b border-[var(--sc-border)] mb-6">
        <div className="flex items-center gap-2 text-gray-400 mr-2 shrink-0">
          <Filter size={18} />
        </div>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-bold transition-all duration-200 border ${
                isActive
                  ? 'bg-[var(--sc-brand-600)] text-white border-[var(--sc-brand-600)]'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Search className="text-gray-400" size={24} />
          </div>
          <h3 className="font-bold text-lg text-[var(--sc-text-primary)] mb-1">No items found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your search or category filters.</p>
        </div>
      )}

      {/* Modal */}
      <MarketplaceProductModal 
        item={selectedItem} 
        isOpen={selectedItem !== null} 
        onClose={() => setSelectedItem(null)} 
      />

    </div>
  );
}
