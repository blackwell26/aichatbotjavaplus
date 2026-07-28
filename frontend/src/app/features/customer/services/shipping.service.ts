import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  ShipmentTracking,
  ShippingRate,
  ShippingRateRequest,
} from '../../../core/models/api.model';
import { ApiGatewayService } from '../../../core/services/api-gateway.service';

export interface EstimatedDelivery {
  orderNumber: string;
  estimatedDeliveryDate: string;
  status: string;
}

export interface CarrierStatus {
  carrierCode: string;
  status: string;
  region?: string;
}

/**
 * T8.5 — Shipping API client.
 * Routes all calls through the API gateway (`/api/v1/shipping`, `/shipments`, `/carriers`).
 */
@Injectable({ providedIn: 'root' })
export class ShippingService {
  private readonly http = inject(HttpClient);
  private readonly gateway = inject(ApiGatewayService);

  /** Quote available shipping rates for a destination. */
  getRates(request: ShippingRateRequest): Observable<ApiResponse<ShippingRate[]>> {
    return this.http.post<ApiResponse<ShippingRate[]>>(
      this.gateway.url('shipping', 'rates'),
      request
    );
  }

  /** Track a shipment by carrier tracking number. */
  getTracking(trackingNumber: string): Observable<ApiResponse<ShipmentTracking>> {
    return this.http.get<ApiResponse<ShipmentTracking>>(
      this.gateway.url('shipments', trackingNumber)
    );
  }

  /** Estimated delivery for an order. */
  getEstimatedDelivery(orderNumber: string): Observable<ApiResponse<EstimatedDelivery>> {
    return this.http.get<ApiResponse<EstimatedDelivery>>(
      this.gateway.url('orders', orderNumber, 'delivery-estimate')
    );
  }

  getCarrierStatus(carrierCode: string): Observable<ApiResponse<CarrierStatus>> {
    return this.http.get<ApiResponse<CarrierStatus>>(
      this.gateway.url('carriers', carrierCode, 'status')
    );
  }
}
