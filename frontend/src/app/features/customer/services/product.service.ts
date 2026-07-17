import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models/api.model';
import { ProductDetail, ProductFilter, ProductSummary } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/products`;

  getProducts(filter: ProductFilter = {}): Observable<PagedResponse<ProductSummary>> {
    let params = new HttpParams();
    if (filter.query) params = params.set('q', filter.query);
    if (filter.category) params = params.set('category', filter.category);
    if (filter.brand) params = params.set('brand', filter.brand);
    if (filter.minPrice != null) params = params.set('minPrice', filter.minPrice);
    if (filter.maxPrice != null) params = params.set('maxPrice', filter.maxPrice);
    if (filter.availability) params = params.set('availability', filter.availability);
    if (filter.minRating != null) params = params.set('minRating', filter.minRating);
    params = params.set('page', filter.page ?? 0);
    params = params.set('pageSize', filter.pageSize ?? 20);

    return this.http.get<PagedResponse<ProductSummary>>(this.base, { params });
  }

  getProduct(id: string): Observable<ApiResponse<ProductDetail>> {
    return this.http.get<ApiResponse<ProductDetail>>(`${this.base}/${id}`);
  }
}
