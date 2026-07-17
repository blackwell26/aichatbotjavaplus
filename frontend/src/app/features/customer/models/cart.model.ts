/** Shopping cart models. */

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  thumbnailUrl?: string;
  maxQuantity?: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  estimatedTax: number;
  estimatedShipping: number;
  total: number;
}

export function emptyCart(): Cart {
  return { items: [], subtotal: 0, estimatedTax: 0, estimatedShipping: 0, total: 0 };
}

export function calculateCart(items: CartItem[]): Cart {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const estimatedTax = Math.round(subtotal * 0.08 * 100) / 100;
  const estimatedShipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal + estimatedTax + estimatedShipping;
  return { items, subtotal, estimatedTax, estimatedShipping, total };
}
