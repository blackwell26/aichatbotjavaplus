/**
 * Phase 7 – Administration Portal API service.
 *
 * Covers all REST calls needed by the admin portal:
 *  T7.1  User management        (WEB-ADM-001)
 *  T7.2  Role management        (WEB-ADM-001)
 *  T7.3  Prompt management      (WEB-ADM-003)
 *  T7.4  AI model configuration (WEB-ADM-002)
 *  T7.5  Feature toggles        (WEB-ADM-004)
 *  T7.6  Audit logs             (WEB-ADM-006)
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models/api.model';
import { Role } from '../../../core/models/user.model';
import {
  AdminUser,
  AdminUserSummary,
  AiModelConfig,
  AssignRolesRequest,
  AuditLogEntry,
  AuditLogFilter,
  CreatePromptVersionRequest,
  CreateUserRequest,
  FeatureKey,
  FeatureToggle,
  OllamaModelInfo,
  PromptListFilter,
  PromptVersionDetail,
  PromptVersionSummary,
  RoleSummary,
  UpdateAiModelConfigRequest,
  UpdateFeatureToggleRequest,
  UpdatePromptVersionRequest,
  UpdateUserRequest,
  UserListFilter,
} from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  private readonly base = `${environment.apiBaseUrl}/api/v1/admin`;
  private readonly usersBase = `${this.base}/users`;
  private readonly promptsBase = `${this.base}/prompts`;
  private readonly configBase = `${this.base}/config`;
  private readonly featuresBase = `${this.base}/features`;
  private readonly auditBase = `${this.base}/audit-logs`;

  // ── T7.1  User management ─────────────────────────────────────────────────

  /**
   * GET /api/v1/admin/users
   * Returns a paginated list of users with optional filters.
   */
  listUsers(filter: UserListFilter = {}): Observable<PagedResponse<AdminUserSummary>> {
    let params = new HttpParams()
      .set('page', filter.page ?? 0)
      .set('pageSize', filter.pageSize ?? 20);

    if (filter.search) {
      params = params.set('search', filter.search);
    }
    if (filter.role) {
      params = params.set('role', filter.role);
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }

    return this.http.get<PagedResponse<AdminUserSummary>>(this.usersBase, { params });
  }

  /**
   * GET /api/v1/admin/users/{userId}
   * Returns the full admin view of a user account.
   */
  getUser(userId: string): Observable<ApiResponse<AdminUser>> {
    return this.http.get<ApiResponse<AdminUser>>(`${this.usersBase}/${userId}`);
  }

  /**
   * POST /api/v1/admin/users
   * Creates a new user account.
   */
  createUser(payload: CreateUserRequest): Observable<ApiResponse<AdminUser>> {
    return this.http.post<ApiResponse<AdminUser>>(this.usersBase, payload);
  }

  /**
   * PATCH /api/v1/admin/users/{userId}
   * Updates profile fields or account status.
   */
  updateUser(
    userId: string,
    payload: UpdateUserRequest
  ): Observable<ApiResponse<AdminUser>> {
    return this.http.patch<ApiResponse<AdminUser>>(
      `${this.usersBase}/${userId}`,
      payload
    );
  }

  /**
   * POST /api/v1/admin/users/{userId}/deactivate
   * Deactivates a user account.
   */
  deactivateUser(userId: string): Observable<ApiResponse<AdminUser>> {
    return this.http.post<ApiResponse<AdminUser>>(
      `${this.usersBase}/${userId}/deactivate`,
      {}
    );
  }

  /**
   * POST /api/v1/admin/users/{userId}/activate
   * Re-activates a previously deactivated user account.
   */
  activateUser(userId: string): Observable<ApiResponse<AdminUser>> {
    return this.http.post<ApiResponse<AdminUser>>(
      `${this.usersBase}/${userId}/activate`,
      {}
    );
  }

  // ── T7.2  Role management ─────────────────────────────────────────────────

  /**
   * GET /api/v1/admin/roles/summary
   * Returns per-role user counts and descriptions.
   */
  listRoles(): Observable<ApiResponse<RoleSummary[]>> {
    return this.http.get<ApiResponse<RoleSummary[]>>(`${this.base}/roles/summary`);
  }

  /**
   * GET /api/v1/admin/roles/{role}/users
   * Returns users that currently hold the given role.
   */
  getUsersByRole(
    role: Role,
    page = 0,
    pageSize = 20
  ): Observable<PagedResponse<AdminUserSummary>> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<PagedResponse<AdminUserSummary>>(
      `${this.base}/roles/${role}/users`,
      { params }
    );
  }

  /**
   * PUT /api/v1/admin/users/{userId}/roles
   * Replaces the complete role set for a user.
   */
  assignRoles(
    userId: string,
    payload: AssignRolesRequest
  ): Observable<ApiResponse<AdminUser>> {
    return this.http.put<ApiResponse<AdminUser>>(
      `${this.usersBase}/${userId}/roles`,
      payload
    );
  }

  /**
   * DELETE /api/v1/admin/users/{userId}/roles/{role}
   * Removes a single role from a user.
   */
  revokeRole(userId: string, role: Role): Observable<ApiResponse<AdminUser>> {
    return this.http.delete<ApiResponse<AdminUser>>(
      `${this.usersBase}/${userId}/roles/${role}`
    );
  }

  // ── T7.3  Prompt management ───────────────────────────────────────────────

  /**
   * GET /api/v1/admin/prompts
   * Returns a paginated list of prompt versions.
   */
  listPrompts(filter: PromptListFilter = {}): Observable<PagedResponse<PromptVersionSummary>> {
    let params = new HttpParams()
      .set('page', filter.page ?? 0)
      .set('pageSize', filter.pageSize ?? 20);

    if (filter.search) {
      params = params.set('search', filter.search);
    }
    if (filter.promptType) {
      params = params.set('promptType', filter.promptType);
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }

    return this.http.get<PagedResponse<PromptVersionSummary>>(this.promptsBase, { params });
  }

  /**
   * GET /api/v1/admin/prompts/{promptId}
   * Returns a prompt version with full template text and history.
   */
  getPrompt(promptId: string): Observable<ApiResponse<PromptVersionDetail>> {
    return this.http.get<ApiResponse<PromptVersionDetail>>(
      `${this.promptsBase}/${promptId}`
    );
  }

  /**
   * POST /api/v1/admin/prompts
   * Creates a new prompt version in DRAFT status.
   */
  createPrompt(
    payload: CreatePromptVersionRequest
  ): Observable<ApiResponse<PromptVersionDetail>> {
    return this.http.post<ApiResponse<PromptVersionDetail>>(this.promptsBase, payload);
  }

  /**
   * PATCH /api/v1/admin/prompts/{promptId}
   * Updates the template text or description of a draft prompt.
   */
  updatePrompt(
    promptId: string,
    payload: UpdatePromptVersionRequest
  ): Observable<ApiResponse<PromptVersionDetail>> {
    return this.http.patch<ApiResponse<PromptVersionDetail>>(
      `${this.promptsBase}/${promptId}`,
      payload
    );
  }

  /**
   * POST /api/v1/admin/prompts/{promptId}/activate
   * Activates a prompt version, deactivating any currently active version
   * of the same type.
   */
  activatePrompt(promptId: string): Observable<ApiResponse<PromptVersionDetail>> {
    return this.http.post<ApiResponse<PromptVersionDetail>>(
      `${this.promptsBase}/${promptId}/activate`,
      {}
    );
  }

  /**
   * POST /api/v1/admin/prompts/{promptId}/rollback
   * Rolls back to this prompt version, making it the active version.
   */
  rollbackPrompt(promptId: string): Observable<ApiResponse<PromptVersionDetail>> {
    return this.http.post<ApiResponse<PromptVersionDetail>>(
      `${this.promptsBase}/${promptId}/rollback`,
      {}
    );
  }

  // ── T7.4  AI model configuration ─────────────────────────────────────────

  /**
   * GET /api/v1/admin/config/ai-model
   * Returns the current AI model configuration.
   */
  getAiModelConfig(): Observable<ApiResponse<AiModelConfig>> {
    return this.http.get<ApiResponse<AiModelConfig>>(
      `${this.configBase}/ai-model`
    );
  }

  /**
   * PUT /api/v1/admin/config/ai-model
   * Replaces the AI model configuration.
   */
  updateAiModelConfig(
    payload: UpdateAiModelConfigRequest
  ): Observable<ApiResponse<AiModelConfig>> {
    return this.http.put<ApiResponse<AiModelConfig>>(
      `${this.configBase}/ai-model`,
      payload
    );
  }

  /**
   * GET /api/v1/admin/config/ai-model/available-models
   * Returns models available on the configured Ollama endpoint.
   */
  listAvailableModels(): Observable<ApiResponse<OllamaModelInfo[]>> {
    return this.http.get<ApiResponse<OllamaModelInfo[]>>(
      `${this.configBase}/ai-model/available-models`
    );
  }

  // ── T7.5  Feature toggles ─────────────────────────────────────────────────

  /**
   * GET /api/v1/admin/features
   * Returns all feature toggles and their current state.
   */
  listFeatureToggles(): Observable<ApiResponse<FeatureToggle[]>> {
    return this.http.get<ApiResponse<FeatureToggle[]>>(this.featuresBase);
  }

  /**
   * PATCH /api/v1/admin/features/{featureKey}
   * Enables or disables a single feature.
   */
  updateFeatureToggle(
    featureKey: FeatureKey,
    payload: UpdateFeatureToggleRequest
  ): Observable<ApiResponse<FeatureToggle>> {
    return this.http.patch<ApiResponse<FeatureToggle>>(
      `${this.featuresBase}/${featureKey}`,
      payload
    );
  }

  // ── T7.6  Audit logs ──────────────────────────────────────────────────────

  /**
   * GET /api/v1/admin/audit-logs
   * Returns a paginated, filterable list of audit log entries.
   */
  listAuditLogs(filter: AuditLogFilter = {}): Observable<PagedResponse<AuditLogEntry>> {
    let params = new HttpParams()
      .set('page', filter.page ?? 0)
      .set('pageSize', filter.pageSize ?? 50);

    if (filter.search) {
      params = params.set('search', filter.search);
    }
    if (filter.eventType) {
      params = params.set('eventType', filter.eventType);
    }
    if (filter.severity) {
      params = params.set('severity', filter.severity);
    }
    if (filter.actorEmail) {
      params = params.set('actorEmail', filter.actorEmail);
    }
    if (filter.dateFrom) {
      params = params.set('dateFrom', filter.dateFrom);
    }
    if (filter.dateTo) {
      params = params.set('dateTo', filter.dateTo);
    }

    return this.http.get<PagedResponse<AuditLogEntry>>(this.auditBase, { params });
  }

  /**
   * GET /api/v1/admin/audit-logs/{logId}
   * Returns a single audit log entry with full details.
   */
  getAuditLogEntry(logId: string): Observable<ApiResponse<AuditLogEntry>> {
    return this.http.get<ApiResponse<AuditLogEntry>>(
      `${this.auditBase}/${logId}`
    );
  }
}
