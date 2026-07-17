import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models/api.model';
import { AddCommentRequest, TicketDetail, TicketSummary } from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/support-tickets`;

  getTickets(page = 0, pageSize = 20): Observable<PagedResponse<TicketSummary>> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<PagedResponse<TicketSummary>>(this.base, { params });
  }

  getTicket(id: string): Observable<ApiResponse<TicketDetail>> {
    return this.http.get<ApiResponse<TicketDetail>>(`${this.base}/${id}`);
  }

  addComment(
    ticketId: string,
    payload: AddCommentRequest
  ): Observable<ApiResponse<TicketDetail>> {
    return this.http.post<ApiResponse<TicketDetail>>(
      `${this.base}/${ticketId}/comments`,
      payload
    );
  }
}
