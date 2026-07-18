import { __decorate } from "tslib";
import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { SENDER_TYPE_LABELS } from '../../models/chat.model';
import { environment } from '../../../../../environments/environment';
let ChatWindowComponent = class ChatWindowComponent {
    chatService = inject(ChatService);
    auth = inject(AuthService);
    closeRequested = output();
    inputText = signal('');
    MAX_LENGTH = 2000;
    shouldScrollToBottom = false;
    subs = new Subscription();
    ngOnInit() {
        if (!this.chatService.session()) {
            this.subs.add(this.chatService.createSession().subscribe({ error: (_e) => { } }));
        }
        this.subs.add(this.chatService.wsEvents$.subscribe(() => { this.shouldScrollToBottom = true; }));
    }
    ngAfterViewChecked() {
        if (this.shouldScrollToBottom) {
            this.scrollAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
            this.shouldScrollToBottom = false;
        }
    }
    ngOnDestroy() { this.subs.unsubscribe(); }
    canSend() { return !!this.chatService.session() && this.chatService.isOpen() && !this.chatService.isEscalated(); }
    canEscalate() { return environment.features.humanEscalationEnabled && !!this.chatService.session() && this.chatService.isOpen() && !this.chatService.isEscalated(); }
    showSuggestions() { return environment.features.suggestedPromptsEnabled && this.chatService.isOpen() && this.chatService.messages().filter((m) => m.senderType === 'CUSTOMER').length === 0 && !this.chatService.sending(); }
    visibleSuggestions() { return this.chatService.suggestedPrompts().slice(0, 6); }
    hasStreamingMessage() { return this.chatService.messages().some((m) => m.streaming); }
    onInput(event) { const t = event.target; this.inputText.set(t.value.slice(0, this.MAX_LENGTH)); t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 128)}px`; }
    onEnter(event) { const ke = event; if (!ke.shiftKey) { ke.preventDefault(); this.send(); } }
    send() { const text = this.inputText().trim(); if (!text || !this.canSend()) return; this.inputText.set(''); this.shouldScrollToBottom = true; this.subs.add(this.chatService.sendMessage(text).subscribe({ next: () => { this.shouldScrollToBottom = true; }, error: (_e) => { } })); }
    useSuggestion(prompt) { this.inputText.set(prompt.text); this.send(); }
    requestEscalation() { this.subs.add(this.chatService.escalate({ trigger: 'CUSTOMER_REQUEST' }).subscribe({ next: () => { this.shouldScrollToBottom = true; }, error: (_e) => { } })); }
    requestClose() { this.closeRequested.emit(); }
    dismissError() { this.chatService._error?.set(null); }
    getSenderLabel(msg) { return SENDER_TYPE_LABELS[msg.senderType] ?? msg.senderType; }
    formatTime(iso) { return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); }
    getStatusLabel() { const s = this.chatService.session(); if (!s) return ''; const map = { OPEN: 'Active', CLOSED: 'Closed', ESCALATED: 'Agent assigned' }; return map[s.status] ?? s.status; }
};
ChatWindowComponent = __decorate([
    Component({
        selector: 'app-chat-window',
        standalone: true,
        imports: [CommonModule, FormsModule, RouterLink],
        template: `<div></div>`,
    })
], ChatWindowComponent);
export { ChatWindowComponent };
