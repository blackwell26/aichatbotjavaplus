import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/auth/auth.service';
import {
  CommunicationPreferences,
  ProfileService,
} from '../../services/profile.service';
import {
  passwordMatchValidator,
  passwordStrengthValidator,
} from '../../../../shared/utils/password.validators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
  ],
  template: `
    <section class="profile-page" aria-labelledby="profile-title">
      <header class="page-header">
        <div>
          <p class="breadcrumb">
            <a routerLink="/home">Home</a> / Profile
          </p>
          <h1 id="profile-title">My Account</h1>
        </div>
      </header>

      <mat-tab-group animationDuration="200ms">
        <!-- ── Personal information ─────────────────────────── -->
        <mat-tab label="Personal info">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Personal information</mat-card-title>
                <mat-card-subtitle>
                  Update your name, phone, and email.
                </mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                @if (profileSuccess()) {
                  <div class="banner success" role="status">
                    <mat-icon aria-hidden="true">check_circle_outline</mat-icon>
                    {{ profileSuccess() }}
                  </div>
                }
                @if (profileError()) {
                  <div class="banner error" role="alert">
                    <mat-icon aria-hidden="true">error_outline</mat-icon>
                    {{ profileError() }}
                  </div>
                }

                <form
                  [formGroup]="profileForm"
                  (ngSubmit)="saveProfile()"
                  novalidate
                  class="form-grid"
                >
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Full name</mat-label>
                    <input matInput formControlName="name" autocomplete="name" />
                    @if (profileForm.controls.name.hasError('required') && profileForm.controls.name.touched) {
                      <mat-error>Name is required.</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Email address</mat-label>
                    <input matInput type="email" [value]="user()?.email ?? ''" disabled />
                    <mat-hint>Contact support to change your email.</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Phone number (optional)</mat-label>
                    <input matInput type="tel" formControlName="phone" autocomplete="tel" />
                    @if (profileForm.controls.phone.hasError('pattern') && profileForm.controls.phone.touched) {
                      <mat-error>Enter a valid phone number.</mat-error>
                    }
                  </mat-form-field>

                  <div class="form-actions">
                    <button
                      mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="savingProfile()"
                      aria-label="Save personal information"
                    >
                      @if (savingProfile()) {
                        <mat-spinner diameter="18" />
                      } @else {
                        Save changes
                      }
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- ── Communication preferences ──────────────────────── -->
        <mat-tab label="Preferences">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Communication preferences</mat-card-title>
                <mat-card-subtitle>
                  Choose how we contact you.
                </mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                @if (prefsSuccess()) {
                  <div class="banner success" role="status">
                    <mat-icon aria-hidden="true">check_circle_outline</mat-icon>
                    {{ prefsSuccess() }}
                  </div>
                }

                <form
                  [formGroup]="prefsForm"
                  (ngSubmit)="savePrefs()"
                  novalidate
                  class="form-grid"
                >
                  <mat-checkbox formControlName="orderUpdates">
                    Order updates and shipping notifications
                  </mat-checkbox>
                  <mat-checkbox formControlName="supportNotifications">
                    Support ticket updates
                  </mat-checkbox>
                  <mat-checkbox formControlName="emailMarketing">
                    Promotional emails and offers
                  </mat-checkbox>

                  <div class="form-actions">
                    <button
                      mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="savingPrefs()"
                      aria-label="Save communication preferences"
                    >
                      @if (savingPrefs()) {
                        <mat-spinner diameter="18" />
                      } @else {
                        Save preferences
                      }
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- ── Change password ─────────────────────────────────── -->
        <mat-tab label="Security">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Change password</mat-card-title>
                <mat-card-subtitle>
                  Use a strong password you don't use elsewhere.
                </mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                @if (passwordSuccess()) {
                  <div class="banner success" role="status">
                    <mat-icon aria-hidden="true">check_circle_outline</mat-icon>
                    {{ passwordSuccess() }}
                  </div>
                }
                @if (passwordError()) {
                  <div class="banner error" role="alert">
                    <mat-icon aria-hidden="true">error_outline</mat-icon>
                    {{ passwordError() }}
                  </div>
                }

                <form
                  [formGroup]="passwordForm"
                  (ngSubmit)="changePassword()"
                  novalidate
                  class="form-grid"
                >
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Current password</mat-label>
                    <input
                      matInput
                      [type]="hideCurrentPw() ? 'password' : 'text'"
                      formControlName="currentPassword"
                      autocomplete="current-password"
                    />
                    <button
                      mat-icon-button
                      matSuffix
                      type="button"
                      (click)="hideCurrentPw.set(!hideCurrentPw())"
                      [attr.aria-label]="hideCurrentPw() ? 'Show current password' : 'Hide current password'"
                    >
                      <mat-icon>{{ hideCurrentPw() ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                    @if (passwordForm.controls.currentPassword.hasError('required') && passwordForm.controls.currentPassword.touched) {
                      <mat-error>Current password is required.</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>New password</mat-label>
                    <input
                      matInput
                      [type]="hideNewPw() ? 'password' : 'text'"
                      formControlName="newPassword"
                      autocomplete="new-password"
                    />
                    <button
                      mat-icon-button
                      matSuffix
                      type="button"
                      (click)="hideNewPw.set(!hideNewPw())"
                      [attr.aria-label]="hideNewPw() ? 'Show new password' : 'Hide new password'"
                    >
                      <mat-icon>{{ hideNewPw() ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                    @if (passwordForm.controls.newPassword.touched && newPasswordErrors().length) {
                      <mat-error>Password must include: {{ newPasswordErrors().join(', ') }}.</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Confirm new password</mat-label>
                    <input
                      matInput
                      [type]="hideConfirmPw() ? 'password' : 'text'"
                      formControlName="confirmPassword"
                      autocomplete="new-password"
                    />
                    <button
                      mat-icon-button
                      matSuffix
                      type="button"
                      (click)="hideConfirmPw.set(!hideConfirmPw())"
                      [attr.aria-label]="hideConfirmPw() ? 'Show confirm password' : 'Hide confirm password'"
                    >
                      <mat-icon>{{ hideConfirmPw() ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                    @if (passwordForm.hasError('passwordMismatch') && passwordForm.controls.confirmPassword.touched) {
                      <mat-error>Passwords do not match.</mat-error>
                    }
                  </mat-form-field>

                  <div class="form-actions">
                    <button
                      mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="savingPassword()"
                      aria-label="Update password"
                    >
                      @if (savingPassword()) {
                        <mat-spinner diameter="18" />
                      } @else {
                        Update password
                      }
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card class="privacy-card">
              <mat-card-header>
                <mat-card-title>Privacy settings</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p class="hint-text">
                  To request data export or account deletion, please
                  <a routerLink="/home/support-tickets">contact support</a>.
                </p>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </section>
  `,
  styles: [
    `
      .profile-page {
        display: grid;
        gap: 1.5rem;
        max-width: 52rem;
        margin: 0 auto;
        padding: 1.5rem 1rem;
      }

      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }

      .breadcrumb {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-medium);
        margin: 0 0 0.5rem;
      }

      .breadcrumb a {
        color: var(--mat-sys-primary);
        text-decoration: none;
      }

      h1 {
        font: var(--mat-sys-headline-medium);
        margin: 0;
      }

      .tab-content {
        display: grid;
        gap: 1.5rem;
        padding: 1.5rem 0;
      }

      mat-card-content {
        padding-top: 1rem !important;
      }

      .form-grid {
        display: grid;
        gap: 0.5rem;
      }

      .full-width {
        width: 100%;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.5rem;
      }

      .banner {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border-radius: 6px;
        font: var(--mat-sys-body-medium);
        margin-bottom: 1rem;
        padding: 0.75rem 1rem;
      }

      .banner.success {
        background: var(--mat-sys-secondary-container);
        color: var(--mat-sys-on-secondary-container);
      }

      .banner.error {
        background: var(--mat-sys-error-container);
        color: var(--mat-sys-on-error-container);
      }

      .hint-text {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
        margin: 0;
      }

      .hint-text a {
        color: var(--mat-sys-primary);
      }

      .privacy-card {
        margin-top: 0;
      }

      mat-checkbox {
        display: block;
        margin-bottom: 0.75rem;
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileSvc = inject(ProfileService);
  readonly user = inject(AuthService).user;

  // ── Signals ────────────────────────────────────────────────────────────────
  readonly profileSuccess = signal<string | null>(null);
  readonly profileError = signal<string | null>(null);
  readonly savingProfile = signal(false);

  readonly prefsSuccess = signal<string | null>(null);
  readonly savingPrefs = signal(false);

  readonly passwordSuccess = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);
  readonly savingPassword = signal(false);
  readonly hideCurrentPw = signal(true);
  readonly hideNewPw = signal(true);
  readonly hideConfirmPw = signal(true);

  // ── Forms ──────────────────────────────────────────────────────────────────
  readonly profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    phone: ['', Validators.pattern(/^\+?[\d\s\-().]{7,20}$/)],
  });

  readonly prefsForm = this.fb.nonNullable.group({
    orderUpdates: [true],
    supportNotifications: [true],
    emailMarketing: [false],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, passwordStrengthValidator()]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator() }
  );

  ngOnInit(): void {
    this.profileSvc.getProfile().subscribe({
      next: (res) => {
        this.profileForm.patchValue({ name: res.data.name });
        const prefs = (res.data as { communicationPreferences?: CommunicationPreferences })
          .communicationPreferences;
        if (prefs) {
          this.prefsForm.patchValue(prefs);
        }
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.savingProfile.set(true);
    this.profileError.set(null);
    const { name, phone } = this.profileForm.getRawValue();
    this.profileSvc
      .updateProfile({ name, ...(phone ? { phone } : {}) })
      .subscribe({
        next: () => {
          this.profileSuccess.set('Profile updated successfully.');
          this.savingProfile.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.profileError.set(err?.error?.message ?? 'Failed to update profile.');
          this.savingProfile.set(false);
        },
      });
  }

  savePrefs(): void {
    this.savingPrefs.set(true);
    const prefs: CommunicationPreferences = this.prefsForm.getRawValue();
    this.profileSvc.updateProfile({ communicationPreferences: prefs }).subscribe({
      next: () => {
        this.prefsSuccess.set('Preferences saved.');
        this.savingPrefs.set(false);
      },
      error: () => {
        this.savingPrefs.set(false);
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.savingPassword.set(true);
    this.passwordError.set(null);
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.profileSvc.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.passwordSuccess.set('Password updated successfully.');
        this.passwordForm.reset();
        this.savingPassword.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.passwordError.set(
          err?.status === 401
            ? 'Current password is incorrect.'
            : (err?.error?.message ?? 'Failed to update password.')
        );
        this.savingPassword.set(false);
      },
    });
  }

  newPasswordErrors(): string[] {
    const errs = this.passwordForm.controls.newPassword.errors?.['passwordStrength'];
    if (!errs) return [];
    const messages: string[] = [];
    if (errs['minLength']) messages.push('at least 8 characters');
    if (errs['uppercase']) messages.push('one uppercase letter');
    if (errs['lowercase']) messages.push('one lowercase letter');
    if (errs['digit']) messages.push('one number');
    if (errs['specialChar']) messages.push('one special character');
    return messages;
  }
}
