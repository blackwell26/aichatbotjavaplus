/**
 * Phase 5 – Agent Portal API service.
 *
 * Covers all REST calls needed by the agent portal:
 *  - Dashboard statistics
 *  - Escalation queue (list, assign, resolve)
 *  - Conversation workspace (messages, AI suggestions, send reply)
 *  - Ticket management (get, update status/priority, add comment)
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models/api.model';
import {
  AddAgentCommentRequest,
  AgentConversation,
  AgentDashboardStats,
  AgentTicket,
  AssignConversationResponse,
  GetSuggestionsResponse,
  QueueFilterStatus,
  QueueSortField,
  QueuedConversation,
  SendAgentMessageRequest,
  UpdateTicketRequest,
} from '../models/agent.model';

@Injectable({ providedIn: 'root' })
export class AgentService {
  private readonly http = inject(HttpClient);

  private readonly agentBase = `${environment.apiBaseUrl}/api/v1/agent`;
  private readonly escalationsBase = `${this.agentBase}/escalations`;
  private readonly ticketsBase = `${this.agentBase}/tickets`;

  // ── Dashboard ─────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/agent/dashboard/stats
   * Returns aggregate stats for the agent dashboard.
   */
  getDashboardStats(): Observable<ApiResponse<AgentDashboardStats>> {
    return this.http.get<ApiResponse<AgentDashboardStats>>(
      `${this.agentBase}/dashboard/stats`
    );
  }

  // ── Escalation queue ──────────────────────────────────────────────────────

  /**
   * GET /api/v1/agent/escalations
   * Lists queued escalations with optional filtering and sorting.
   */
  getQueue(options: {
    status?: QueueFilterStatus;
    priority?: string;
    sortBy?: QueueSortField;
    page?: number;
    pageSize?: number;
  } = {}): Observable<PagedResponse<QueuedConversation>> {
    let params = new HttpParams()
      .set('page', options.page ?? 0)
      .set('pageSize', options.pageSize ?? 20);

    if (options.status && options.status !== 'ALL') {
      params = params.set('status', options.status);
    }
    if (options.priority) {
      params = params.set('priority', options.priority);
    }
    if (options.sortBy) {
      params = params.set('sortBy', options.sortBy);
    }

    return this.http.get<PagedResponse<QueuedConversation>>(this.escalationsBase, { params });
  }

  /**
   * POST /api/v1/agent/escalations/{escalationId}/assign
   * Assigns the escalation to the currently authenticated agent.
   */
  assignToMe(escalationId: string): Observable<ApiResponse<AssignConversationResponse>> {
    return this.http.post<ApiResponse<AssignConversationResponse>>(
      `${this.escalationsBase}/${escalationId}/assign`,
      {}
    );
  }

  /**
   * POST /api/v1/agent/escalations/{escalationId}/resolve
   * Marks the escalation as resolved.
   */
  resolveEscalation(
    escalationId: string,
    resolution?: string
  ): Observable<ApiResponse<{ escalationId: string; status: string }>> {
    return this.http.post<ApiResponse<{ escalationId: string; status: string }>>(
      `${this.escalationsBase}/${escalationId}/resolve`,
      { resolution }
    );
  }

  // ── Conversation workspace ────────────────────────────────────────────────

  /**
   * GET /api/v1/agent/escalations/{escalationId}/conversation
   * Returns the full conversation (messages + linked ticket + AI suggestions).
   */
  getConversation(escalationId: string): Observable<ApiResponse<AgentConversation>> {
    return this.http.get<ApiResponse<AgentConversation>>(
      `${this.escalationsBase}/${escalationId}/conversation`
    );
  }

  /**
   * POST /api/v1/agent/escalations/{escalationId}/messages
   * Sends an agent reply in the conversation.
   */
  sendMessage(
    escalationId: string,
    payload: SendAgentMessageRequest
  ): Observable<ApiResponse<AgentConversation>> {
    return this.http.post<ApiResponse<AgentConversation>>(
      `${this.escalationsBase}/${escalationId}/messages`,
      payload
    );
  }

  /**
   * GET /api/v1/agent/escalations/{escalationId}/suggestions
   * Fetches AI-generated reply suggestions for the current conversation.
   */
  getSuggestions(escalationId: string): Observable<ApiResponse<GetSuggestionsResponse>> {
    return this.http.get<ApiResponse<GetSuggestionsResponse>>(
      `${this.escalationsBase}/${escalationId}/suggestions`
    );
  }

  // ── Ticket management ─────────────────────────────────────────────────────

  /**
   * GET /api/v1/agent/tickets/{ticketId}
   * Fetches the full agent-enriched ticket.
   */
  getTicket(ticketId: string): Observable<ApiResponse<AgentTicket>> {
    return this.http.get<ApiResponse<AgentTicket>>(
      `${this.ticketsBase}/${ticketId}`
    );
  }

  /**
   * PATCH /api/v1/agent/tickets/{ticketId}
   * Updates ticket status, priority, resolution, or assignment.
   */
  updateTicket(
    ticketId: string,
    payload: UpdateTicketRequest
  ): Observable<ApiResponse<AgentTicket>> {
    return this.http.patch<ApiResponse<AgentTicket>>(
      `${this.ticketsBase}/${ticketId}`,
      payload
    );
  }

  /**
   * POST /api/v1/agent/tickets/{ticketId}/comments
   * Adds a comment (public or internal note) to a ticket.
   */
  addTicketComment(
    ticketId: string,
    payload: AddAgentCommentRequest
  ): Observable<ApiResponse<AgentTicket>> {
    return this.http.post<ApiResponse<AgentTicket>>(
      `${this.ticketsBase}/${ticketId}/comments`,
      payload
    );
  }
}
