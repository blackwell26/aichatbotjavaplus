/**
 * Phase 6 – Knowledge Portal domain models.
 *
 * Mirrors backend DTOs for:
 *  - KnowledgeDocument (list + detail)
 *  - Document versions (T6.2 / WEB-KB-008)
 *  - Publish workflow statuses (T6.3 / WEB-KB-006)
 *  - Embedding / ingestion status (T6.4 / WEB-KB-005)
 *  - Knowledge-test request / response (T6.5 / WEB-KB-007)
 */

// ── Publish workflow ──────────────────────────────────────────────────────────

export type PublishStatus =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export const PUBLISH_STATUS_LABELS: Record<PublishStatus, string> = {
  DRAFT: 'Draft',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

/** Which transitions are allowed from each status (agent/knowledge-admin). */
export const PUBLISH_TRANSITIONS: Record<PublishStatus, PublishStatus[]> = {
  DRAFT: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['APPROVED', 'DRAFT'],
  APPROVED: ['PUBLISHED', 'UNDER_REVIEW'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: ['DRAFT'],
};

// ── Embedding / ingestion status ─────────────────────────────────────────────

export type EmbeddingStatus =
  | 'PENDING'
  | 'UPLOADED'
  | 'VALIDATING'
  | 'EXTRACTING'
  | 'CHUNKING'
  | 'EMBEDDING'
  | 'INDEXED'
  | 'FAILED';

export const EMBEDDING_STATUS_LABELS: Record<EmbeddingStatus, string> = {
  PENDING: 'Pending',
  UPLOADED: 'Uploaded',
  VALIDATING: 'Validating',
  EXTRACTING: 'Extracting text',
  CHUNKING: 'Chunking',
  EMBEDDING: 'Generating embeddings',
  INDEXED: 'Indexed',
  FAILED: 'Failed',
};

/** Statuses that represent work in progress (show spinner). */
export const EMBEDDING_IN_PROGRESS: EmbeddingStatus[] = [
  'PENDING',
  'UPLOADED',
  'VALIDATING',
  'EXTRACTING',
  'CHUNKING',
  'EMBEDDING',
];

// ── Document type ─────────────────────────────────────────────────────────────

export type DocumentType = 'PDF' | 'WORD' | 'TEXT' | 'HTML' | 'MARKDOWN';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  PDF: 'PDF',
  WORD: 'Word',
  TEXT: 'Plain text',
  HTML: 'HTML',
  MARKDOWN: 'Markdown',
};

// ── Document models ───────────────────────────────────────────────────────────

/** Lightweight document reference used in list views. */
export interface KnowledgeDocumentSummary {
  id: string;
  title: string;
  category: string;
  documentType: DocumentType;
  version: number;
  publishStatus: PublishStatus;
  embeddingStatus: EmbeddingStatus;
  owner: string;
  tags: string[];
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
  effectiveDate?: string;
  expirationDate?: string;
}

/** Full document detail including content and version history. */
export interface KnowledgeDocumentDetail extends KnowledgeDocumentSummary {
  content?: string;          // present for text/markdown/html documents
  source?: string;           // originating URL or reference
  description?: string;
  chunkCount?: number;
  embeddingErrorMessage?: string;
  versions: KnowledgeDocumentVersion[];
}

/** A single historical version entry. */
export interface KnowledgeDocumentVersion {
  versionId: string;
  version: number;
  publishStatus: PublishStatus;
  createdAt: string;
  createdBy: string;
  changeNote?: string;
}

// ── Request / response DTOs ───────────────────────────────────────────────────

export interface UploadDocumentRequest {
  title: string;
  category: string;
  tags?: string;           // comma-separated
  effectiveDate?: string;
  expirationDate?: string;
  source?: string;
  description?: string;
  /* file is passed as FormData */
}

export interface TransitionPublishStatusRequest {
  targetStatus: PublishStatus;
  note?: string;
}

export interface DocumentListFilter {
  search?: string;
  category?: string;
  publishStatus?: PublishStatus | '';
  embeddingStatus?: EmbeddingStatus | '';
  page?: number;
  pageSize?: number;
}

// ── Knowledge-test models (T6.5 / WEB-KB-007) ────────────────────────────────

export interface KnowledgeTestRequest {
  query: string;
  topK?: number;           // max retrieved chunks (default 5)
  modelOverride?: string;  // optional model for this test run
}

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  excerpt: string;
  score: number;           // cosine similarity 0.0 – 1.0
  pageNumber?: number;
}

export interface KnowledgeTestResult {
  query: string;
  answer: string;
  model: string;
  retrievedChunks: RetrievedChunk[];
  responseLatencyMs: number;
  totalChunksSearched: number;
}
