import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface KnowledgeDocumentSummary {
  id: number;
  title: string;
  sourceType: string;
  source: string;
  version: number;
  status: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeChunkSummary {
  id: number;
  sequence: number;
  content: string;
  tokenCount: number;
}

export interface KnowledgeDocumentDetail {
  document: KnowledgeDocumentSummary;
  chunks: KnowledgeChunkSummary[];
  embeddingCount: number;
  originalDocumentStorage: string;
}

export interface KnowledgeIngestionJob {
  jobId: string;
  status: string;
  documentId: number | null;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeIngestionResult {
  job: KnowledgeIngestionJob;
  document: KnowledgeDocumentDetail;
}

export interface AnalyticsSnapshot {
  id: number | null;
  periodStart: string;
  periodEnd: string;
  chatVolume: number;
  avgResponseTimeMs: number;
  escalationRate: number;
  satisfactionScore: number | null;
  modelLatencyMs: number;
  fallbackRate: number;
  recordedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminManagerApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listKnowledgeDocuments(): Observable<KnowledgeDocumentSummary[]> {
    return this.http.get<KnowledgeDocumentSummary[]>(`${this.baseUrl}/api/v1/admin/knowledge/documents`);
  }

  getKnowledgeDocument(documentId: number): Observable<KnowledgeDocumentDetail> {
    return this.http.get<KnowledgeDocumentDetail>(`${this.baseUrl}/api/v1/admin/knowledge/documents/${documentId}`);
  }

  uploadKnowledgeDocument(file: File, sourceType: string): Observable<KnowledgeIngestionResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourceType', sourceType);
    return this.http.post<KnowledgeIngestionResult>(`${this.baseUrl}/api/v1/admin/knowledge/documents`, formData);
  }

  replaceKnowledgeDocument(documentId: number, file: File): Observable<KnowledgeIngestionResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<KnowledgeIngestionResult>(
      `${this.baseUrl}/api/v1/admin/knowledge/documents/${documentId}/replace`,
      formData
    );
  }

  getIngestionJob(jobId: string): Observable<KnowledgeIngestionJob> {
    return this.http.get<KnowledgeIngestionJob>(`${this.baseUrl}/api/v1/admin/knowledge/ingestion/${jobId}`);
  }

  getManagerAnalytics(periodStart: string, periodEnd: string): Observable<AnalyticsSnapshot> {
    return this.http.get<AnalyticsSnapshot>(`${this.baseUrl}/api/v1/manager/analytics`, {
      params: { periodStart, periodEnd },
    });
  }

  recordManagerAnalytics(periodStart: string, periodEnd: string): Observable<AnalyticsSnapshot> {
    return this.http.post<AnalyticsSnapshot>(`${this.baseUrl}/api/v1/manager/analytics/snapshots`, null, {
      params: { periodStart, periodEnd },
    });
  }
}
