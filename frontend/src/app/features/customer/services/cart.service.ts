import { Injectable, computed, signal } from '@angular/core';
import { CartItem, calculateCart, emptyCart } from '../models/cart.model';

const CART_STORAGE_KEY = 'aichatbot_cart';

/**
 * CartService — reactive shopping cart backed by Angular Signals.
 *
 * State is persisted to localStorage so it survives page refreshes.
 * The service is provided at root so the cart is shared across the app.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>(this.loadFromStorage());

  /** Derived totals recomputed whenever items change. */
  readonly cart = computed(() => calculateCart(this._items()));
  readonly items = this._items.asReadonly();
  readonly itemCount = computed(() =>
    this._items().reduce((sum, i) => sum + i.quantity, 0)
  );

  // ── Mutations ──────────────────────────────────────────────────────────────

  addItem(item: Omit<CartItem, 'quantity'>, quantity = 1): void {
    this._items.update((current) => {
      const existing = current.find((i) => i.productId === item.productId);
      let updated: CartItem[];
      if (existing) {
        const newQty = Math.min(
          existing.quantity + quantity,
          item.maxQuantity ?? Number.MAX_SAFE_INTEGER
        );
        updated = current.map((i) =>
          i.productId === item.productId ? { ...i, quantity: newQty } : i
        );
      } else {
        updated = [...current, { ...item, quantity }];
      }
      this.persist(updated);
      return updated;
    });
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    this._items.update((current) => {
      const updated = current.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      );
      this.persist(updated);
      return updated;
    });
  }

  removeItem(productId: string): void {
    this._items.update((current) => {
      const updated = current.filter((i) => i.productId !== productId);
      this.persist(updated);
      return updated;
    });
  }

  clearCart(): void {
    this._items.set([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }

  // ── Persistence helpers ────────────────────────────────────────────────────

  private persist(items: CartItem[]): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage quota exceeded or private browsing — fail silently
    }
  }

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
    } catch {
      return [];
    }
  }
}
