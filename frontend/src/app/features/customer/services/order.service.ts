import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models/api.model';
import { OrderDetail, OrderSummary } from '../models/order.model';
import { ReturnRequestPayload, ReturnRequestResult } from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/orders`;

  getOrders(page = 0, pageSize = 20): Observable<PagedResponse<OrderSummary>> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<PagedResponse<OrderSummary>>(this.base, { params });
  }

  getOrder(id: string): Observable<ApiResponse<OrderDetail>> {
    return this.http.get<ApiResponse<OrderDetail>>(`${this.base}/${id}`);
  }

  submitReturn(
    orderId: string,
    payload: ReturnRequestPayload
  ): Observable<ApiResponse<ReturnRequestResult>> {
    return this.http.post<ApiResponse<ReturnRequestResult>>(
      `${this.base}/${orderId}/returns`,
      payload
    );
  }
}
