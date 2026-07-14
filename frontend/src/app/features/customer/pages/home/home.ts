import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface CategoryLink {
  readonly name: string;
  readonly description: string;
  readonly query: string;
}

interface FeaturedProduct {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly price: string;
  readonly availability: string;
  readonly rating: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="customer-home" aria-labelledby="customer-home-title">
      <div class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Customer Portal</p>
          <h1 id="customer-home-title">Shop products with support close by</h1>
          <p class="intro">
            Browse popular categories, search the catalog, review your account,
            or start a chatbot conversation from one place.
          </p>

          <form class="search" role="search" aria-label="Product search">
            <label class="visually-hidden" for="home-product-search">
              Search products
            </label>
            <input
              id="home-product-search"
              type="search"
              name="q"
              placeholder="Search by product, SKU, brand, or keyword"
            />
            <button type="button" routerLink="/home/products">Search</button>
          </form>
        </div>

        <aside class="quick-actions" aria-label="Customer quick actions">
          <a routerLink="/home/cart">
            <span>Cart</span>
            <strong>Review items</strong>
          </a>
          <a routerLink="/home/profile">
            <span>Account</span>
            <strong>Profile and preferences</strong>
          </a>
          <a routerLink="/chat">
            <span>Chatbot</span>
            <strong>Ask for help</strong>
          </a>
        </aside>
      </div>

      <section class="section" aria-labelledby="categories-title">
        <div class="section-heading">
          <h2 id="categories-title">Product categories</h2>
          <a routerLink="/home/products">View catalog</a>
        </div>

        <div class="category-grid">
          @for (category of categories; track category.query) {
            <a
              class="category-card"
              [routerLink]="['/home/products']"
              [queryParams]="{ category: category.query }"
            >
              <span>{{ category.name }}</span>
              <p>{{ category.description }}</p>
            </a>
          }
        </div>
      </section>

      <section class="section" aria-labelledby="featured-title">
        <div class="section-heading">
          <h2 id="featured-title">Featured products</h2>
          <a routerLink="/home/products">Browse all</a>
        </div>

        <div class="product-grid">
          @for (product of featuredProducts; track product.id) {
            <article class="product-card">
              <div>
                <p class="product-category">{{ product.category }}</p>
                <h3>{{ product.name }}</h3>
                <p class="availability">{{ product.availability }}</p>
              </div>

              <div class="product-footer">
                <span>{{ product.price }}</span>
                <span>{{ product.rating }}</span>
              </div>

              <a [routerLink]="['/home/products', product.id]">View details</a>
            </article>
          }
        </div>
      </section>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .customer-home {
        display: grid;
        gap: 2rem;
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
        gap: 1.5rem;
        align-items: stretch;
      }

      .hero-copy,
      .quick-actions,
      .category-card,
      .product-card {
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        background: var(--mat-sys-surface-container-low);
      }

      .hero-copy {
        padding: 2rem;
      }

      .eyebrow,
      .product-category {
        color: var(--mat-sys-primary);
        font: var(--mat-sys-label-large);
        margin: 0 0 0.5rem;
      }

      h1 {
        font: var(--mat-sys-display-small);
        margin-bottom: 1rem;
        max-width: 46rem;
      }

      .intro {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-large);
        margin: 0 0 1.5rem;
        max-width: 44rem;
      }

      .search {
        display: flex;
        gap: 0.75rem;
        max-width: 44rem;
      }

      input {
        flex: 1;
        min-width: 0;
        border: 1px solid var(--mat-sys-outline);
        border-radius: 6px;
        color: var(--mat-sys-on-surface);
        font: var(--mat-sys-body-medium);
        padding: 0.8rem 0.9rem;
      }

      button,
      .product-card a,
      .section-heading a {
        border: 0;
        color: var(--mat-sys-primary);
        cursor: pointer;
        font: var(--mat-sys-label-large);
        text-decoration: none;
      }

      button {
        border-radius: 6px;
        background: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);
        padding: 0 1.25rem;
      }

      .quick-actions {
        display: grid;
        padding: 0.75rem;
      }

      .quick-actions a {
        border-radius: 6px;
        color: var(--mat-sys-on-surface);
        padding: 1rem;
        text-decoration: none;
      }

      .quick-actions a:hover,
      .category-card:hover {
        background: var(--mat-sys-surface-container);
      }

      .quick-actions span {
        color: var(--mat-sys-on-surface-variant);
        display: block;
        font: var(--mat-sys-label-medium);
        margin-bottom: 0.25rem;
      }

      .quick-actions strong {
        font: var(--mat-sys-title-medium);
      }

      .section {
        display: grid;
        gap: 1rem;
      }

      .section-heading {
        align-items: center;
        display: flex;
        gap: 1rem;
        justify-content: space-between;
      }

      h2 {
        font: var(--mat-sys-headline-small);
        margin: 0;
      }

      .category-grid,
      .product-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .category-card {
        color: var(--mat-sys-on-surface);
        min-height: 8rem;
        padding: 1rem;
        text-decoration: none;
      }

      .category-card span {
        display: block;
        font: var(--mat-sys-title-medium);
        margin-bottom: 0.5rem;
      }

      .category-card p,
      .availability {
        color: var(--mat-sys-on-surface-variant);
        margin: 0;
      }

      .product-card {
        display: grid;
        gap: 1rem;
        min-height: 14rem;
        padding: 1rem;
      }

      .product-card h3 {
        font: var(--mat-sys-title-medium);
        margin-bottom: 0.5rem;
      }

      .product-footer {
        align-self: end;
        color: var(--mat-sys-on-surface-variant);
        display: flex;
        font: var(--mat-sys-label-large);
        justify-content: space-between;
      }

      @media (max-width: 960px) {
        .hero,
        .category-grid,
        .product-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .hero-copy {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 640px) {
        .hero,
        .category-grid,
        .product-grid,
        .search {
          grid-template-columns: 1fr;
        }

        .search {
          display: grid;
        }

        button {
          min-height: 2.75rem;
        }

        .hero-copy {
          padding: 1.25rem;
        }
      }
    `,
  ],
})
export class HomeComponent {
  protected readonly categories: CategoryLink[] = [
    {
      name: 'Electronics',
      description: 'Devices, accessories, and connected home essentials.',
      query: 'electronics',
    },
    {
      name: 'Books',
      description: 'New releases, textbooks, and customer favorites.',
      query: 'books',
    },
    {
      name: 'Home Office',
      description: 'Monitors, desks, chairs, and productivity gear.',
      query: 'home-office',
    },
    {
      name: 'Service Parts',
      description: 'Replacement parts and warranty-ready components.',
      query: 'service-parts',
    },
  ];

  protected readonly featuredProducts: FeaturedProduct[] = [
    {
      id: 'noise-canceling-headset',
      name: 'Noise Canceling Support Headset',
      category: 'Electronics',
      price: '$129.00',
      availability: 'In stock',
      rating: '4.7',
    },
    {
      id: 'ergonomic-keyboard',
      name: 'Ergonomic Wireless Keyboard',
      category: 'Home Office',
      price: '$89.00',
      availability: 'Ships today',
      rating: '4.5',
    },
    {
      id: 'smart-home-hub',
      name: 'Smart Home Hub Pro',
      category: 'Electronics',
      price: '$149.00',
      availability: 'Limited stock',
      rating: '4.6',
    },
    {
      id: 'extended-warranty-kit',
      name: 'Extended Warranty Service Kit',
      category: 'Service Parts',
      price: '$39.00',
      availability: 'Available online',
      rating: '4.4',
    },
  ];
}
