/**
 * Phase 7 – Administration Portal domain models.
 *
 * Covers:
 *  T7.1  User management        (WEB-ADM-001)
 *  T7.2  Role management        (WEB-ADM-001)
 *  T7.3  Prompt management      (WEB-ADM-003)
 *  T7.4  AI model configuration (WEB-ADM-002)
 *  T7.5  Feature toggles        (WEB-ADM-004)
 *  T7.6  Audit logs             (WEB-ADM-006)
 */

import { Role } from '../../../core/models/user.model';

// ── T7.1 / T7.2  User & role management ──────────────────────────────────────

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
  PENDING: 'Pending',
};

/** Full admin view of a user account. */
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  roles: Role[];
  status: AccountStatus;
  createdAt: string;   // ISO 8601
  updatedAt: string;
  lastLoginAt?: string;
  phoneNumber?: string;
  /** true when the account's email has been verified */
  emailVerified: boolean;
}

/** Lightweight row used in list views. */
export interface AdminUserSummary {
  id: string;
  email: string;
  displayName: string;
  roles: Role[];
  status: AccountStatus;
  createdAt: string;
  lastLoginAt?: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roles: Role[];
  phoneNumber?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  status?: AccountStatus;
}

export interface AssignRolesRequest {
  roles: Role[];
}

export interface UserListFilter {
  search?: string;
  role?: Role | '';
  status?: AccountStatus | '';
  page?: number;
  pageSize?: number;
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.Customer]: 'Customer',
  [Role.Agent]: 'Agent',
  [Role.Manager]: 'Manager',
  [Role.KnowledgeAdmin]: 'Knowledge Admin',
  [Role.SystemAdmin]: 'System Admin',
};

/** Per-role statistics shown on the Role Management page (T7.2). */
export interface RoleSummary {
  role: Role;
  label: string;
  userCount: number;
  description: string;
}

// ── T7.3  Prompt management ───────────────────────────────────────────────────

export type PromptStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export const PROMPT_STATUS_LABELS: Record<PromptStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ARCHIVED: 'Archived',
};

export type PromptType =
  | 'SYSTEM'
  | 'GREETING'
  | 'ESCALATION'
  | 'PRODUCT_QUERY'
  | 'ORDER_QUERY'
  | 'FALLBACK'
  | 'CUSTOM';

export const PROMPT_TYPE_LABELS: Record<PromptType, string> = {
  SYSTEM: 'System',
  GREETING: 'Greeting',
  ESCALATION: 'Escalation',
  PRODUCT_QUERY: 'Product query',
  ORDER_QUERY: 'Order query',
  FALLBACK: 'Fallback',
  CUSTOM: 'Custom',
};

/** Summary row for the prompt list. */
export interface PromptVersionSummary {
  id: string;
  name: string;
  promptType: PromptType;
  version: number;
  status: PromptStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** True when this version is currently active. */
  active: boolean;
}

/** Full prompt including template text and change history. */
export interface PromptVersionDetail extends PromptVersionSummary {
  templateText: string;
  description?: string;
  changeNote?: string;
  history: PromptHistoryEntry[];
}

export interface PromptHistoryEntry {
  historyId: string;
  version: number;
  status: PromptStatus;
  changedBy: string;
  changedAt: string;
  changeNote?: string;
}

export interface CreatePromptVersionRequest {
  name: string;
  promptType: PromptType;
  templateText: string;
  description?: string;
  changeNote?: string;
}

export interface UpdatePromptVersionRequest {
  templateText?: string;
  description?: string;
  changeNote?: string;
}

export interface PromptListFilter {
  search?: string;
  promptType?: PromptType | '';
  status?: PromptStatus | '';
  page?: number;
  pageSize?: number;
}

// ── T7.4  AI model configuration ─────────────────────────────────────────────

export interface AiModelConfig {
  id: string;
  ollamaEndpoint: string;
  defaultModel: string;
  embeddingModel: string;
  fallbackModel?: string;
  /** Request timeout in seconds. */
  timeoutSeconds: number;
  /** Maximum context window size in tokens. */
  maxContextTokens: number;
  /** Sampling temperature (0.0 – 2.0). */
  temperature: number;
  /** Maximum tokens to generate per response. */
  maxGeneratedTokens: number;
  /** True when streaming responses are enabled. */
  streamingEnabled: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface UpdateAiModelConfigRequest {
  ollamaEndpoint: string;
  defaultModel: string;
  embeddingModel: string;
  fallbackModel?: string;
  timeoutSeconds: number;
  maxContextTokens: number;
  temperature: number;
  maxGeneratedTokens: number;
  streamingEnabled: boolean;
}

/** Available Ollama model pulled from the endpoint. */
export interface OllamaModelInfo {
  name: string;
  digest: string;
  size: number;
  modifiedAt: string;
}

// ── T7.5  Feature toggles ─────────────────────────────────────────────────────

export type FeatureKey =
  | 'PRODUCT_ASSISTANCE'
  | 'ORDER_TRACKING'
  | 'RETURN_ASSISTANCE'
  | 'REFUND_ASSISTANCE'
  | 'ATTACHMENTS'
  | 'HUMAN_ESCALATION'
  | 'SUGGESTED_PROMPTS'
  | 'RESPONSE_STREAMING'
  | 'CONVERSATION_HISTORY';

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  PRODUCT_ASSISTANCE: 'Product assistance',
  ORDER_TRACKING: 'Order tracking',
  RETURN_ASSISTANCE: 'Return assistance',
  REFUND_ASSISTANCE: 'Refund assistance',
  ATTACHMENTS: 'Attachments',
  HUMAN_ESCALATION: 'Human escalation',
  SUGGESTED_PROMPTS: 'Suggested prompts',
  RESPONSE_STREAMING: 'Response streaming',
  CONVERSATION_HISTORY: 'Conversation history',
};

export const FEATURE_DESCRIPTIONS: Record<FeatureKey, string> = {
  PRODUCT_ASSISTANCE: 'Allow chatbot to answer product questions and provide recommendations.',
  ORDER_TRACKING: 'Allow chatbot to look up and report on order statuses.',
  RETURN_ASSISTANCE: 'Allow chatbot to initiate and guide return requests.',
  REFUND_ASSISTANCE: 'Allow chatbot to provide refund status and initiate refund requests.',
  ATTACHMENTS: 'Allow customers to upload files in the chat window.',
  HUMAN_ESCALATION: 'Allow customers to request transfer to a human agent.',
  SUGGESTED_PROMPTS: 'Show contextual suggested questions in the chat window.',
  RESPONSE_STREAMING: 'Stream chatbot responses token-by-token instead of waiting for completion.',
  CONVERSATION_HISTORY: 'Allow authenticated customers to view their previous conversations.',
};

export interface FeatureToggle {
  key: FeatureKey;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
  description?: string;
}

export interface UpdateFeatureToggleRequest {
  enabled: boolean;
}

// ── T7.6  Audit logs ─────────────────────────────────────────────────────────

export type AuditEventType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_FAILED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DEACTIVATED'
  | 'ROLE_ASSIGNED'
  | 'ROLE_REVOKED'
  | 'CONFIG_CHANGED'
  | 'PROMPT_CREATED'
  | 'PROMPT_ACTIVATED'
  | 'PROMPT_ROLLBACK'
  | 'MODEL_CHANGED'
  | 'FEATURE_TOGGLED'
  | 'KNOWLEDGE_PUBLISHED'
  | 'KNOWLEDGE_ARCHIVED'
  | 'ADMIN_DATA_ACCESS';

export const AUDIT_EVENT_LABELS: Record<AuditEventType, string> = {
  AUTH_LOGIN: 'Login',
  AUTH_LOGOUT: 'Logout',
  AUTH_FAILED: 'Failed login',
  USER_CREATED: 'User created',
  USER_UPDATED: 'User updated',
  USER_DEACTIVATED: 'User deactivated',
  ROLE_ASSIGNED: 'Role assigned',
  ROLE_REVOKED: 'Role revoked',
  CONFIG_CHANGED: 'Config changed',
  PROMPT_CREATED: 'Prompt created',
  PROMPT_ACTIVATED: 'Prompt activated',
  PROMPT_ROLLBACK: 'Prompt rolled back',
  MODEL_CHANGED: 'Model changed',
  FEATURE_TOGGLED: 'Feature toggled',
  KNOWLEDGE_PUBLISHED: 'Knowledge published',
  KNOWLEDGE_ARCHIVED: 'Knowledge archived',
  ADMIN_DATA_ACCESS: 'Admin data access',
};

export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR';

export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  actorId: string;
  actorEmail: string;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  targetDescription?: string;
  /** JSON string of changed fields (before/after). */
  changeDetails?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  occurredAt: string;  // ISO 8601
}

export interface AuditLogFilter {
  search?: string;
  eventType?: AuditEventType | '';
  severity?: AuditSeverity | '';
  actorEmail?: string;
  dateFrom?: string;  // ISO 8601 date
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
