import { __decorate } from "tslib";
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { HeaderComponent } from '../header/header';
import { SidebarComponent } from '../sidebar/sidebar';
import { FooterComponent } from '../footer/footer';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { SessionTimeoutService } from '../../core/auth/session-timeout.service';
import { ChatLauncherComponent } from '../../features/chat/components/chat-launcher/chat-launcher';
/**
 * ShellComponent — the persistent application frame.
 * Phase 4: ChatLauncherComponent added for persistent chat FAB.
 */
let ShellComponent = class ShellComponent {
    breakpointObserver = inject(BreakpointObserver);
    _sessionTimeout = inject(SessionTimeoutService);
    sidebarOpen = signal(false);
    isMobile = signal(false);
    ngOnInit() {
        this.breakpointObserver
            .observe([Breakpoints.XSmall, Breakpoints.Small])
            .subscribe((state) => {
            this.isMobile.set(state.matches);
            if (!state.matches) {
                this.sidebarOpen.set(false);
            }
        });
    }
    toggleSidebar() {
        this.sidebarOpen.update((v) => !v);
    }
};
ShellComponent = __decorate([
    Component({
        selector: 'app-shell',
        standalone: true,
        imports: [
            RouterOutlet,
            HeaderComponent,
            SidebarComponent,
            FooterComponent,
            BreadcrumbsComponent,
            ChatLauncherComponent,
        ],
        templateUrl: './shell.html',
        styleUrl: './shell.scss',
    })
], ShellComponent);
export { ShellComponent };
