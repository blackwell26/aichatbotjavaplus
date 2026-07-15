import { __decorate } from "tslib";
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../auth.service';
import { passwordMatchValidator, passwordStrengthValidator, } from '../../../../shared/utils/password.validators';
let RegisterComponent = class RegisterComponent {
    fb = inject(FormBuilder);
    auth = inject(AuthService);
    router = inject(Router);
    loading = this.auth.loading;
    errorMessage = signal(null);
    successMessage = signal(null);
    hidePassword = signal(true);
    hideConfirm = signal(true);
    form = this.fb.nonNullable.group({
        name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.pattern(/^\+?[\d\s\-().]{7,20}$/)]],
        password: ['', [Validators.required, passwordStrengthValidator()]],
        confirmPassword: ['', Validators.required],
    }, { validators: passwordMatchValidator() });
    get nameCtrl() {
        return this.form.controls.name;
    }
    get emailCtrl() {
        return this.form.controls.email;
    }
    get phoneCtrl() {
        return this.form.controls.phone;
    }
    get passwordCtrl() {
        return this.form.controls.password;
    }
    get confirmCtrl() {
        return this.form.controls.confirmPassword;
    }
    passwordErrors() {
        const errs = this.passwordCtrl.errors?.['passwordStrength'];
        if (!errs)
            return [];
        const messages = [];
        if (errs['minLength'])
            messages.push('at least 8 characters');
        if (errs['uppercase'])
            messages.push('one uppercase letter');
        if (errs['lowercase'])
            messages.push('one lowercase letter');
        if (errs['digit'])
            messages.push('one number');
        if (errs['specialChar'])
            messages.push('one special character');
        return messages;
    }
    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.errorMessage.set(null);
        const { name, email, password, phone } = this.form.getRawValue();
        this.auth
            .register({ name, email, password, ...(phone ? { phone } : {}) })
            .subscribe({
            next: () => {
                this.successMessage.set('Account created! Check your email to verify your address, then sign in.');
            },
            error: (err) => {
                const msg = err?.error?.message ??
                    (err?.status === 409
                        ? 'An account with this email already exists.'
                        : 'Registration failed. Please try again.');
                this.errorMessage.set(msg);
            },
        });
    }
};
RegisterComponent = __decorate([
    Component({
        selector: 'app-register',
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
        templateUrl: './register.html',
        styleUrl: './register.scss',
    })
], RegisterComponent);
export { RegisterComponent };
