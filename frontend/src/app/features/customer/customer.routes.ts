import { Routes } from '@angular/router';

export const customerRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/product-catalog/product-catalog').then(
        (m) => m.ProductCatalogComponent
      ),
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./pages/product-detail/product-detail').then(
        (m) => m.ProductDetailComponent
      ),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./pages/checkout/checkout').then((m) => m.CheckoutComponent),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./pages/order-history/order-history').then(
        (m) => m.OrderHistoryComponent
      ),
  },
  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./pages/order-detail/order-detail').then(
        (m) => m.OrderDetailComponent
      ),
  },
  {
    path: 'orders/:id/return',
    loadComponent: () =>
      import('./pages/return-request/return-request').then(
        (m) => m.ReturnRequestComponent
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile').then((m) => m.ProfileComponent),
  },
];
