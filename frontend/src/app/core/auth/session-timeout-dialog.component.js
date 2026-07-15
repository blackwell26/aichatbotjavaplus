import { __decorate } from "tslib";
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
/**
 * Dialog shown when the user's session is about to expire (WEB-GEN-006).
 * Opened by SessionTimeoutService; result drives extend vs. logout.
 */
let SessionTimeoutDialogComponent = class SessionTimeoutDialogComponent {
    dialogRef = inject(MatDialogRef);
    close(result) {
        this.dialogRef.close(result);
    }
};
SessionTimeoutDialogComponent = __decorate([
    Component({
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
], SessionTimeoutDialogComponent);
export { SessionTimeoutDialogComponent };
