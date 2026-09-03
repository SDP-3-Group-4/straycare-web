import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { MarketItem } from "../components/home/feed/MarketItemCard";

export interface CartItem extends MarketItem {
  quantity: number;
}

export type DeliveryZone = "inside_dhaka" | "outside_dhaka";

interface CartContextType {
  items: CartItem[];
  addToCart: (item: MarketItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  deliveryZone: DeliveryZone;
  setDeliveryZone: (zone: DeliveryZone) => void;
  deliveryFee: number;
  platformFee: number;
  tax: number; // deprecated: always 0 (tax removed)
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("sc_cart");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone>(() => {
    return (localStorage.getItem("sc_delivery_zone") as DeliveryZone) || "inside_dhaka";
  });

  useEffect(() => {
    localStorage.setItem("sc_cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("sc_delivery_zone", deliveryZone);
  }, [deliveryZone]);

  const addToCart = (item: MarketItem) => {
    setItems((current) => {
      const existing = current.find((i) => i.id === item.id);
      if (existing) {
        return current.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...current, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setItems((current) => current.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, quantity } : i)),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Delivery fee: ৳80 inside Dhaka, ৳120 outside Dhaka (৳0 if cart is empty)
  const deliveryFee = items.length > 0 ? (deliveryZone === "inside_dhaka" ? 80 : 120) : 0;

  // Platform operational fee: flat ৳15 (৳0 if cart is empty)
  const platformFee = items.length > 0 ? 15 : 0;

  // Zero tax
  const tax = 0;

  // Total calculation
  const total = subtotal + deliveryFee + platformFee;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryZone,
        setDeliveryZone,
        deliveryFee,
        platformFee,
        tax,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
