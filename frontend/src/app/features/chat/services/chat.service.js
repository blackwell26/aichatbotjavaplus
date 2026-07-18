import { __decorate } from "tslib";
import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { EMPTY, Subject, Subscription } from 'rxjs';
import { Client } from '@stomp/stompjs';
import { environment } from '../../../../environments/environment';
import { TokenStorageService } from '../../../core/auth/token-storage.service';
import { DEFAULT_SUGGESTED_PROMPTS } from '../models/chat.model';
let ChatService = class ChatService {
    http = inject(HttpClient);
    tokenStorage = inject(TokenStorageService);
    apiBase = `${environment.apiBaseUrl}/chat/sessions`;
    wsBase = environment.wsBaseUrl;
    _session = signal(null);
    _messages = signal([]);
    _connecting = signal(false);
    _sending = signal(false);
    _escalating = signal(false);
    _error = signal(null);
    _suggestedPrompts = signal(DEFAULT_SUGGESTED_PROMPTS);
    session = this._session.asReadonly();
    messages = this._messages.asReadonly();
    connecting = this._connecting.asReadonly();
    sending = this._sending.asReadonly();
    escalating = this._escalating.asReadonly();
    error = this._error.asReadonly();
    suggestedPrompts = this._suggestedPrompts.asReadonly();
    isOpen = computed(() => this._session()?.status === 'OPEN');
    isEscalated = computed(() => this._session()?.status === 'ESCALATED');
    sessionId = computed(() => this._session()?.sessionId ?? null);
    stompClient;
    topicSub;
    wsEventSource$ = new Subject();
    wsEvents$ = this.wsEventSource$.asObservable();
    subscriptions = new Subscription();
    ngOnDestroy() {
        this.disconnectWebSocket();
        this.subscriptions.unsubscribe();
        this.wsEventSource$.complete();
    }
};
ChatService = __decorate([
    Injectable({ providedIn: 'root' })
], ChatService);
export { ChatService };
