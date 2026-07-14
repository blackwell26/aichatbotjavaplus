import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { HeaderComponent } from '../header/header';
import { SidebarComponent } from '../sidebar/sidebar';
import { FooterComponent } from '../footer/footer';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { SessionTimeoutService } from '../../core/auth/session-timeout.service';

/**
 * ShellComponent — the persistent application frame.
 *
 * Layout:
 *   ┌─────────────── header ──────────────────┐
 *   │ sidebar │ main content + breadcrumbs     │
 *   │         │ <router-outlet>                │
 *   └─────────┴──────── footer ───────────────┘
 *
 * On mobile the sidebar collapses into a drawer toggled by the header hamburger.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    BreadcrumbsComponent,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class ShellComponent implements OnInit {
  private readonly breakpointObserver = inject(BreakpointObserver);

  /** Injecting triggers the effect() inside SessionTimeoutService */
  private readonly _sessionTimeout = inject(SessionTimeoutService);

  readonly sidebarOpen = signal(false);
  readonly isMobile = signal(false);

  ngOnInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .subscribe((state) => {
        this.isMobile.set(state.matches);
        // Close drawer when switching to desktop
        if (!state.matches) {
          this.sidebarOpen.set(false);
        }
      });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
}
