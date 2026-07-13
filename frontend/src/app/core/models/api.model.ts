/** Standard API response envelope. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  correlationId?: string;
}

/** Standard paginated API response. */
export interface PagedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  correlationId?: string;
}

/** Standard API error payload. */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  correlationId?: string;
}
