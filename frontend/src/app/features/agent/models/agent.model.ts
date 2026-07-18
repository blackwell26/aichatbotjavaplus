/**
 * Phase 5 – Agent Portal domain models.
 *
 * Mirrors backend DTOs for:
 *  - AgentDashboardStats
 *  - EscalationQueue / QueuedConversation
 *  - AgentTicket (agent-side enriched ticket view)
 *  - AI reply suggestion
 */

import { TicketPriority, TicketStatus } from '../../customer/models/ticket.model';
import { ChatMessage, EscalationStatus } from '../../chat/models/chat.model';

// ── Dashboard stats ───────────────────────────────────────────────────────────

export interface AgentDashboardStats {
  openQueueCount: number;
  activeChatsCount: number;
  resolvedTodayCount: number;
  avgHandleTimeMinutes: number;
  /** Change vs yesterday, e.g. +3 or -2 */
  openQueueDelta?: number;
  activeChatsDelta?: number;
  resolvedTodayDelta?: number;
  avgHandleTimeDelta?: number;
}

// ── Escalation / queue ────────────────────────────────────────────────────────

export type QueueSortField = 'createdAt' | 'priority' | 'waitTime';
export type QueueFilterStatus = 'PENDING' | 'ASSIGNED' | 'ALL';

export interface QueuedConversation {
  escalationId: string;
  sessionId: string;
  ticketNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  priority: TicketPriority;
  status: EscalationStatus;
  trigger: string;
  /** ISO 8601 – when the escalation was created. */
  createdAt: string;
  /** Assigned agent ID, null if unassigned. */
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  /** Number of minutes since escalation was created. */
  waitMinutes: number;
}

export const ESCALATION_STATUS_LABELS: Record<EscalationStatus, string> = {
  PENDING: 'Waiting',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

// ── Agent-side ticket ─────────────────────────────────────────────────────────

export interface AgentTicketComment {
  id: string;
  authorName: string;
  authorRole: 'CUSTOMER' | 'AGENT';
  body: string;
  createdAt: string; // ISO 8601
  internal: boolean;
}

export interface AgentTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  resolution?: string;
  relatedOrderId?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  comments: AgentTicketComment[];
}

export interface UpdateTicketRequest {
  status?: TicketStatus;
  priority?: TicketPriority;
  resolution?: string;
  assignedAgentId?: string | null;
}

export interface AddAgentCommentRequest {
  body: string;
  internal: boolean;
}

// ── AI reply suggestions (T5.4) ───────────────────────────────────────────────

export interface AiReplySuggestion {
  id: string;
  text: string;
  confidence: number; // 0.0 – 1.0
  intent?: string;
}

// ── Conversation workspace state ──────────────────────────────────────────────

export interface AgentConversation {
  escalationId: string;
  sessionId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: EscalationStatus;
  priority: TicketPriority;
  subject: string;
  createdAt: string;
  messages: ChatMessage[];
  ticket?: AgentTicket;
  suggestions: AiReplySuggestion[];
}

// ── Request / response DTOs ───────────────────────────────────────────────────

export interface AssignConversationResponse {
  escalationId: string;
  status: EscalationStatus;
  assignedAgentId: string;
  assignedAgentName: string;
}

export interface SendAgentMessageRequest {
  content: string;
}

export interface GetSuggestionsResponse {
  sessionId: string;
  suggestions: AiReplySuggestion[];
}
