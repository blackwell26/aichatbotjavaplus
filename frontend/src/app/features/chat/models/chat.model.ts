/**
 * Phase 4 – AI Chatbot domain models.
 *
 * Mirrors the backend DTOs:
 *  - ChatSession / ChatSessionStatus
 *  - ChatMessage / MessageSenderType
 *  - Suggested prompts
 *  - Escalation request / response
 */

// ── Enums ─────────────────────────────────────────────────────────────────────

export type ChatSessionStatus = 'OPEN' | 'CLOSED' | 'ESCALATED';

export type MessageSenderType = 'CUSTOMER' | 'AI' | 'AGENT' | 'SYSTEM';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export type EscalationStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type EscalationTrigger = 'CUSTOMER_REQUEST' | 'LOW_CONFIDENCE' | 'SENSITIVE_ISSUE' | 'AGENT_OVERRIDE';

// ── Label maps ────────────────────────────────────────────────────────────────

export const SESSION_STATUS_LABELS: Record<ChatSessionStatus, string> = {
  OPEN: 'Active',
  CLOSED: 'Closed',
  ESCALATED: 'Escalated to agent',
};

export const SENDER_TYPE_LABELS: Record<MessageSenderType, string> = {
  CUSTOMER: 'You',
  AI: 'Assistant',
  AGENT: 'Support agent',
  SYSTEM: 'System',
};

// ── AI Response metadata ───────────────────────────────────────────────────────

export interface AiCitation {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  excerpt: string;
}

export interface AiResponseMetadata {
  model: string;
  intent: string;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number;
  responseLatencyMs: number;
  citations: AiCitation[];
  escalationRecommended: boolean;
  fallback: boolean;
}

// ── Chat message ──────────────────────────────────────────────────────────────

export interface ChatMessage {
  messageId: string;
  sessionId: string;
  senderType: MessageSenderType;
  content: string;
  timestamp: string; // ISO 8601
  /** Only present on AI messages. */
  aiMetadata?: AiResponseMetadata;
  /** True while the AI response is still streaming in. */
  streaming?: boolean;
}

// ── Chat session ──────────────────────────────────────────────────────────────

export interface ChatSession {
  sessionId: string;
  customerId: string;
  status: ChatSessionStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  closedAt?: string;
  messages: ChatMessage[];
}

/** Lightweight session reference used in history lists. */
export interface ChatSessionSummary {
  sessionId: string;
  status: ChatSessionStatus;
  createdAt: string;
  updatedAt: string;
  previewText: string; // first message excerpt
  messageCount: number;
}

// ── Suggested prompts ─────────────────────────────────────────────────────────

export interface ChatSuggestedPrompt {
  id: string;
  label: string;
  text: string;
  category?: string;
}

export const DEFAULT_SUGGESTED_PROMPTS: ChatSuggestedPrompt[] = [
  { id: 'sp-1', label: 'Order status', text: 'What is the status of my last order?' },
  { id: 'sp-2', label: 'Return request', text: 'How do I return an item?' },
  { id: 'sp-3', label: 'Shipping info', text: 'When will my order arrive?' },
  { id: 'sp-4', label: 'Payment issue', text: 'I have a question about my payment.' },
  { id: 'sp-5', label: 'Product info', text: 'Can you help me find a product?' },
  { id: 'sp-6', label: 'Talk to agent', text: 'I would like to speak with a human agent.' },
];

// ── REST request / response DTOs ──────────────────────────────────────────────

export interface CreateSessionRequest {
  /** Optional context hint, e.g. a product ID or order number the user is viewing. */
  contextHint?: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  status: ChatSessionStatus;
  createdAt: string;
  suggestedPrompts: ChatSuggestedPrompt[];
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
}

export interface ChatHistoryResponse {
  sessionId: string;
  status: ChatSessionStatus;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface CloseSessionResponse {
  sessionId: string;
  status: ChatSessionStatus;
  closedAt: string;
}

// ── Escalation ────────────────────────────────────────────────────────────────

export interface EscalationRequest {
  trigger: EscalationTrigger;
  /** Optional free-text reason provided by the customer. */
  reason?: string;
}

export interface EscalationResponse {
  escalationId: string;
  sessionId: string;
  status: EscalationStatus;
  ticketNumber: string;
  message: string;
  estimatedWaitMinutes?: number;
}

// ── WebSocket / SSE message types ─────────────────────────────────────────────

/** Inbound message shape sent over STOMP to /app/chat.send */
export interface WsChatSend {
  sessionId: string;
  content: string;
}

/** Outbound message received from /topic/chat.sessions.{sessionId} */
export interface WsChatEvent {
  eventType: 'MESSAGE' | 'STREAM_CHUNK' | 'STREAM_DONE' | 'SESSION_CLOSED' | 'ESCALATED' | 'ERROR';
  sessionId: string;
  message?: ChatMessage;
  /** Partial text chunk for streaming events. */
  chunk?: string;
  messageId?: string;
  error?: string;
}
