import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, PagedResponse } from '../../../core/models/api.model';
import { ApiGatewayService } from '../../../core/services/api-gateway.service';
import { ProductDetail, ProductFilter, ProductSummary } from '../models/product.model';

/** Pricing snapshot from GET /products/{id}/pricing (T8.2). */
export interface ProductPricing {
  productId: string;
  currency: string;
  listPrice: number;
  salePrice?: number;
  taxIncluded: boolean;
}

/** Inventory snapshot from GET /products/{id}/inventory (T8.2). */
export interface ProductInventory {
  productId: string;
  availableQuantity: number;
  availability: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  warehouseCode?: string;
}

/** Spec sheet from GET /products/{id}/specifications (T8.2). */
export interface ProductSpecificationsResponse {
  productId: string;
  specifications: { label: string; value: string }[];
}

/**
 * T8.2 — Product API client.
 * Routes all calls through the API gateway (`/api/v1/products`).
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly gateway = inject(ApiGatewayService);

  private url(...segments: (string | number)[]): string {
    return this.gateway.url('products', ...segments);
  }

  /** Paginated catalog listing with optional filters. */
  getProducts(filter: ProductFilter = {}): Observable<PagedResponse<ProductSummary>> {
    let params = new HttpParams();
    if (filter.query) params = params.set('q', filter.query);
    if (filter.category) params = params.set('category', filter.category);
    if (filter.brand) params = params.set('brand', filter.brand);
    if (filter.minPrice !== undefined && filter.minPrice !== null) {
      params = params.set('minPrice', filter.minPrice);
    }
    if (filter.maxPrice !== undefined && filter.maxPrice !== null) {
      params = params.set('maxPrice', filter.maxPrice);
    }
    if (filter.availability) params = params.set('availability', filter.availability);
    if (filter.minRating !== undefined && filter.minRating !== null) {
      params = params.set('minRating', filter.minRating);
    }
    params = params.set('page', filter.page ?? 0);
    params = params.set('pageSize', filter.pageSize ?? 20);

    return this.http.get<PagedResponse<ProductSummary>>(this.url(), { params });
  }

  /** Free-text product search (backend GET /products/search). */
  search(query: string): Observable<ApiResponse<ProductSummary[]>> {
    const params = new HttpParams().set('q', query);
    return this.http.get<ApiResponse<ProductSummary[]>>(this.url('search'), { params });
  }

  getProduct(id: string): Observable<ApiResponse<ProductDetail>> {
    return this.http.get<ApiResponse<ProductDetail>>(this.url(id));
  }

  getPricing(id: string): Observable<ApiResponse<ProductPricing>> {
    return this.http.get<ApiResponse<ProductPricing>>(this.url(id, 'pricing'));
  }

  getSpecifications(id: string): Observable<ApiResponse<ProductSpecificationsResponse>> {
    return this.http.get<ApiResponse<ProductSpecificationsResponse>>(
      this.url(id, 'specifications')
    );
  }

  getInventory(id: string): Observable<ApiResponse<ProductInventory>> {
    return this.http.get<ApiResponse<ProductInventory>>(this.url(id, 'inventory'));
  }
}
