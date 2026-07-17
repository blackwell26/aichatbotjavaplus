/** Order domain models. */

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Awaiting payment',
  PAID: 'Paid',
  REFUNDED: 'Refunded',
  FAILED: 'Payment failed',
};

export interface OrderSummary {
  id: string;
  orderNumber: string;
  orderDate: string; // ISO 8601
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  itemCount: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  returnEligible: boolean;
  returnDeadline?: string; // ISO 8601
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface TrackingEvent {
  timestamp: string;
  location: string;
  description: string;
}

export interface ShipmentInfo {
  carrier: string;
  trackingNumber: string;
  estimatedDelivery?: string;
  events: TrackingEvent[];
}

export interface OrderDetail extends OrderSummary {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  shippingAddress: ShippingAddress;
  shipment?: ShipmentInfo;
  supportTicketIds: string[];
}
