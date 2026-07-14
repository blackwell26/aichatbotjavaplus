import { Injectable, effect, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from './auth.service';
import {
  SessionTimeoutDialogComponent,
  SessionTimeoutDialogResult,
} from './session-timeout-dialog.component';

/**
 * Watches AuthService.sessionWarning and opens the timeout dialog.
 * Must be instantiated at the root level (e.g. in AppComponent or ShellComponent).
 */
@Injectable({ providedIn: 'root' })
export class SessionTimeoutService {
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  private dialogOpen = false;

  constructor() {
    // React to the sessionWarning signal using an Angular effect
    effect(() => {
      const warning = this.auth.sessionWarning();
      if (warning && !this.dialogOpen) {
        this.openDialog();
      }
    });
  }

  private openDialog(): void {
    this.dialogOpen = true;
    const ref = this.dialog.open<
      SessionTimeoutDialogComponent,
      void,
      SessionTimeoutDialogResult
    >(SessionTimeoutDialogComponent, {
      disableClose: true,
      width: '420px',
    });

    ref.afterClosed().subscribe((result) => {
      this.dialogOpen = false;
      if (result === 'extend') {
        this.auth.extendSession();
      } else {
        this.auth.logout();
      }
    });
  }
}
