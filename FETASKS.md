 Overall observations:

  - The tasks are well-scoped and sequential — each one is a reasonable gate before Phase 2.
  - The spec is intentionally high-level (one line per task). If you want actionable tickets, each task needs sub-tasks
  covering: acceptance criteria, tech choices (e.g., NgModules vs standalone, which CI system), and definition of done.
  - T1.2 is the most impactful — a poor structure decision here creates debt across all later phases. Worth spending extra
  design time here before implementing.

 Phase 1 is complete. Here's a summary of what was delivered:

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Phase 1 — Delivered

  T1.1 — Angular workspace (frontend/)

  - Angular 22.0.6, standalone components, routing, SCSS, ng new via CLI. Build verified ✅

  T1.2 — Project structure

  src/app/
    core/          models, auth, guards, interceptors, services, store
    shared/        components, directives, pipes, models, utils
    features/
      customer/    9 pages (home, catalog, detail, cart, checkout, orders, profile, return)
      chat/        chat-launcher, chat-window
      agent/       dashboard, conversation-queue, conversation-workspace
      knowledge/   document-list, document-detail, knowledge-test
      admin/       users, roles, ai-config, prompt-config, feature-toggles, audit-logs, system-health
    layout/        header, footer, sidebar, shell

  All features are lazy-loaded in app.routes.ts. Core models defined: User, Role, ApiResponse, PagedResponse, ApiError.

  T1.3 — CI, linting, formatting

  - angular-eslint 22.1.0 — all files pass
  - Prettier with project-standard config + .prettierignore
  - lint:fix, format, format:check scripts in package.json
  - Husky pre-commit hook → lint-staged (format + lint on staged files)
  - GitHub Actions CI: quality → build (dev/staging/prod matrix) + test jobs

  T1.4 — Environments

  - environment.type.ts interface (api URLs, auth, feature flags)
  - environment.development.ts → localhost:8080 (matches Spring local profile)
  - environment.staging.ts → staging cluster URLs
  - environment.ts → production URLs
  - angular.json updated with staging build config + fileReplacements
  - Dockerfile multi-stage (Node builder → NGINX 1.27)
  - nginx.conf with security headers, immutable asset caching, SPA routing, /health endpoint

 Phase 2 — Delivered

  T2.1 — Login & Authentication pages

  - login, register, password-reset — Angular reactive forms with FormBuilder.nonNullable, Material components, inline
  validation messages, error banners, loading spinner state, accessible labels and autocomplete attributes

  T2.2 — JWT/OIDC integration

  - AuthService — Signal-based auth state (user, loading, sessionWarning, isAuthenticated); login, register, password-reset,
  logout, silentRefresh (scheduled timer, uses HttpOnly refresh cookie), session restore on page reload
  - TokenStorageService — access token in sessionStorage only, with expiry tracking
  - auth.interceptor — functional interceptor attaching Authorization: Bearer + X-Correlation-ID to all API calls; 401 →
  redirect to /auth/login?returnUrl=
  - SessionTimeoutService + SessionTimeoutDialogComponent — watches sessionWarning signal, opens Material dialog with
  extend/logout choice

  T2.3 — Route guards

  - authGuard — redirects unauthenticated to login with returnUrl
  - guestGuard — redirects authenticated users away from auth pages
  - All feature groups in app.routes.ts protected appropriately

  T2.4 — RBAC

  - RbacService — computed role booleans (isAgent, isStaff, etc.)
  - roleGuard — reads route.data.roles, allows or redirects to /403
  - HasRoleDirective / HasAnyRoleDirective — structural directives for template-level role gating

  T2.5 — Responsive layout

  - ShellComponent — sticky header, collapsible sidebar drawer (mobile), breadcrumbs, main content area, footer
  - SidebarComponent — CSS transform drawer on mobile, always-visible on desktop via BreakpointObserver
  - _breakpoints.scss — SCSS mixins (@include bp.mobile, @include bp.desktop, etc.)
  - Skip-to-main-content link on app-root for WCAG accessibility

  T2.6 — Navigation

  - HeaderComponent — desktop nav links gated by role, notifications bell, cart, user profile dropdown with name/email/logout
  - NotificationService — Signal store (push/markRead/markAllRead); NotificationAreaComponent with badge count
  - BreadcrumbService — derives breadcrumbs from route.data.breadcrumb across the route tree
  - BreadcrumbsComponent — renders accessible <nav aria-label="Breadcrumb"> with chevron separators


