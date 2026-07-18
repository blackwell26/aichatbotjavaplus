/**
 * Phase 6 – Knowledge Portal API service.
 *
 * Covers all REST calls for:
 *  - Document listing with filters            (T6.1)
 *  - Document upload (multipart/form-data)    (T6.1 / WEB-KB-003)
 *  - Single document fetch                    (T6.2)
 *  - Publish-workflow transitions             (T6.3 / WEB-KB-006)
 *  - Embedding-status polling                 (T6.4 / WEB-KB-005)
 *  - Version history                          (T6.2 / WEB-KB-008)
 *  - Archive                                  (T6.9 / WEB-KB-009)
 *  - Knowledge test                           (T6.5 / WEB-KB-007)
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models/api.model';
import {
  DocumentListFilter,
  KnowledgeDocumentDetail,
  KnowledgeDocumentSummary,
  KnowledgeDocumentVersion,
  KnowledgeTestRequest,
  KnowledgeTestResult,
  TransitionPublishStatusRequest,
  UploadDocumentRequest,
} from '../models/knowledge.model';

@Injectable({ providedIn: 'root' })
export class KnowledgeService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/knowledge/documents`;

  // ── Document listing ──────────────────────────────────────────────────────

  /**
   * GET /api/v1/knowledge/documents
   * Returns a paginated, filtered list of documents.
   */
  getDocuments(
    filter: DocumentListFilter = {}
  ): Observable<PagedResponse<KnowledgeDocumentSummary>> {
    let params = new HttpParams()
      .set('page', filter.page ?? 0)
      .set('pageSize', filter.pageSize ?? 20);

    if (filter.search) params = params.set('search', filter.search);
    if (filter.category) params = params.set('category', filter.category);
    if (filter.publishStatus) params = params.set('publishStatus', filter.publishStatus);
    if (filter.embeddingStatus) params = params.set('embeddingStatus', filter.embeddingStatus);

    return this.http.get<PagedResponse<KnowledgeDocumentSummary>>(this.base, { params });
  }

  // ── Single document ───────────────────────────────────────────────────────

  /**
   * GET /api/v1/knowledge/documents/{id}
   */
  getDocument(id: string): Observable<ApiResponse<KnowledgeDocumentDetail>> {
    return this.http.get<ApiResponse<KnowledgeDocumentDetail>>(`${this.base}/${id}`);
  }

  // ── Upload (T6.1 / WEB-KB-003) ────────────────────────────────────────────

  /**
   * POST /api/v1/knowledge/documents  (multipart/form-data)
   * Uploads a file together with document metadata.
   */
  uploadDocument(
    file: File,
    metadata: UploadDocumentRequest
  ): Observable<ApiResponse<KnowledgeDocumentDetail>> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('title', metadata.title);
    form.append('category', metadata.category);
    if (metadata.tags) form.append('tags', metadata.tags);
    if (metadata.effectiveDate) form.append('effectiveDate', metadata.effectiveDate);
    if (metadata.expirationDate) form.append('expirationDate', metadata.expirationDate);
    if (metadata.source) form.append('source', metadata.source);
    if (metadata.description) form.append('description', metadata.description);

    return this.http.post<ApiResponse<KnowledgeDocumentDetail>>(this.base, form);
  }

  // ── Publish workflow (T6.3 / WEB-KB-006) ─────────────────────────────────

  /**
   * POST /api/v1/knowledge/documents/{id}/transitions
   * Moves a document to a new publish status.
   */
  transitionStatus(
    id: string,
    payload: TransitionPublishStatusRequest
  ): Observable<ApiResponse<KnowledgeDocumentDetail>> {
    return this.http.post<ApiResponse<KnowledgeDocumentDetail>>(
      `${this.base}/${id}/transitions`,
      payload
    );
  }

  // ── Embedding status poll (T6.4) ──────────────────────────────────────────

  /**
   * GET /api/v1/knowledge/documents/{id}/embedding-status
   * Returns only the current embedding status (lightweight poll endpoint).
   */
  getEmbeddingStatus(
    id: string
  ): Observable<ApiResponse<{ embeddingStatus: string; errorMessage?: string }>> {
    return this.http.get<ApiResponse<{ embeddingStatus: string; errorMessage?: string }>>(
      `${this.base}/${id}/embedding-status`
    );
  }

  /**
   * POST /api/v1/knowledge/documents/{id}/reindex
   * Triggers re-indexing of a document whose embedding failed.
   */
  reindex(id: string): Observable<ApiResponse<KnowledgeDocumentDetail>> {
    return this.http.post<ApiResponse<KnowledgeDocumentDetail>>(
      `${this.base}/${id}/reindex`,
      {}
    );
  }

  // ── Versioning (T6.2 / WEB-KB-008) ───────────────────────────────────────

  /**
   * GET /api/v1/knowledge/documents/{id}/versions
   */
  getVersions(id: string): Observable<ApiResponse<KnowledgeDocumentVersion[]>> {
    return this.http.get<ApiResponse<KnowledgeDocumentVersion[]>>(
      `${this.base}/${id}/versions`
    );
  }

  /**
   * GET /api/v1/knowledge/documents/{id}/versions/{versionId}
   * Returns the full document snapshot for a specific version.
   */
  getVersion(
    id: string,
    versionId: string
  ): Observable<ApiResponse<KnowledgeDocumentDetail>> {
    return this.http.get<ApiResponse<KnowledgeDocumentDetail>>(
      `${this.base}/${id}/versions/${versionId}`
    );
  }

  // ── Archive (T6.9 / WEB-KB-009) ──────────────────────────────────────────

  /**
   * POST /api/v1/knowledge/documents/{id}/archive
   * Convenience alias for transitionStatus(..., 'ARCHIVED').
   */
  archive(id: string, note?: string): Observable<ApiResponse<KnowledgeDocumentDetail>> {
    return this.transitionStatus(id, { targetStatus: 'ARCHIVED', note });
  }

  // ── Knowledge test (T6.5 / WEB-KB-007) ───────────────────────────────────

  /**
   * POST /api/v1/knowledge/test
   */
  testQuery(payload: KnowledgeTestRequest): Observable<ApiResponse<KnowledgeTestResult>> {
    return this.http.post<ApiResponse<KnowledgeTestResult>>(
      `${environment.apiBaseUrl}/api/v1/knowledge/test`,
      payload
    );
  }
}
