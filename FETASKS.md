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

---------------------------------------------------------------------------------------------------------------------------------------

Phase 4 — AI Chatbot: Implemented

  New files (12):

  ┌───────────┬────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────┐
  │ Task      │ File                       │ Description                                                                              │
  ├───────────┼────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ T4.1      │ chat/models/chat.model.ts  │ Domain types: ChatSession, ChatMessage, ChatSuggestedPrompt, EscalationRequest/Response, │
  │           │                            │ WebSocket event types, label maps                                                        │
  ├───────────┼────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ T4.1      │ chat/components/chat-launc │ Floating action button (FAB) in bottom-right — auth-gated, toggles chat window, shows    │
  │           │ her/chat-launcher.ts       │ unread badge                                                                             │
  ├───────────┼────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ T4.2/T4.3 │ chat/components/chat-windo │ Full chat UI: message list, textarea input, streaming cursor animation,                  │
  │           │ w/chat-window.ts           │ AI/Customer/System message bubbles with citations                                        │
  ├───────────┼────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ T4.4      │ chat/pages/chat-history/ch │ History page at /chat/history — lists past sessions, paginated, inline transcript viewer │
  │           │ at-history.ts              │                                                                                          │
  ├───────────┼────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ T4.5      │ (in chat-window)           │ Suggested prompt chips — shown when session has no customer messages yet, feature-flag   │
  │           │                            │ gated                                                                                    │
  ├───────────┼────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ T4.6      │ chat/services/chat.service │ REST API integration: create/get/close session, send message, list sessions, load        │
  │           │ .ts                        │ history                                                                                  │
  ├───────────┼────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ T4.7      │ (in chat.service.ts)       │ STOMP/WebSocket streaming: connects on session create, handles MESSAGE, STREAM_CHUNK,    │
  │           │                            │ STREAM_DONE, ERROR events; falls back to REST when WS unavailable                        │
  ├───────────┼────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ T4.8      │ (in chat-window)           │ Human escalation button — calls POST /sessions/{id}/escalate, injects system message,    │
  │           │                            │ feature-flag gated                                                                       │
  └───────────┴────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────┘

  Modified files:

  - chat/chat.routes.ts — added /chat/history route, default redirect
  - layout/shell/shell.ts — added ChatLauncherComponent import
  - layout/shell/shell.html — added <app-chat-launcher /> for app-wide persistence
  - angular.json — added allowedCommonJsDependencies: ["@stomp/stompjs"]
  - package.json — added @stomp/stompjs@^7.0.0

  Build: ✅ Application bundle generation complete — zero errors.
● ✓ Goal complete
    ╰ Phase 4 - AI Chatbot has been fully implemented. All 8 tasks (T4.1–T4.8) are complete:

    T4.1 ChatLauncherComponent + models: Created chat.model.ts with all domain types (ChatSession, ChatMessage, suggested prompts,
    escalation), and ChatLauncherComponent as a floating FAB in the shell layout — verified at
    frontend/src/app/features/chat/components/chat-launcher/chat-launcher.ts.

    T4.2/T4.3 ChatWindowComponent: Full chat interface with message bubbles (customer/AI/agent/system), real-time streaming with animated
    cursor, session state, and auto-scroll — verified at frontend/src/app/features/chat/components/chat-window/chat-window.ts (784 lines).

    T4.4 Conversation history: ChatHistoryComponent page at /chat/history with session list, pagination, and inline transcript viewer —
    verified at frontend/src/app/features/chat/pages/chat-history/chat-history.ts.

    T4.5 Suggested prompts: 6 default prompt chips shown when session has no customer messages, feature-flag gated via
    environment.features.suggestedPromptsEnabled — implemented inline in ChatWindowComponent.

    T4.6 Ollama/REST API integration: ChatService covers full REST lifecycle (create/get/close session, send message, escalate, list
    sessions, get history) — verified at frontend/src/app/features/chat/services/chat.service.ts.

    T4.7 WebSocket/STOMP streaming: ChatService connects to /ws/chat via @stomp/stompjs, handles MESSAGE, STREAM_CHUNK, STREAM_DONE,
    SESSION_CLOSED, ESCALATED, ERROR events with REST fallback — @stomp/stompjs@7.0.0 added to package.json.

    T4.8 Human escalation: "Talk to an agent" button in ChatWindowComponent calls POST /sessions/{id}/escalate, injects system message
    confirming ticket number, feature-flag gated — implemented in ChatWindowComponent.

    Shell integration: shell.ts and shell.html updated to include ChatLauncherComponent making the chat FAB persistent across all routes.

    Build verification: `npm run build` completes successfully with "Application bundle generation complete" — zero errors confirmed.



 Phase 5 is complete. Here's a summary of what was delivered:

  New files created:

  ┌───────────┬─────────────────────────────┬───────────────────────────────────────────────────────────────────────┐
  │ Task      │ File                        │ Description                                                           │
  ├───────────┼─────────────────────────────┼───────────────────────────────────────────────────────────────────────┤
  │ T5.1      │ agent/models/agent.model.ts │ Domain types: AgentDashboardStats, QueuedConversation, AgentTicket,   │
  │           │                             │ AiReplySuggestion, AgentConversation, all request/response DTOs       │
  ├───────────┼─────────────────────────────┼───────────────────────────────────────────────────────────────────────┤
  │ T5.1      │ agent/services/agent.servic │ REST API service — dashboard stats, queue CRUD, assign, resolve,      │
  │           │ e.ts                        │ conversation load, send message, AI suggestions, ticket CRUD,         │
  │           │                             │ comments                                                              │
  ├───────────┼─────────────────────────────┼───────────────────────────────────────────────────────────────────────┤
  │ T5.1      │ agent/pages/dashboard/dashb │ Dashboard with 4 stat cards (open queue, active chats, resolved       │
  │           │ oard.ts                     │ today, avg handle time), delta vs-yesterday indicators, quick action  │
  │           │                             │ buttons                                                               │
  ├───────────┼─────────────────────────────┼───────────────────────────────────────────────────────────────────────┤
  │ T5.2      │ agent/pages/conversation-qu │ Paginated queue list with status/priority/sort filters, priority      │
  │           │ eue/conversation-queue.ts   │ color stripes, wait-time display, assign-to-me button (navigates to   │
  │           │                             │ workspace)                                                            │
  ├───────────┼─────────────────────────────┼───────────────────────────────────────────────────────────────────────┤
  │ T5.3+T5.4 │ agent/pages/conversation-wo │ Two-column workspace: left = scrollable message thread with           │
  │           │ rkspace/conversation-worksp │ sender-typed bubbles + reply form; AI suggestions panel with          │
  │           │ ace.ts                      │ confidence %, click-to-apply                                          │
  ├───────────┼─────────────────────────────┼───────────────────────────────────────────────────────────────────────┤
  │ T5.5      │ (in conversation-workspace) │ Right panel with tabs: "Ticket" (status/priority/resolution form,     │
  │           │                             │ comment list, add public/internal note) and "Customer" (info summary) │
  └───────────┴─────────────────────────────┴───────────────────────────────────────────────────────────────────────┘

  Modified: agent/agent.routes.ts — updated with breadcrumb data, confirmed conversations/:id path.


Phase 6 is complete. Here's a summary:

  New files created:

  ┌──────────────────────────┬───────────────┬──────────────────────────────────────────────────────────────────────┐
  │ Task                     │ File          │ Description                                                          │
  ├──────────────────────────┼───────────────┼──────────────────────────────────────────────────────────────────────┤
  │ T6.1–T6.5                │ knowledge/mo │ Domain types: PublishStatus + transition map, EmbeddingStatus +       │
  │                          │ dels/knowled │ in-progress list, DocumentType,                                       │
  │                          │ ge.model.ts  │ KnowledgeDocumentSummary/Detail/Version, upload/transition DTOs,      │
  │                          │              │ KnowledgeTestRequest/Result/RetrievedChunk                            │
  ├──────────────────────────┼──────────────┼───────────────────────────────────────────────────────────────────────┤
  │ T6.1–T6.5                │ knowledge/se │ Full API service: list with filters, upload (multipart/form-data),    │
  │                          │ rvices/knowl │ getDocument, transitionStatus, getEmbeddingStatus, reindex,           │
  │                          │ edge.service │ getVersions, getVersion, archive, testQuery                           │
  │                          │ .ts          │                                                                       │
  ├──────────────────────────┼──────────────┼───────────────────────────────────────────────────────────────────────┤
  │ T6.1/T6.3/T6.4           │ pages/docume │ Document table with search + publish/embedding filters, pagination,   │
  │                          │ nt-list/docu │ inline upload dialog with file picker + full metadata form            │
  │                          │ ment-list.ts │                                                                       │
  ├──────────────────────────┼──────────────┼───────────────────────────────────────────────────────────────────────┤
  │ T6.2/T6.3/T6.4/T6.8/T6.9 │ pages/docume │ Two-tab layout: Overview (metadata, content preview, tags), Version   │
  │                          │ nt-detail/do │ history (list + inline preview drawer); sidebar: publish workflow     │
  │                          │ cument-detai │ transitions, live embedding status with 4 s auto-poll + retry         │
  │                          │ l.ts         │ reindex, archive with confirm                                         │
  ├──────────────────────────┼──────────────┼───────────────────────────────────────────────────────────────────────┤
  │ T6.5                     │ pages/knowle │ Query form (question, topK, model override), generated answer panel   │
  │                          │ dge-test/kno │ (model + latency), expandable retrieved-chunk cards with scored       │
  │                          │ wledge-test. │ progress bars and source document links                               │
  │                          │ ts           │                                                                       │
  └──────────────────────────┴──────────────┴───────────────────────────────────────────────────────────────────────┘

  Updated: knowledge.routes.ts with breadcrumb data.

  Build: ✅ Zero errors. Also fixed two pre-existing bugs in admin-manager-api.service.ts (wrong environment import

