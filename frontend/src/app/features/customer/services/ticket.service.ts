import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  CreateSupportTicketRequest,
  EscalateToAgentRequest,
  EscalationResponse,
  LinkConversationRequest,
  PagedResponse,
} from '../../../core/models/api.model';
import { ApiGatewayService } from '../../../core/services/api-gateway.service';
import { AddCommentRequest, TicketDetail, TicketSummary } from '../models/ticket.model';

/**
 * T8.6 — Support API client.
 * Routes all calls through the API gateway (`/api/v1/support-tickets`).
 */
@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly gateway = inject(ApiGatewayService);

  private url(...segments: (string | number)[]): string {
    return this.gateway.url('support-tickets', ...segments);
  }

  getTickets(page = 0, pageSize = 20): Observable<PagedResponse<TicketSummary>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<PagedResponse<TicketSummary>>(this.url(), { params });
  }

  getTicket(id: string): Observable<ApiResponse<TicketDetail>> {
    return this.http.get<ApiResponse<TicketDetail>>(this.url(id));
  }

  createTicket(
    payload: CreateSupportTicketRequest
  ): Observable<ApiResponse<TicketDetail>> {
    return this.http.post<ApiResponse<TicketDetail>>(this.url(), payload);
  }

  addComment(
    ticketId: string,
    payload: AddCommentRequest
  ): Observable<ApiResponse<TicketDetail>> {
    return this.http.post<ApiResponse<TicketDetail>>(
      this.url(ticketId, 'comments'),
      payload
    );
  }

  /**
   * Escalate a chat session to a human agent, creating a linked support ticket.
   * Prefer this over chat-only escalate when the customer needs a tracked ticket.
   */
  escalateToAgent(
    payload: EscalateToAgentRequest
  ): Observable<ApiResponse<EscalationResponse>> {
    return this.http.post<ApiResponse<EscalationResponse>>(
      this.url('escalations'),
      payload
    );
  }

  /** Attach an existing chat session to a support ticket for agent context. */
  linkConversation(
    ticketId: string,
    payload: LinkConversationRequest
  ): Observable<ApiResponse<TicketDetail>> {
    return this.http.post<ApiResponse<TicketDetail>>(
      this.url(ticketId, 'conversations'),
      payload
    );
  }
}
