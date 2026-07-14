import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export type SessionTimeoutDialogResult = 'extend' | 'logout';

/**
 * Dialog shown when the user's session is about to expire (WEB-GEN-006).
 * Opened by SessionTimeoutService; result drives extend vs. logout.
 */
@Component({
  selector: 'app-session-timeout-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Your session is about to expire</h2>
    <mat-dialog-content>
      <p>For your security, you will be signed out shortly due to inactivity.</p>
      <p>Would you like to stay signed in?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close('logout')">Sign out</button>
      <button mat-raised-button color="primary" (click)="close('extend')">
        Stay signed in
      </button>
    </mat-dialog-actions>
  `,
})
export class SessionTimeoutDialogComponent {
  private readonly dialogRef =
    inject<MatDialogRef<SessionTimeoutDialogComponent, SessionTimeoutDialogResult>>(MatDialogRef);

  close(result: SessionTimeoutDialogResult): void {
    this.dialogRef.close(result);
  }
}
