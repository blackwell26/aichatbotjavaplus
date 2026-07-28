import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  CancelOrderResponse,
  PagedResponse,
  PlaceOrderRequest,
  PlaceOrderResponse,
} from '../../../core/models/api.model';
import { ApiGatewayService } from '../../../core/services/api-gateway.service';
import { OrderDetail, OrderSummary, ShipmentInfo } from '../models/order.model';
import { ReturnRequestPayload, ReturnRequestResult } from '../models/ticket.model';

/**
 * T8.3 — Order API client.
 * Routes all calls through the API gateway (`/api/v1/orders`).
 * Non-idempotent writes require a client-generated idempotency key.
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly gateway = inject(ApiGatewayService);

  private url(...segments: (string | number)[]): string {
    return this.gateway.url('orders', ...segments);
  }

  getOrders(page = 0, pageSize = 20): Observable<PagedResponse<OrderSummary>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<PagedResponse<OrderSummary>>(this.url(), { params });
  }

  getOrder(id: string): Observable<ApiResponse<OrderDetail>> {
    return this.http.get<ApiResponse<OrderDetail>>(this.url(id));
  }

  /** Shipment tracking for an order (GET /orders/{id}/tracking). */
  getTracking(orderId: string): Observable<ApiResponse<ShipmentInfo>> {
    return this.http.get<ApiResponse<ShipmentInfo>>(this.url(orderId, 'tracking'));
  }

  /**
   * Place an order. Pass a UUID `idempotencyKey` in the body so retries are safe
   * (WEB-API-005).
   */
  placeOrder(payload: PlaceOrderRequest): Observable<ApiResponse<PlaceOrderResponse>> {
    const headers = new HttpHeaders({
      'Idempotency-Key': payload.idempotencyKey,
    });
    return this.http.post<ApiResponse<PlaceOrderResponse>>(this.url(), payload, { headers });
  }

  cancelOrder(
    orderId: string,
    reason?: string
  ): Observable<ApiResponse<CancelOrderResponse>> {
    return this.http.post<ApiResponse<CancelOrderResponse>>(this.url(orderId, 'cancel'), {
      reason: reason ?? 'CUSTOMER_REQUEST',
    });
  }

  submitReturn(
    orderId: string,
    payload: ReturnRequestPayload
  ): Observable<ApiResponse<ReturnRequestResult>> {
    return this.http.post<ApiResponse<ReturnRequestResult>>(
      this.url(orderId, 'returns'),
      payload
    );
  }

  /** Check whether an order item is eligible for return. */
  checkReturnEligibility(
    orderId: string,
    orderItemId: string
  ): Observable<ApiResponse<{ eligible: boolean; reason?: string; deadline?: string }>> {
    return this.http.post<
      ApiResponse<{ eligible: boolean; reason?: string; deadline?: string }>
    >(this.url(orderId, 'return-eligibility'), { orderItemId });
  }
}
