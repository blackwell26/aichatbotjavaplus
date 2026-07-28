/** Standard API response envelope. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  correlationId?: string;
}

/** Standard paginated API response. */
export interface PagedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  correlationId?: string;
}

/** Standard API error payload returned by the backend. */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  correlationId?: string;
}

// ── Phase 8: Payment models (T8.4) ───────────────────────────────────────────

export type PaymentMethodType = 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'APPLE_PAY' | 'GOOGLE_PAY';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  CREDIT_CARD: 'Credit card',
  DEBIT_CARD: 'Debit card',
  PAYPAL: 'PayPal',
  APPLE_PAY: 'Apple Pay',
  GOOGLE_PAY: 'Google Pay',
};

/** A saved, tokenised payment method – card numbers are never stored. */
export interface SavedPaymentMethod {
  id: string;
  type: PaymentMethodType;
  /** Masked display value, e.g. "•••• •••• •••• 4242" */
  displayLabel: string;
  /** Card network (Visa, Mastercard, etc.) – cards only */
  network?: string;
  /** MM/YY expiry – cards only */
  expiryDisplay?: string;
  isDefault: boolean;
}

export interface ProcessPaymentRequest {
  orderId: string;
  /** Saved payment method ID OR a one-time payment token from the card form */
  paymentMethodId: string;
  amount: number;
  currency: string;
  /** Client-generated idempotency key (UUID) to prevent double charges */
  idempotencyKey: string;
}

export interface ProcessPaymentResponse {
  transactionId: string;
  status: 'APPROVED' | 'DECLINED' | 'PENDING';
  /** Gateway reference code */
  authorizationCode?: string;
  message?: string;
}

export interface RefundRequest {
  transactionId: string;
  amount?: number; // omit for full refund
  reason: string;
  idempotencyKey: string;
}

export interface RefundResponse {
  refundId: string;
  status: 'APPROVED' | 'PENDING' | 'FAILED';
  refundedAmount: number;
  message?: string;
}

// ── Phase 8: Shipping models (T8.5) ──────────────────────────────────────────

export interface ShippingRateRequest {
  originPostalCode: string;
  originCountry: string;
  destinationPostalCode: string;
  destinationCountry: string;
  weightKg: number;
  dimensionsCm?: { l: number; w: number; h: number };
}

export interface ShippingRate {
  carrierId: string;
  carrierName: string;
  serviceCode: string;
  serviceLabel: string;
  estimatedDays: number;
  /** Rate in the order's currency */
  rate: number;
  currency: string;
}

export interface ShipmentTrackingEvent {
  timestamp: string;   // ISO 8601
  location: string;
  description: string;
  status: string;
}

export interface ShipmentTracking {
  trackingNumber: string;
  carrier: string;
  serviceLabel: string;
  status: string;
  estimatedDelivery?: string;  // ISO 8601
  events: ShipmentTrackingEvent[];
}

// ── Phase 8: Checkout / Order placement models (T8.3) ────────────────────────

export interface CheckoutAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CheckoutLineItem {
  productId: string;
  quantity: number;
}

export interface PlaceOrderRequest {
  items: CheckoutLineItem[];
  shippingAddress: CheckoutAddress;
  /**
   * Saved payment method ID or one-time token from payment form.
   * The backend tokenises card details — never pass raw card data here.
   */
  paymentMethodId: string;
  shippingRateId?: string;
  /** Client-generated UUID to prevent duplicate orders on retry */
  idempotencyKey: string;
}

export interface PlaceOrderResponse {
  orderId: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  estimatedDelivery?: string;
}

export interface CancelOrderResponse {
  orderId: string;
  status: string;
  message: string;
}

// ── Phase 8: Support / escalation models (T8.6) ──────────────────────────────

export type SupportCategory =
  | 'ORDER_ISSUE'
  | 'RETURN_REFUND'
  | 'PRODUCT_QUESTION'
  | 'PAYMENT_ISSUE'
  | 'SHIPPING_ISSUE'
  | 'ACCOUNT_ISSUE'
  | 'GENERAL';

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  ORDER_ISSUE: 'Order issue',
  RETURN_REFUND: 'Return / refund',
  PRODUCT_QUESTION: 'Product question',
  PAYMENT_ISSUE: 'Payment issue',
  SHIPPING_ISSUE: 'Shipping issue',
  ACCOUNT_ISSUE: 'Account issue',
  GENERAL: 'General enquiry',
};

export interface CreateSupportTicketRequest {
  subject: string;
  description: string;
  category: SupportCategory;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  relatedOrderId?: string;
  relatedProductId?: string;
  /** Attach the originating chatbot session for context */
  chatSessionId?: string;
}

export interface EscalateToAgentRequest {
  chatSessionId: string;
  reason: string;
  category?: SupportCategory;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  /** Customer's description of the issue */
  summary?: string;
}

export interface EscalationResponse {
  escalationId: string;
  ticketNumber: string;
  estimatedWaitMinutes?: number;
  message: string;
}

export interface LinkConversationRequest {
  chatSessionId: string;
}

// ── Phase 8: Mapped client-side error ────────────────────────────────────────

/**
 * Normalised error that the ApiErrorInterceptor produces.
 * All parts of the UI subscribe to ApiErrorService to receive these.
 */
export interface MappedApiError {
  /** HTTP status code, or 0 for network errors */
  status: number;
  /** Backend error code string, or a synthetic code */
  code: string;
  /** Human-readable message safe to display to the user */
  userMessage: string;
  /** Backend correlation ID for support tracing */
  correlationId?: string;
  /** Original URL that failed */
  url?: string;
}
