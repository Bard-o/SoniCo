import { createContext, useContext, useState, useMemo, type ReactNode } from "react";
import type { RentalItem } from "@/types/database";

type CartLine = { itemId: string; qty: number };

interface CartContextValue {
  lines: CartLine[];
  add: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [lines, setLines] = useState<CartLine[]>([]);

  const add = (id: string) =>
    setLines((prev) =>
      prev.find((l) => l.itemId === id)
        ? prev.map((l) => (l.itemId === id ? { ...l, qty: l.qty + 1 } : l))
        : [...prev, { itemId: id, qty: 1 }],
    );

  const setQty = (id: string, qty: number) =>
    setLines((prev) =>
      qty <= 0 ? prev.filter((l) => l.itemId !== id) : prev.map((l) => (l.itemId === id ? { ...l, qty } : l)),
    );

  const remove = (id: string) => setLines((prev) => prev.filter((l) => l.itemId !== id));
  const clear = () => setLines([]);

  const count = lines.reduce((a, l) => a + l.qty, 0);

  return (
    <CartContext.Provider value={{ lines, add, setQty, remove, clear, count }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

// Helper to compute detailed cart info from lines + items catalog
export function useCartDetailed(items: RentalItem[]) {
  const { lines } = useCart();

  return useMemo(() => {
    return lines
      .map((line) => {
        const item = items.find((i) => i.id === line.itemId);
        if (!item) return null;
        return { item, qty: line.qty, lineTotal: item.price_rental * line.qty };
      })
      .filter(Boolean) as { item: RentalItem; qty: number; lineTotal: number }[];
  }, [lines, items]);
}