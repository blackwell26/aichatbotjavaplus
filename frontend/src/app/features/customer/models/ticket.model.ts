/** Support ticket domain models. */

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  WAITING_CUSTOMER: 'Waiting on you',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export interface TicketComment {
  id: string;
  authorName: string;
  authorRole: 'CUSTOMER' | 'AGENT';
  body: string;
  createdAt: string; // ISO 8601
  internal: boolean;
}

export interface TicketSummary {
  id: string;
  ticketNumber: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  orderId?: string;
}

export interface TicketDetail extends TicketSummary {
  description: string;
  resolution?: string;
  comments: TicketComment[];
  relatedOrderId?: string;
}

export interface AddCommentRequest {
  body: string;
}

/** Return request models. */
export type ReturnReason =
  | 'DEFECTIVE'
  | 'NOT_AS_DESCRIBED'
  | 'WRONG_ITEM'
  | 'CHANGED_MIND'
  | 'DAMAGED_IN_SHIPPING'
  | 'OTHER';

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  DEFECTIVE: 'Defective or not working',
  NOT_AS_DESCRIBED: 'Not as described',
  WRONG_ITEM: 'Wrong item received',
  CHANGED_MIND: 'Changed my mind',
  DAMAGED_IN_SHIPPING: 'Damaged in shipping',
  OTHER: 'Other',
};

export interface ReturnRequestPayload {
  orderItemId: string;
  reason: ReturnReason;
  quantity: number;
  comments?: string;
}

export interface ReturnRequestResult {
  returnId: string;
  ticketNumber: string;
  message: string;
}
