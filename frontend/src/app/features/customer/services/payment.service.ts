import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  ProcessPaymentRequest,
  ProcessPaymentResponse,
  RefundRequest,
  RefundResponse,
  SavedPaymentMethod,
} from '../../../core/models/api.model';
import { ApiGatewayService } from '../../../core/services/api-gateway.service';

/** One-time card tokenisation request — raw PAN never persisted client-side. */
export interface TokenizeCardRequest {
  cardholderName: string;
  /** Digits only; sent once to the payment gateway for tokenisation. */
  cardNumber: string;
  /** MM/YY */
  expiry: string;
  cvv: string;
}

export interface TokenizeCardResponse {
  /** Opaque payment method / token ID to use in placeOrder / processPayment */
  paymentMethodId: string;
  displayLabel: string;
  network?: string;
}

export interface PaymentVerification {
  paymentId: string;
  verified: boolean;
  status: string;
}

export interface PaymentIssueLookup {
  orderNumber: string;
  issueCode: string;
  description: string;
}

/**
 * T8.4 — Payment API client.
 * Routes all calls through the API gateway (`/api/v1/payments`).
 * Card data is tokenised; subsequent calls use opaque payment method IDs only.
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly gateway = inject(ApiGatewayService);

  private url(...segments: (string | number)[]): string {
    return this.gateway.url('payments', ...segments);
  }

  /** List the customer's saved (tokenised) payment methods. */
  getSavedMethods(): Observable<ApiResponse<SavedPaymentMethod[]>> {
    return this.http.get<ApiResponse<SavedPaymentMethod[]>>(this.url('methods'));
  }

  /**
   * Exchange card details for an opaque one-time payment token.
   * The raw card number must not be stored after this call returns.
   */
  tokenizeCard(
    payload: TokenizeCardRequest
  ): Observable<ApiResponse<TokenizeCardResponse>> {
    return this.http.post<ApiResponse<TokenizeCardResponse>>(this.url('tokens'), payload);
  }

  /**
   * Charge a payment method. Requires a client-generated idempotency key
   * so safe retries do not double-charge (WEB-API-005).
   */
  processPayment(
    payload: ProcessPaymentRequest
  ): Observable<ApiResponse<ProcessPaymentResponse>> {
    const headers = new HttpHeaders({
      'Idempotency-Key': payload.idempotencyKey,
    });
    return this.http.post<ApiResponse<ProcessPaymentResponse>>(
      this.url('charges'),
      payload,
      { headers }
    );
  }

  verifyPayment(paymentId: string): Observable<ApiResponse<PaymentVerification>> {
    return this.http.get<ApiResponse<PaymentVerification>>(
      this.url(paymentId, 'verification')
    );
  }

  lookupIssue(orderNumber: string): Observable<ApiResponse<PaymentIssueLookup>> {
    const params = new HttpParams().set('orderNumber', orderNumber);
    return this.http.get<ApiResponse<PaymentIssueLookup>>(this.url('issues'), { params });
  }

  refund(payload: RefundRequest): Observable<ApiResponse<RefundResponse>> {
    const headers = new HttpHeaders({
      'Idempotency-Key': payload.idempotencyKey,
    });
    return this.http.post<ApiResponse<RefundResponse>>(
      this.gateway.url('refunds'),
      payload,
      { headers }
    );
  }

  getRefundStatus(refundId: string): Observable<ApiResponse<RefundResponse>> {
    return this.http.get<ApiResponse<RefundResponse>>(
      this.gateway.url('refunds', refundId, 'status')
    );
  }
}
