import { __decorate } from "tslib";
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/auth/auth.service';
import { RbacService } from '../../core/services/rbac.service';
import { NotificationAreaComponent } from '../notifications/notification-area.component';
let HeaderComponent = class HeaderComponent {
    menuToggle = new EventEmitter();
    auth = inject(AuthService);
    rbac = inject(RbacService);
};
__decorate([
    Output()
], HeaderComponent.prototype, "menuToggle", void 0);
HeaderComponent = __decorate([
    Component({
        selector: 'app-header',
        standalone: true,
        imports: [
            CommonModule,
            RouterLink,
            MatToolbarModule,
            MatButtonModule,
            MatIconModule,
            MatMenuModule,
            MatDividerModule,
            NotificationAreaComponent,
        ],
        templateUrl: './header.html',
        styleUrl: './header.scss',
    })
], HeaderComponent);
export { HeaderComponent };
