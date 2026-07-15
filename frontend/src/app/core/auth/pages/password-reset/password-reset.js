import { __decorate } from "tslib";
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../auth.service';
let PasswordResetComponent = class PasswordResetComponent {
    fb = inject(FormBuilder);
    auth = inject(AuthService);
    step = signal('request');
    submitting = signal(false);
    errorMessage = signal(null);
    form = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
    });
    get emailCtrl() {
        return this.form.controls.email;
    }
    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.errorMessage.set(null);
        this.submitting.set(true);
        this.auth.requestPasswordReset({ email: this.form.getRawValue().email }).subscribe({
            next: () => {
                this.submitting.set(false);
                this.step.set('sent');
            },
            error: (err) => {
                this.submitting.set(false);
                this.errorMessage.set(err?.error?.message ?? 'Could not send reset email. Please try again.');
            },
        });
    }
};
PasswordResetComponent = __decorate([
    Component({
        selector: 'app-password-reset',
        standalone: true,
        imports: [
            CommonModule,
            ReactiveFormsModule,
            RouterLink,
            MatButtonModule,
            MatCardModule,
            MatFormFieldModule,
            MatInputModule,
            MatProgressSpinnerModule,
            MatIconModule,
        ],
        templateUrl: './password-reset.html',
        styleUrl: './password-reset.scss',
    })
], PasswordResetComponent);
export { PasswordResetComponent };
