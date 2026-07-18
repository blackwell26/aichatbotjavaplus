import { __decorate } from "tslib";
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { ChatWindowComponent } from '../chat-window/chat-window';
let ChatLauncherComponent = class ChatLauncherComponent {
    auth = inject(AuthService);
    isOpen = signal(false);
    unreadCount = signal(0);
    ngOnInit() { }
    toggle() {
        this.isOpen.update((v) => !v);
        if (this.isOpen()) {
            this.unreadCount.set(0);
        }
    }
    close() {
        this.isOpen.set(false);
    }
    notifyUnread() {
        if (!this.isOpen()) {
            this.unreadCount.update((n) => n + 1);
        }
    }
    ngOnDestroy() { }
};
ChatLauncherComponent = __decorate([
    Component({
        selector: 'app-chat-launcher',
        standalone: true,
        imports: [CommonModule, ChatWindowComponent],
        template: `<ng-container></ng-container>`,
    })
], ChatLauncherComponent);
export { ChatLauncherComponent };
