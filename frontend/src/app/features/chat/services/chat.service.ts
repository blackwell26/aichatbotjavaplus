import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  EMPTY,
  Observable,
  Subject,
  Subscription,
  catchError,
  tap,
} from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api.model';
import { TokenStorageService } from '../../../core/auth/token-storage.service';
import {
  ChatHistoryResponse,
  ChatMessage,
  ChatSession,
  ChatSessionSummary,
  ChatSuggestedPrompt,
  CloseSessionResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  DEFAULT_SUGGESTED_PROMPTS,
  EscalationRequest,
  EscalationResponse,
  SendMessageRequest,
  SendMessageResponse,
  WsChatEvent,
  WsChatSend,
} from '../models/chat.model';

/**
 * ChatService – central service for Phase 4 AI Chatbot.
 *
 * Responsibilities:
 *  - REST calls: create/resume/close session, send message, load history, escalate
 *  - WebSocket/STOMP: connect, subscribe, stream AI chunks, disconnect
 *  - Reactive state via Angular Signals
 *
 * Transport strategy:
 *  - When `environment.features.streamingEnabled` is true and the WebSocket
 *    connects successfully, outbound messages travel over STOMP and inbound
 *    AI chunks stream back on `/topic/chat.sessions.{sessionId}`.
 *  - When streaming is disabled or the WS fails, the service falls back to
 *    the REST `POST /sessions/{sessionId}/messages` endpoint.
 */
@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly apiBase = `${environment.apiBaseUrl}/chat/sessions`;
  private readonly wsBase = environment.wsBaseUrl;

  // ── State ─────────────────────────────────────────────────────────────────

  private readonly _session = signal<ChatSession | null>(null);
  private readonly _messages = signal<ChatMessage[]>([]);
  private readonly _connecting = signal(false);
  private readonly _sending = signal(false);
  private readonly _escalating = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _suggestedPrompts = signal<ChatSuggestedPrompt[]>(
    DEFAULT_SUGGESTED_PROMPTS
  );

  readonly session = this._session.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly connecting = this._connecting.asReadonly();
  readonly sending = this._sending.asReadonly();
  readonly escalating = this._escalating.asReadonly();
  readonly error = this._error.asReadonly();
  readonly suggestedPrompts = this._suggestedPrompts.asReadonly();

  readonly isOpen = computed(() => this._session()?.status === 'OPEN');
  readonly isEscalated = computed(() => this._session()?.status === 'ESCALATED');
  readonly sessionId = computed(() => this._session()?.sessionId ?? null);

  // ── WebSocket ─────────────────────────────────────────────────────────────

  private stompClient?: Client;
  private topicSub?: StompSubscription;
  private wsEventSource$ = new Subject<WsChatEvent>();

  /** Emits every inbound WS event; components may subscribe for real-time updates. */
  readonly wsEvents$ = this.wsEventSource$.asObservable();

  private readonly subscriptions = new Subscription();

  // ── REST: session lifecycle ───────────────────────────────────────────────

  /**
   * Create a new chat session on the backend and connect the WebSocket.
   */
  createSession(
    payload: CreateSessionRequest = {}
  ): Observable<ApiResponse<CreateSessionResponse>> {
    this._connecting.set(true);
    this._error.set(null);

    return this.http
      .post<ApiResponse<CreateSessionResponse>>(this.apiBase, payload)
      .pipe(
        tap((res) => {
          const { sessionId, status, createdAt } = res.data;
          this._session.set({
            sessionId,
            customerId: '',
            status,
            createdAt,
            updatedAt: createdAt,
            messages: [],
          });
          this._messages.set([]);
          if (res.data.suggestedPrompts?.length) {
            this._suggestedPrompts.set(res.data.suggestedPrompts);
          }
          this._connecting.set(false);
          if (environment.features.streamingEnabled) {
            this.connectWebSocket(sessionId);
          }
        }),
        catchError((err: unknown) => {
          this._error.set('Could not start chat session.');
          this._connecting.set(false);
          throw err;
        })
      );
  }

  /**
   * Load an existing session by ID (used when resuming from history).
   */
  getSession(sessionId: string): Observable<ApiResponse<ChatHistoryResponse>> {
    this._connecting.set(true);
    return this.http
      .get<ApiResponse<ChatHistoryResponse>>(`${this.apiBase}/${sessionId}`)
      .pipe(
        tap((res) => {
          const d = res.data;
          this._session.set({
            sessionId: d.sessionId,
            customerId: '',
            status: d.status,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
            messages: [],
          });
          this._messages.set(d.messages);
          this._connecting.set(false);
          if (environment.features.streamingEnabled && d.status === 'OPEN') {
            this.connectWebSocket(d.sessionId);
          }
        }),
        catchError((err: unknown) => {
          this._error.set('Could not load chat session.');
          this._connecting.set(false);
          throw err;
        })
      );
  }

  /**
   * Send a customer message.
   *
   * If the WebSocket is connected and streaming is enabled, the message is
   * published over STOMP. Otherwise falls back to REST.
   */
  sendMessage(content: string): Observable<ApiResponse<SendMessageResponse> | void> {
    const sid = this.sessionId();
    if (!sid) return EMPTY;

    this._sending.set(true);
    this._error.set(null);

    // Optimistically add the user message to the list
    const optimisticMsg: ChatMessage = {
      messageId: `local-${Date.now()}`,
      sessionId: sid,
      senderType: 'CUSTOMER',
      content,
      timestamp: new Date().toISOString(),
    };
    this._messages.update((msgs) => [...msgs, optimisticMsg]);

    if (environment.features.streamingEnabled && this.stompClient?.connected) {
      return this.sendViaWebSocket(sid, content);
    }
    return this.sendViaRest(sid, content);
  }

  /**
   * Close the current session.
   */
  closeSession(): Observable<ApiResponse<CloseSessionResponse>> {
    const sid = this.sessionId();
    if (!sid) return EMPTY as Observable<ApiResponse<CloseSessionResponse>>;

    return this.http
      .post<ApiResponse<CloseSessionResponse>>(
        `${this.apiBase}/${sid}/close`,
        {}
      )
      .pipe(
        tap((res) => {
          this._session.update((s) =>
            s ? { ...s, status: res.data.status, closedAt: res.data.closedAt } : s
          );
          this.disconnectWebSocket();
        })
      );
  }

  /**
   * GET session transcript (T4.4 – history).
   */
  getHistory(
    sessionId: string
  ): Observable<ApiResponse<ChatHistoryResponse>> {
    return this.http.get<ApiResponse<ChatHistoryResponse>>(
      `${this.apiBase}/${sessionId}/history`
    );
  }

  /**
   * List past sessions for the current customer.
   * Maps to GET /api/v1/chat/sessions (backend returns paginated results).
   */
  getSessions(
    page = 0,
    pageSize = 20
  ): Observable<ApiResponse<ChatSessionSummary[]>> {
    return this.http.get<ApiResponse<ChatSessionSummary[]>>(
      `${environment.apiBaseUrl}/chat/sessions`,
      { params: { page: String(page), pageSize: String(pageSize) } }
    );
  }

  // ── REST: escalation (T4.8) ───────────────────────────────────────────────

  /**
   * Request human escalation for the current session.
   */
  escalate(
    payload: EscalationRequest
  ): Observable<ApiResponse<EscalationResponse>> {
    const sid = this.sessionId();
    if (!sid) return EMPTY as Observable<ApiResponse<EscalationResponse>>;

    this._escalating.set(true);
    return this.http
      .post<ApiResponse<EscalationResponse>>(
        `${this.apiBase}/${sid}/escalate`,
        payload
      )
      .pipe(
        tap((res) => {
          this._session.update((s) =>
            s ? { ...s, status: 'ESCALATED' } : s
          );
          // Inject a system message so the chat log reflects the escalation
          const sysMsg: ChatMessage = {
            messageId: `esc-${Date.now()}`,
            sessionId: sid,
            senderType: 'SYSTEM',
            content: `Your request has been escalated. Ticket: ${res.data.ticketNumber}. ${res.data.message}`,
            timestamp: new Date().toISOString(),
          };
          this._messages.update((msgs) => [...msgs, sysMsg]);
          this._escalating.set(false);
          this.disconnectWebSocket();
        }),
        catchError((err: unknown) => {
          this._error.set('Could not escalate to a human agent.');
          this._escalating.set(false);
          throw err;
        })
      );
  }

  // ── WebSocket helpers ─────────────────────────────────────────────────────

  private connectWebSocket(sessionId: string): void {
    if (this.stompClient?.connected) {
      this.subscribeToTopic(sessionId);
      return;
    }

    const token = this.tokenStorage.getAccessToken();
    this.stompClient = new Client({
      brokerURL: `${this.wsBase}/ws/chat`,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        this.subscribeToTopic(sessionId);
      },
      onStompError: (frame) => {
        this._error.set(`WebSocket error: ${frame.headers?.['message'] ?? 'unknown'}`);
      },
      onDisconnect: () => {
        this.topicSub = undefined;
      },
    });

    this.stompClient.activate();
  }

  private subscribeToTopic(sessionId: string): void {
    this.topicSub?.unsubscribe();
    this.topicSub = this.stompClient?.subscribe(
      `/topic/chat.sessions.${sessionId}`,
      (frame: IMessage) => {
        try {
          const event: WsChatEvent = JSON.parse(frame.body) as WsChatEvent;
          this.handleWsEvent(event);
        } catch {
          // ignore malformed frames
        }
      }
    );
  }

  private handleWsEvent(event: WsChatEvent): void {
    this.wsEventSource$.next(event);

    switch (event.eventType) {
      case 'MESSAGE':
        if (event.message) {
          // Replace any optimistic placeholder then add the AI reply
          this._messages.update((msgs) => {
            const withoutOptimistic = msgs.filter(
              (m) => !m.messageId.startsWith('local-')
            );
            return event.message
              ? [...withoutOptimistic, event.message]
              : withoutOptimistic;
          });
          this._sending.set(false);
        }
        break;

      case 'STREAM_CHUNK':
        // Accumulate streaming chunks into a transient AI message
        if (event.chunk != null) {
          this._messages.update((msgs) => {
            const streaming = msgs.find(
              (m) => m.streaming && m.messageId === event.messageId
            );
            if (streaming) {
              return msgs.map((m) =>
                m.messageId === event.messageId
                  ? { ...m, content: m.content + event.chunk }
                  : m
              );
            }
            // New streaming message
            const placeholder: ChatMessage = {
              messageId: event.messageId ?? `stream-${Date.now()}`,
              sessionId: event.sessionId,
              senderType: 'AI',
              content: event.chunk ?? '',
              timestamp: new Date().toISOString(),
              streaming: true,
            };
            return [...msgs, placeholder];
          });
        }
        break;

      case 'STREAM_DONE':
        // Mark the streaming message as complete
        this._messages.update((msgs) =>
          msgs.map((m) =>
            m.messageId === event.messageId ? { ...m, streaming: false } : m
          )
        );
        this._sending.set(false);
        break;

      case 'SESSION_CLOSED':
        this._session.update((s) => (s ? { ...s, status: 'CLOSED' } : s));
        this.disconnectWebSocket();
        break;

      case 'ESCALATED':
        this._session.update((s) => (s ? { ...s, status: 'ESCALATED' } : s));
        break;

      case 'ERROR':
        this._error.set(event.error ?? 'An error occurred.');
        this._sending.set(false);
        break;
    }
  }

  private sendViaWebSocket(sessionId: string, content: string): Observable<void> {
    const payload: WsChatSend = { sessionId, content };
    this.stompClient?.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload),
    });
    return EMPTY;
  }

  private sendViaRest(
    sessionId: string,
    content: string
  ): Observable<ApiResponse<SendMessageResponse>> {
    const body: SendMessageRequest = { content };
    return this.http
      .post<ApiResponse<SendMessageResponse>>(
        `${this.apiBase}/${sessionId}/messages`,
        body
      )
      .pipe(
        tap((res) => {
          // Replace optimistic message with confirmed user message + AI reply
          this._messages.update((msgs) => {
            const withoutOptimistic = msgs.filter(
              (m) => !m.messageId.startsWith('local-')
            );
            return [
              ...withoutOptimistic,
              res.data.userMessage,
              res.data.aiMessage,
            ];
          });
          this._sending.set(false);
        }),
        catchError((err: unknown) => {
          // Remove the failed optimistic message
          this._messages.update((msgs) =>
            msgs.filter((m) => !m.messageId.startsWith('local-'))
          );
          this._error.set('Failed to send message. Please try again.');
          this._sending.set(false);
          throw err;
        })
      );
  }

  private disconnectWebSocket(): void {
    this.topicSub?.unsubscribe();
    this.topicSub = undefined;
    this.stompClient?.deactivate();
    this.stompClient = undefined;
  }

  /** Clear session state (e.g. when user closes the chat window). */
  clearSession(): void {
    this.disconnectWebSocket();
    this._session.set(null);
    this._messages.set([]);
    this._error.set(null);
    this._sending.set(false);
    this._escalating.set(false);
    this._suggestedPrompts.set(DEFAULT_SUGGESTED_PROMPTS);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.disconnectWebSocket();
    this.subscriptions.unsubscribe();
    this.wsEventSource$.complete();
  }
}
