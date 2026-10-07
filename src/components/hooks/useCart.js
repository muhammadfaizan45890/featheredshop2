import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "elo_cart_v1";

/**
 * @typedef {Object} CartItem
 * @property {string} id
 * @property {string} name
 * @property {string} [variant]
 * @property {number} price
 * @property {number} qty
 * @property {string} [image]
 */

/**
 * Encapsulates all cart state and mutations: persistence to
 * localStorage, add/remove/increment/decrement, and derived totals.
 * Keeping this out of the Navbar component lets the cart be reused
 * (e.g. on a product page) and unit-tested in isolation.
 *
 * @returns {{
 *   cart: CartItem[],
 *   cartCount: number,
 *   subtotal: number,
 *   addItem: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void,
 *   removeItem: (id: string) => void,
 *   incrementItem: (id: string) => void,
 *   decrementItem: (id: string) => void,
 *   clearCart: () => void,
 * }}
 */
export default function useCart() {
  const [cart, setCart] = useState(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Storage may be unavailable (private mode, quota); fail silently,
      // cart still works for the session.
    }
  }, [cart]);

  const addItem = useCallback((item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + (item.qty ?? 1) } : i,
        );
      }
      return [...prev, { ...item, qty: item.qty ?? 1 }];
    });
    toast.success(`Added ${item.name} to your bag`);
  }, []);

  const removeItem = useCallback((id) => {
    setCart((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) toast(`Removed ${item.name}`);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const incrementItem = useCallback((id) => {
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)));
  }, []);

  const decrementItem = useCallback((id) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty - 1) } : i))
        .filter((i) => i.qty > 0),
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart]);
  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.qty, 0),
    [cart],
  );

  return { cart, cartCount, subtotal, addItem, removeItem, incrementItem, decrementItem, clearCart };
}
