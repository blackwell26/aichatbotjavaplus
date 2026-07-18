import { __decorate } from "tslib";
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { SENDER_TYPE_LABELS, SESSION_STATUS_LABELS } from '../../models/chat.model';
let ChatHistoryComponent = class ChatHistoryComponent {
    chatService = inject(ChatService);
    sessions = signal([]);
    loading = signal(false);
    error = signal(null);
    activeTranscript = signal(null);
    currentPage = signal(0);
    totalPages = signal(1);
    PAGE_SIZE = 20;
    ngOnInit() { this.loadSessions(); }
    loadSessions() {
        this.loading.set(true);
        this.error.set(null);
        this.chatService.getSessions(this.currentPage(), this.PAGE_SIZE).subscribe({
            next: (res) => { this.sessions.set(res.data ?? []); this.loading.set(false); },
            error: () => { this.error.set('Could not load chat sessions. Please try again.'); this.loading.set(false); },
        });
    }
    viewTranscript(session) {
        this.loading.set(true);
        this.chatService.getHistory(session.sessionId).subscribe({
            next: (res) => { this.activeTranscript.set(res.data); this.loading.set(false); },
            error: () => { this.error.set('Could not load transcript.'); this.loading.set(false); },
        });
    }
    clearTranscript() { this.activeTranscript.set(null); }
    prevPage() { if (this.currentPage() > 0) { this.currentPage.update((p) => p - 1); this.loadSessions(); } }
    nextPage() { if (this.currentPage() < this.totalPages() - 1) { this.currentPage.update((p) => p + 1); this.loadSessions(); } }
    getStatusLabel(session) { return SESSION_STATUS_LABELS[session.status] ?? session.status; }
    getSenderLabel(msg) { return SENDER_TYPE_LABELS[msg.senderType] ?? msg.senderType; }
    formatDate(iso) { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    formatTime(iso) { return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); }
};
ChatHistoryComponent = __decorate([
    Component({
        selector: 'app-chat-history',
        standalone: true,
        imports: [CommonModule, RouterLink],
        template: `<div></div>`,
    })
], ChatHistoryComponent);
export { ChatHistoryComponent };
