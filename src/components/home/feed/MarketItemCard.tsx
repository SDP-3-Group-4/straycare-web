import { Star, Plus, ShieldCheck } from "lucide-react";

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  seller: string;
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  features: string[];
  isService?: boolean;
}

interface MarketItemCardProps {
  item: MarketItem;
  onClick: (item: MarketItem) => void;
  onAdd: (item: MarketItem, e: React.MouseEvent) => void;
}

export default function MarketItemCard({
  item,
  onClick,
  onAdd,
}: MarketItemCardProps) {
  return (
    <div
      onClick={() => onClick(item)}
      className="bg-white border border-[var(--sc-border)] rounded-[24px] overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:border-[var(--sc-brand-300)] group relative h-full"
    >
      {/* Image Section */}
      <div className="relative w-full aspect-[4/3] bg-gray-50 border-b border-[var(--sc-border)] overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Badges Over Image */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className="bg-white/90 backdrop-blur-md text-[var(--sc-brand-700)] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[var(--sc-brand-100)]">
            {item.category}
          </span>
          {item.isService && (
            <span className="bg-[var(--sc-brand-500)] text-white text-[10px] font-bold px-2.5 py-1 rounded-full w-fit">
              Service
            </span>
          )}
        </div>

        {!item.inStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-red-50 text-red-600 font-bold px-4 py-1.5 rounded-full text-xs border border-red-200">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1 bg-white relative">
        <h3 className="font-bold text-[16px] text-[var(--sc-text-primary)] leading-snug mb-1.5 line-clamp-2">
          {item.title}
        </h3>

        <div className="flex items-center gap-1.5 mb-3">
          <ShieldCheck size={14} className="text-gray-400" />
          <span className="text-[13px] text-gray-500 font-medium truncate">
            {item.seller}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-5 mt-auto">
          <div className="flex items-center justify-center bg-amber-50 rounded-md p-1">
            <Star size={12} className="fill-amber-500 text-amber-500" />
          </div>
          <span className="font-bold text-[13px] text-[var(--sc-text-primary)]">
            {item.rating}
          </span>
          <span className="text-[13px] text-gray-400">({item.reviews})</span>
        </div>

        {/* Price & Action Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 font-medium ">
              Price
            </span>
            <div
              className="font-extrabold text-[18px] text-[var(--sc-brand-700)] leading-none mt-0.5 notranslate"
              translate="no"
            >
              <span className="text-[14px] font-bold mr-0.5">
                {item.currency || "৳"}
              </span>
              {item.price.toLocaleString()}{" "}
              <span className="text-[11px] font-semibold text-gray-400 ml-0.5">
                BDT
              </span>
            </div>
          </div>

          <button
            disabled={!item.inStock}
            onClick={(e) => onAdd(item, e)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              item.inStock
                ? "bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] border border-[var(--sc-brand-100)] hover:bg-[var(--sc-brand-600)] hover:text-white"
                : "bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
            }`}
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
