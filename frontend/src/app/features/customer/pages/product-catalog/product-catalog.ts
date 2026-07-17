import {
  Component,
  OnInit,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import {
  PRODUCT_AVAILABILITY_LABELS,
  ProductAvailability,
  ProductFilter,
  ProductSummary,
} from '../../models/product.model';
import { PagedResponse } from '../../../../core/models/api.model';

const CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'books', label: 'Books' },
  { value: 'home-office', label: 'Home Office' },
  { value: 'service-parts', label: 'Service Parts' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating_desc', label: 'Top rated' },
];

@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatChipsModule,
    MatDividerModule,
  ],
  template: `
    <section class="catalog-page" aria-labelledby="catalog-title">
      <!-- Page heading -->
      <header class="page-header">
        <div>
          <p class="breadcrumb">
            <a routerLink="/home">Home</a> / Products
          </p>
          <h1 id="catalog-title">Product Catalog</h1>
        </div>

        <!-- Cart indicator -->
        <a
          routerLink="/home/cart"
          class="cart-link"
          [attr.aria-label]="'Cart (' + cartCount() + ' items)'"
        >
          <mat-icon aria-hidden="true">shopping_cart</mat-icon>
          @if (cartCount() > 0) {
            <span class="cart-badge" aria-hidden="true">{{ cartCount() }}</span>
          }
        </a>
      </header>

      <!-- Search bar -->
      <div class="search-row" role="search" aria-label="Product search">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search products</mat-label>
          <mat-icon matPrefix aria-hidden="true">search</mat-icon>
          <input
            matInput
            [formControl]="searchCtrl"
            placeholder="Name, SKU, brand, or keyword"
            aria-label="Search products"
          />
          @if (searchCtrl.value) {
            <button
              matSuffix
              mat-icon-button
              aria-label="Clear search"
              (click)="searchCtrl.setValue('')"
            >
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="sort-field">
          <mat-label>Sort by</mat-label>
          <mat-select [formControl]="sortCtrl" aria-label="Sort products">
            @for (opt of sortOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Active filters chips -->
      @if (activeFilters().length > 0) {
        <div class="active-filters" role="group" aria-label="Active filters">
          @for (f of activeFilters(); track f.key) {
            <mat-chip-row (removed)="removeFilter(f.key)" removable>
              {{ f.label }}
              <mat-icon matChipRemove aria-label="Remove {{ f.label }} filter">cancel</mat-icon>
            </mat-chip-row>
          }
          <button mat-button class="clear-all" (click)="clearAllFilters()">
            Clear all
          </button>
        </div>
      }

      <div class="layout">
        <!-- ── Filter sidebar ──────────────────────────────── -->
        <aside class="filters-panel" aria-label="Filter products">
          <p class="filter-heading">Filters</p>

          <!-- Category -->
          <div class="filter-group">
            <p class="filter-label">Category</p>
            @for (cat of categories; track cat.value) {
              <mat-checkbox
                [checked]="filterForm.controls.category.value === cat.value"
                (change)="filterForm.controls.category.setValue(cat.value)"
              >
                {{ cat.label }}
              </mat-checkbox>
            }
          </div>

          <mat-divider />

          <!-- Price range -->
          <div class="filter-group">
            <p class="filter-label">Price range</p>
            <div class="price-row">
              <mat-form-field appearance="outline" class="price-field">
                <mat-label>Min</mat-label>
                <input matInput type="number" min="0" [formControl]="filterForm.controls.minPrice" />
                <span matTextPrefix>$</span>
              </mat-form-field>
              <span class="price-sep">–</span>
              <mat-form-field appearance="outline" class="price-field">
                <mat-label>Max</mat-label>
                <input matInput type="number" min="0" [formControl]="filterForm.controls.maxPrice" />
                <span matTextPrefix>$</span>
              </mat-form-field>
            </div>
          </div>

          <mat-divider />

          <!-- Availability -->
          <div class="filter-group">
            <p class="filter-label">Availability</p>
            @for (av of availabilityOptions; track av.value) {
              <mat-checkbox
                [checked]="filterForm.controls.availability.value === av.value"
                (change)="filterForm.controls.availability.setValue(av.value)"
              >
                {{ av.label }}
              </mat-checkbox>
            }
          </div>

          <mat-divider />

          <!-- Min rating -->
          <div class="filter-group">
            <p class="filter-label">Minimum rating</p>
            @for (r of [4, 3, 2]; track r) {
              <mat-checkbox
                [checked]="filterForm.controls.minRating.value === r"
                (change)="filterForm.controls.minRating.setValue(r)"
              >
                {{ r }}+ stars
              </mat-checkbox>
            }
          </div>

          <button mat-button class="reset-btn" (click)="clearAllFilters()">
            Reset filters
          </button>
        </aside>

        <!-- ── Product grid ─────────────────────────────────── -->
        <main class="products-area">
          <!-- Results summary -->
          <p class="results-summary" aria-live="polite">
            @if (loading()) {
              Loading products…
            } @else {
              @if (total() > 0) {
                Showing {{ products().length }} of {{ total() }} products
              } @else {
                No products found
              }
            }
          </p>

          @if (loading()) {
            <div class="loading-center">
              <mat-spinner diameter="48" aria-label="Loading products" />
            </div>
          } @else if (products().length === 0) {
            <div class="empty-state">
              <mat-icon class="empty-icon" aria-hidden="true">inventory_2</mat-icon>
              <h2>No products found</h2>
              <p>Try adjusting your search or filters.</p>
              <button mat-raised-button color="primary" (click)="clearAllFilters()">
                Clear filters
              </button>
            </div>
          } @else {
            <div class="product-grid" role="list">
              @for (product of products(); track product.id) {
                <article class="product-card" role="listitem">
                  <!-- Thumbnail placeholder -->
                  <div class="product-thumbnail" aria-hidden="true">
                    @if (product.thumbnailUrl) {
                      <img [src]="product.thumbnailUrl" [alt]="product.name" loading="lazy" />
                    } @else {
                      <mat-icon>inventory_2</mat-icon>
                    }
                  </div>

                  <div class="product-info">
                    <p class="product-category">{{ product.category }}</p>
                    <h3>
                      <a [routerLink]="['/home/products', product.id]">
                        {{ product.name }}
                      </a>
                    </h3>
                    <p class="product-brand">{{ product.brand }}</p>

                    <div class="product-meta">
                      <span
                        class="availability-badge"
                        [class]="'avail-' + product.availability.toLowerCase()"
                      >
                        {{ availabilityLabels[product.availability] }}
                      </span>
                      <span class="rating">
                        <mat-icon aria-hidden="true">star</mat-icon>
                        {{ product.averageRating | number: '1.1-1' }}
                        <span class="review-count">({{ product.reviewCount }})</span>
                      </span>
                    </div>
                  </div>

                  <div class="product-footer">
                    <div class="price-block">
                      @if (product.salePrice) {
                        <span class="sale-price">{{ product.salePrice | currency }}</span>
                        <span class="original-price">{{ product.price | currency }}</span>
                      } @else {
                        <span class="price">{{ product.price | currency }}</span>
                      }
                    </div>
                    <button
                      mat-raised-button
                      color="primary"
                      (click)="addToCart(product)"
                      [disabled]="product.availability === 'OUT_OF_STOCK' || product.availability === 'DISCONTINUED'"
                      [attr.aria-label]="'Add ' + product.name + ' to cart'"
                    >
                      Add to cart
                    </button>
                  </div>
                </article>
              }
            </div>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <div class="pagination" role="navigation" aria-label="Product pagination">
                <button
                  mat-button
                  [disabled]="currentPage() === 0"
                  (click)="goToPage(currentPage() - 1)"
                  aria-label="Previous page"
                >
                  <mat-icon>chevron_left</mat-icon> Previous
                </button>
                <span>Page {{ currentPage() + 1 }} of {{ totalPages() }}</span>
                <button
                  mat-button
                  [disabled]="currentPage() >= totalPages() - 1"
                  (click)="goToPage(currentPage() + 1)"
                  aria-label="Next page"
                >
                  Next <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
            }
          }
        </main>
      </div>
    </section>
  `,
  styles: [
    `
      .catalog-page {
        display: grid;
        gap: 1.25rem;
        padding: 1.5rem 1rem;
      }

      .page-header {
        align-items: flex-start;
        display: flex;
        justify-content: space-between;
      }

      .breadcrumb {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-medium);
        margin: 0 0 0.5rem;
      }

      .breadcrumb a {
        color: var(--mat-sys-primary);
        text-decoration: none;
      }

      h1 {
        font: var(--mat-sys-headline-medium);
        margin: 0;
      }

      .cart-link {
        align-items: center;
        color: var(--mat-sys-on-surface);
        display: flex;
        gap: 0.25rem;
        position: relative;
        text-decoration: none;
      }

      .cart-badge {
        background: var(--mat-sys-primary);
        border-radius: 50%;
        color: var(--mat-sys-on-primary);
        font: var(--mat-sys-label-small);
        height: 1.25rem;
        line-height: 1.25rem;
        min-width: 1.25rem;
        position: absolute;
        right: -0.5rem;
        text-align: center;
        top: -0.5rem;
      }

      .search-row {
        display: flex;
        gap: 1rem;
      }

      .search-field {
        flex: 1;
      }

      .sort-field {
        min-width: 16rem;
      }

      .active-filters {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .clear-all {
        color: var(--mat-sys-error);
      }

      .layout {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: 16rem 1fr;
        align-items: start;
      }

      .filters-panel {
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        padding: 1rem;
      }

      .filter-heading {
        font: var(--mat-sys-title-medium);
        margin: 0 0 1rem;
      }

      .filter-group {
        display: grid;
        gap: 0.25rem;
        margin: 0.75rem 0;
      }

      .filter-label {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-large);
        margin: 0 0 0.5rem;
      }

      mat-checkbox {
        display: block;
      }

      .price-row {
        align-items: center;
        display: flex;
        gap: 0.5rem;
      }

      .price-field {
        flex: 1;
        min-width: 0;
      }

      .price-sep {
        color: var(--mat-sys-on-surface-variant);
        flex-shrink: 0;
        margin-top: -1.25rem;
      }

      .reset-btn {
        color: var(--mat-sys-on-surface-variant);
        margin-top: 1rem;
        width: 100%;
      }

      .products-area {
        display: grid;
        gap: 1rem;
      }

      .results-summary {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
        margin: 0;
      }

      .loading-center {
        align-items: center;
        display: flex;
        justify-content: center;
        min-height: 20rem;
      }

      .empty-state {
        align-items: center;
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-height: 20rem;
        justify-content: center;
        padding: 2rem;
        text-align: center;
      }

      .empty-state h2 {
        font: var(--mat-sys-headline-small);
        margin: 0;
      }

      .empty-state p {
        color: var(--mat-sys-on-surface-variant);
        margin: 0;
      }

      .empty-icon {
        color: var(--mat-sys-on-surface-variant);
        font-size: 3rem;
        height: 3rem;
        width: 3rem;
      }

      .product-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
      }

      .product-card {
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        display: grid;
        grid-template-rows: auto 1fr auto;
        overflow: hidden;
      }

      .product-thumbnail {
        align-items: center;
        background: var(--mat-sys-surface-variant);
        display: flex;
        height: 10rem;
        justify-content: center;
        overflow: hidden;
      }

      .product-thumbnail img {
        height: 100%;
        object-fit: cover;
        width: 100%;
      }

      .product-thumbnail mat-icon {
        color: var(--mat-sys-on-surface-variant);
        font-size: 3rem;
        height: 3rem;
        width: 3rem;
      }

      .product-info {
        padding: 1rem;
      }

      .product-category {
        color: var(--mat-sys-primary);
        font: var(--mat-sys-label-medium);
        margin: 0 0 0.25rem;
      }

      .product-info h3 {
        font: var(--mat-sys-title-medium);
        margin: 0 0 0.25rem;
      }

      .product-info h3 a {
        color: var(--mat-sys-on-surface);
        text-decoration: none;
      }

      .product-info h3 a:hover {
        color: var(--mat-sys-primary);
        text-decoration: underline;
      }

      .product-brand {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
        margin: 0 0 0.75rem;
      }

      .product-meta {
        align-items: center;
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .availability-badge {
        border-radius: 4px;
        font: var(--mat-sys-label-small);
        padding: 0.25rem 0.5rem;
      }

      .avail-in_stock {
        background: #e8f5e9;
        color: #2e7d32;
      }

      .avail-low_stock {
        background: #fff8e1;
        color: #f57f17;
      }

      .avail-out_of_stock,
      .avail-discontinued {
        background: var(--mat-sys-surface-variant);
        color: var(--mat-sys-on-surface-variant);
      }

      .rating {
        align-items: center;
        color: var(--mat-sys-on-surface-variant);
        display: flex;
        font: var(--mat-sys-label-medium);
        gap: 0.25rem;
      }

      .rating mat-icon {
        color: #f9a825;
        font-size: 1rem;
        height: 1rem;
        width: 1rem;
      }

      .review-count {
        font: var(--mat-sys-label-small);
      }

      .product-footer {
        align-items: center;
        border-top: 1px solid var(--mat-sys-outline-variant);
        display: flex;
        justify-content: space-between;
        padding: 0.75rem 1rem;
      }

      .price-block {
        display: flex;
        flex-direction: column;
      }

      .price,
      .sale-price {
        color: var(--mat-sys-on-surface);
        font: var(--mat-sys-title-medium);
      }

      .original-price {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-small);
        text-decoration: line-through;
      }

      .pagination {
        align-items: center;
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 1rem;
      }

      .pagination span {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
      }

      @media (max-width: 960px) {
        .layout {
          grid-template-columns: 1fr;
        }
        .filters-panel {
          order: -1;
        }
        .sort-field {
          min-width: 0;
        }
      }

      @media (max-width: 640px) {
        .search-row {
          flex-direction: column;
        }
        .product-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ProductCatalogComponent implements OnInit, OnDestroy {
  private readonly productSvc = inject(ProductService);
  private readonly cartSvc = inject(CartService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  protected readonly availabilityLabels = PRODUCT_AVAILABILITY_LABELS;
  protected readonly categories = CATEGORIES;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly availabilityOptions: { value: ProductAvailability | ''; label: string }[] = [
    { value: '', label: 'Any' },
    { value: 'IN_STOCK', label: 'In stock' },
    { value: 'LOW_STOCK', label: 'Limited stock' },
    { value: 'OUT_OF_STOCK', label: 'Out of stock' },
  ];

  // State
  protected readonly products = signal<ProductSummary[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = computed(() => Math.ceil(this.total() / 20));
  protected readonly cartCount = this.cartSvc.itemCount;

  // Forms
  readonly searchCtrl = this.fb.nonNullable.control('');
  readonly sortCtrl = this.fb.nonNullable.control('');
  readonly filterForm = this.fb.nonNullable.group({
    category: [''],
    minPrice: [null as number | null],
    maxPrice: [null as number | null],
    availability: ['' as ProductAvailability | ''],
    minRating: [null as number | null],
  });

  // Active filters chip list
  protected readonly activeFilters = computed(() => {
    const chips: { key: string; label: string }[] = [];
    const q = this.searchCtrl.value;
    if (q) chips.push({ key: 'query', label: `"${q}"` });
    const { category, minPrice, maxPrice, availability, minRating } =
      this.filterForm.getRawValue();
    if (category) chips.push({ key: 'category', label: CATEGORIES.find((c) => c.value === category)?.label ?? category });
    if (minPrice != null) chips.push({ key: 'minPrice', label: `Min $${minPrice}` });
    if (maxPrice != null) chips.push({ key: 'maxPrice', label: `Max $${maxPrice}` });
    if (availability) chips.push({ key: 'availability', label: PRODUCT_AVAILABILITY_LABELS[availability as ProductAvailability] });
    if (minRating != null) chips.push({ key: 'minRating', label: `${minRating}+ stars` });
    return chips;
  });

  ngOnInit(): void {
    // Pre-fill from query params
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['q']) this.searchCtrl.setValue(params['q'], { emitEvent: false });
      if (params['category']) this.filterForm.controls.category.setValue(params['category'], { emitEvent: false });
    });

    // React to search changes with debounce
    this.searchCtrl.valueChanges
      .pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage.set(0);
        this.loadProducts();
      });

    // React to filter form changes
    this.filterForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage.set(0);
        this.loadProducts();
      });

    this.sortCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadProducts());

    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected addToCart(product: ProductSummary): void {
    this.cartSvc.addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.salePrice ?? product.price,
      thumbnailUrl: product.thumbnailUrl,
    });
  }

  protected goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected removeFilter(key: string): void {
    if (key === 'query') this.searchCtrl.setValue('');
    else if (key === 'category') this.filterForm.controls.category.setValue('');
    else if (key === 'minPrice') this.filterForm.controls.minPrice.setValue(null);
    else if (key === 'maxPrice') this.filterForm.controls.maxPrice.setValue(null);
    else if (key === 'availability') this.filterForm.controls.availability.setValue('');
    else if (key === 'minRating') this.filterForm.controls.minRating.setValue(null);
  }

  protected clearAllFilters(): void {
    this.searchCtrl.setValue('');
    this.filterForm.reset({ category: '', minPrice: null, maxPrice: null, availability: '', minRating: null });
    this.currentPage.set(0);
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading.set(true);
    const { category, minPrice, maxPrice, availability, minRating } =
      this.filterForm.getRawValue();
    const filter: ProductFilter = {
      query: this.searchCtrl.value || undefined,
      category: category || undefined,
      minPrice: minPrice ?? undefined,
      maxPrice: maxPrice ?? undefined,
      availability: (availability as ProductAvailability) || undefined,
      minRating: minRating ?? undefined,
      page: this.currentPage(),
      pageSize: 20,
    };

    this.productSvc.getProducts(filter).subscribe({
      next: (res: PagedResponse<ProductSummary>) => {
        this.products.set(res.data);
        this.total.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
