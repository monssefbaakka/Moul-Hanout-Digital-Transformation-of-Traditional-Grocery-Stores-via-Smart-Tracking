import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Product, SaleItem } from '@moul-hanout/shared-types';
import { computeSaleTotals } from '@moul-hanout/shared-utils';

interface CartState {
  items: SaleItem[];
  discount: number;
  taxRate: number;

  // Computed
  subtotal: number;
  taxAmount: number;
  total: number;

  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (discount: number) => void;
  clearCart: () => void;
}

function recalculate(
  items: SaleItem[],
  taxRate: number,
  discount: number,
): { subtotal: number; taxAmount: number; total: number } {
  return computeSaleTotals(
    items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity, discount: i.discount })),
    taxRate,
    discount,
  );
}

export const useCartStore = create<CartState>()(
  devtools(
    (set, get) => ({
      items: [],
      discount: 0,
      taxRate: 0.2,
      subtotal: 0,
      taxAmount: 0,
      total: 0,

      addItem(product, quantity = 1) {
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);
          let items: SaleItem[];
          if (existing) {
            items = state.items.map((i) =>
              i.productId === product.id
                ? { ...i, quantity: i.quantity + quantity, total: i.unitPrice * (i.quantity + quantity) }
                : i,
            );
          } else {
            const newItem: SaleItem = {
              id: crypto.randomUUID(),
              productId: product.id,
              product,
              quantity,
              unitPrice: product.salePrice,
              discount: 0,
              total: product.salePrice * quantity,
            };
            items = [...state.items, newItem];
          }
          return { items, ...recalculate(items, state.taxRate, state.discount) };
        });
      },

      removeItem(productId) {
        set((state) => {
          const items = state.items.filter((i) => i.productId !== productId);
          return { items, ...recalculate(items, state.taxRate, state.discount) };
        });
      },

      updateQuantity(productId, quantity) {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => {
          const items = state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity, total: i.unitPrice * quantity }
              : i,
          );
          return { items, ...recalculate(items, state.taxRate, state.discount) };
        });
      },

      setDiscount(discount) {
        set((state) => ({
          discount,
          ...recalculate(state.items, state.taxRate, discount),
        }));
      },

      clearCart() {
        set({ items: [], discount: 0, subtotal: 0, taxAmount: 0, total: 0 });
      },
    }),
    { name: 'CartStore' },
  ),
);
