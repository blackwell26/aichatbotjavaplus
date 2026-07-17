import { Routes } from '@angular/router';

export const customerRoutes: Routes = [
  // T3.1 — Home
  {
    path: '',
    data: { breadcrumb: 'Home' },
    loadComponent: () =>
      import('./pages/home/home').then((m) => m.HomeComponent),
  },

  // T3.4 + T3.5 — Product catalog with search/filter
  {
    path: 'products',
    data: { breadcrumb: 'Products' },
    loadComponent: () =>
      import('./pages/product-catalog/product-catalog').then(
        (m) => m.ProductCatalogComponent
      ),
  },

  // T3.6 — Product detail
  {
    path: 'products/:id',
    data: { breadcrumb: 'Product' },
    loadComponent: () =>
      import('./pages/product-detail/product-detail').then(
        (m) => m.ProductDetailComponent
      ),
  },

  // T3.7 — Shopping cart
  {
    path: 'cart',
    data: { breadcrumb: 'Cart' },
    loadComponent: () =>
      import('./pages/cart/cart').then((m) => m.CartComponent),
  },

  // T3.8 — Checkout flow
  {
    path: 'checkout',
    data: { breadcrumb: 'Checkout' },
    loadComponent: () =>
      import('./pages/checkout/checkout').then((m) => m.CheckoutComponent),
  },

  // T3.9 — Order history
  {
    path: 'orders',
    data: { breadcrumb: 'Orders' },
    loadComponent: () =>
      import('./pages/order-history/order-history').then(
        (m) => m.OrderHistoryComponent
      ),
  },

  // T3.10 — Order detail and tracking
  {
    path: 'orders/:id',
    data: { breadcrumb: 'Order' },
    loadComponent: () =>
      import('./pages/order-detail/order-detail').then(
        (m) => m.OrderDetailComponent
      ),
  },

  // T3.11 — Return request
  {
    path: 'orders/:id/return',
    data: { breadcrumb: 'Return' },
    loadComponent: () =>
      import('./pages/return-request/return-request').then(
        (m) => m.ReturnRequestComponent
      ),
  },

  // T3.3 — Profile management
  {
    path: 'profile',
    data: { breadcrumb: 'Profile' },
    loadComponent: () =>
      import('./pages/profile/profile').then((m) => m.ProfileComponent),
  },

  // T3.12 — Support tickets list
  {
    path: 'support-tickets',
    data: { breadcrumb: 'Support Tickets' },
    loadComponent: () =>
      import('./pages/support-tickets/support-tickets').then(
        (m) => m.SupportTicketsComponent
      ),
  },

  // T3.12 — Support ticket detail
  {
    path: 'support-tickets/:id',
    data: { breadcrumb: 'Ticket' },
    loadComponent: () =>
      import('./pages/support-ticket-detail/support-ticket-detail').then(
        (m) => m.SupportTicketDetailComponent
      ),
  },
];
