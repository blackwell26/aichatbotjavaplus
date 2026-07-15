import { __decorate } from "tslib";
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../auth.service';
let LoginComponent = class LoginComponent {
    fb = inject(FormBuilder);
    auth = inject(AuthService);
    router = inject(Router);
    route = inject(ActivatedRoute);
    loading = this.auth.loading;
    errorMessage = signal(null);
    hidePassword = signal(true);
    form = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
    });
    get emailCtrl() {
        return this.form.controls.email;
    }
    get passwordCtrl() {
        return this.form.controls.password;
    }
    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.errorMessage.set(null);
        const { email, password } = this.form.getRawValue();
        this.auth.login({ email, password }).subscribe({
            next: () => {
                const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/home';
                this.router.navigateByUrl(returnUrl);
            },
            error: (err) => {
                const msg = err?.error?.message ??
                    (err?.status === 401
                        ? 'Invalid email or password.'
                        : 'Sign in failed. Please try again.');
                this.errorMessage.set(msg);
            },
        });
    }
};
LoginComponent = __decorate([
    Component({
        selector: 'app-login',
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
            MatCheckboxModule,
            MatIconModule,
        ],
        templateUrl: './login.html',
        styleUrl: './login.scss',
    })
], LoginComponent);
export { LoginComponent };
