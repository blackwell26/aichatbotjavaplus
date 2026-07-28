/**
 * T7.1 – User Management page.
 *
 * Allows administrators to:
 *  - Browse and search the user list with role / status filters
 *  - Create a new user account
 *  - View and edit a selected user
 *  - Activate or deactivate a user account
 *
 * WEB-ADM-001 / WEB-SEC-002
 */
import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../../core/models/user.model';
import {
  ACCOUNT_STATUS_LABELS,
  ROLE_LABELS,
  AccountStatus,
  AdminUser,
  AdminUserSummary,
  CreateUserRequest,
  UpdateUserRequest,
} from '../../models/admin.model';
import { AdminService } from '../../services/admin.service';

type PageView = 'list' | 'create' | 'detail';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <section class="page">
      <!-- ── Header ──────────────────────────────────────────────── -->
      <header class="page__header">
        <div>
          <h1>User Management</h1>
          <p>Manage user accounts, roles, and access status.</p>
        </div>
        <button
          *ngIf="view() === 'list'"
          type="button"
          class="btn btn--primary"
          (click)="openCreate()"
        >
          + New user
        </button>
        <button
          *ngIf="view() !== 'list'"
          type="button"
          class="btn"
          (click)="backToList()"
        >
          ← Back
        </button>
      </header>

      <!-- ── Status message ─────────────────────────────────────── -->
      <p class="status-msg" *ngIf="message()" [class.status-msg--error]="isError()">
        {{ message() }}
      </p>

      <!-- ─────────────────────────────────────────────────────────────
           LIST VIEW
           ───────────────────────────────────────────────────────── -->
      <ng-container *ngIf="view() === 'list'">
        <!-- Filters -->
        <div class="filters">
          <label class="field">
            Search
            <input
              type="search"
              [(ngModel)]="searchTerm"
              placeholder="Name or email…"
              (input)="onFilterChange()"
            />
          </label>
          <label class="field">
            Role
            <select [(ngModel)]="filterRole" (change)="onFilterChange()">
              <option value="">All roles</option>
              <option *ngFor="let r of allRoles" [value]="r">{{ roleLabel(r) }}</option>
            </select>
          </label>
          <label class="field">
            Status
            <select [(ngModel)]="filterStatus" (change)="onFilterChange()">
              <option value="">All statuses</option>
              <option *ngFor="let s of allStatuses" [value]="s">{{ statusLabel(s) }}</option>
            </select>
          </label>
          <button type="button" class="btn btn--sm" (click)="loadUsers()">Refresh</button>
        </div>

        <!-- User table -->
        <div class="table-wrap">
          <p class="loading-msg" *ngIf="loading()">Loading…</p>
          <table *ngIf="!loading()">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Last login</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of users()">
                <td>{{ u.displayName }}</td>
                <td>{{ u.email }}</td>
                <td>
                  <span *ngFor="let r of u.roles" class="badge badge--role">
                    {{ roleLabel(r) }}
                  </span>
                </td>
                <td>
                  <span class="badge" [class]="statusClass(u.status)">
                    {{ statusLabel(u.status) }}
                  </span>
                </td>
                <td>{{ u.lastLoginAt ? (u.lastLoginAt | date: 'medium') : '—' }}</td>
                <td>{{ u.createdAt | date: 'mediumDate' }}</td>
                <td class="actions">
                  <button type="button" class="btn btn--sm" (click)="openDetail(u)">
                    View
                  </button>
                </td>
              </tr>
              <tr *ngIf="users().length === 0">
                <td colspan="7" class="empty">No users found.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <nav class="pagination" *ngIf="totalPages() > 1" aria-label="User list pagination">
          <button
            type="button"
            class="btn btn--sm"
            [disabled]="currentPage() === 0"
            (click)="changePage(currentPage() - 1)"
          >
            ← Prev
          </button>
          <span>Page {{ currentPage() + 1 }} of {{ totalPages() }}</span>
          <button
            type="button"
            class="btn btn--sm"
            [disabled]="currentPage() >= totalPages() - 1"
            (click)="changePage(currentPage() + 1)"
          >
            Next →
          </button>
        </nav>
      </ng-container>

      <!-- ─────────────────────────────────────────────────────────────
           CREATE VIEW
           ───────────────────────────────────────────────────────── -->
      <ng-container *ngIf="view() === 'create'">
        <form class="form-card" (ngSubmit)="submitCreate()" #createForm="ngForm" novalidate>
          <h2>Create user</h2>
          <div class="form-row">
            <label class="field">
              First name *
              <input
                type="text"
                name="firstName"
                [(ngModel)]="draft.firstName"
                required
                minlength="1"
                maxlength="100"
                #fnCtrl="ngModel"
              />
              <span class="field__error" *ngIf="fnCtrl.invalid && fnCtrl.touched">Required.</span>
            </label>
            <label class="field">
              Last name *
              <input
                type="text"
                name="lastName"
                [(ngModel)]="draft.lastName"
                required
                minlength="1"
                maxlength="100"
                #lnCtrl="ngModel"
              />
              <span class="field__error" *ngIf="lnCtrl.invalid && lnCtrl.touched">Required.</span>
            </label>
          </div>
          <label class="field">
            Email *
            <input
              type="email"
              name="email"
              [(ngModel)]="draft.email"
              required
              email
              #emailCtrl="ngModel"
            />
            <span class="field__error" *ngIf="emailCtrl.invalid && emailCtrl.touched">
              Valid email required.
            </span>
          </label>
          <label class="field">
            Password *
            <input
              type="password"
              name="password"
              [(ngModel)]="draft.password"
              required
              minlength="8"
              autocomplete="new-password"
              #pwCtrl="ngModel"
            />
            <span class="field__error" *ngIf="pwCtrl.invalid && pwCtrl.touched">
              Minimum 8 characters.
            </span>
          </label>
          <label class="field">
            Phone
            <input
              type="tel"
              name="phoneNumber"
              [(ngModel)]="draft.phoneNumber"
            />
          </label>
          <fieldset class="field">
            <legend>Roles</legend>
            <div class="checkbox-group">
              <label *ngFor="let r of allRoles" class="checkbox-item">
                <input
                  type="checkbox"
                  [checked]="draft.roles.includes(r)"
                  (change)="toggleDraftRole(r)"
                />
                {{ roleLabel(r) }}
              </label>
            </div>
          </fieldset>
          <div class="form-actions">
            <button type="button" class="btn" (click)="backToList()">Cancel</button>
            <button
              type="submit"
              class="btn btn--primary"
              [disabled]="createForm.invalid || saving()"
            >
              {{ saving() ? 'Creating…' : 'Create user' }}
            </button>
          </div>
        </form>
      </ng-container>

      <!-- ─────────────────────────────────────────────────────────────
           DETAIL / EDIT VIEW
           ───────────────────────────────────────────────────────── -->
      <ng-container *ngIf="view() === 'detail' && selectedUser()">
        <div class="detail-card">
          <div class="detail-header">
            <div>
              <h2>{{ selectedUser()!.displayName }}</h2>
              <p class="detail-email">{{ selectedUser()!.email }}</p>
            </div>
            <span class="badge" [class]="statusClass(selectedUser()!.status)">
              {{ statusLabel(selectedUser()!.status) }}
            </span>
          </div>

          <dl class="meta-grid">
            <div>
              <dt>First name</dt>
              <dd>{{ selectedUser()!.firstName }}</dd>
            </div>
            <div>
              <dt>Last name</dt>
              <dd>{{ selectedUser()!.lastName }}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{{ selectedUser()!.phoneNumber || '—' }}</dd>
            </div>
            <div>
              <dt>Email verified</dt>
              <dd>{{ selectedUser()!.emailVerified ? 'Yes' : 'No' }}</dd>
            </div>
            <div>
              <dt>Roles</dt>
              <dd>
                <span *ngFor="let r of selectedUser()!.roles" class="badge badge--role">
                  {{ roleLabel(r) }}
                </span>
              </dd>
            </div>
            <div>
              <dt>Last login</dt>
              <dd>{{ selectedUser()!.lastLoginAt ? (selectedUser()!.lastLoginAt | date: 'medium') : '—' }}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{{ selectedUser()!.createdAt | date: 'medium' }}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{{ selectedUser()!.updatedAt | date: 'medium' }}</dd>
            </div>
          </dl>

          <!-- Inline edit form -->
          <form class="edit-form" (ngSubmit)="submitUpdate()" #editForm="ngForm" novalidate>
            <h3>Edit details</h3>
            <div class="form-row">
              <label class="field">
                First name *
                <input
                  type="text"
                  name="editFirstName"
                  [(ngModel)]="editDraft.firstName"
                  required
                  minlength="1"
                  maxlength="100"
                  #efnCtrl="ngModel"
                />
                <span class="field__error" *ngIf="efnCtrl.invalid && efnCtrl.touched">Required.</span>
              </label>
              <label class="field">
                Last name *
                <input
                  type="text"
                  name="editLastName"
                  [(ngModel)]="editDraft.lastName"
                  required
                  minlength="1"
                  maxlength="100"
                  #elnCtrl="ngModel"
                />
                <span class="field__error" *ngIf="elnCtrl.invalid && elnCtrl.touched">Required.</span>
              </label>
            </div>
            <label class="field">
              Phone
              <input type="tel" name="editPhone" [(ngModel)]="editDraft.phoneNumber" />
            </label>
            <div class="form-actions">
              <button
                type="submit"
                class="btn btn--primary"
                [disabled]="editForm.invalid || saving()"
              >
                {{ saving() ? 'Saving…' : 'Save changes' }}
              </button>
            </div>
          </form>

          <!-- Status actions -->
          <div class="status-actions">
            <h3>Account status</h3>
            <p>Current status: <strong>{{ statusLabel(selectedUser()!.status) }}</strong></p>
            <div class="form-actions">
              <button
                *ngIf="selectedUser()!.status !== 'ACTIVE'"
                type="button"
                class="btn btn--success"
                [disabled]="saving()"
                (click)="activateUser()"
              >
                Activate
              </button>
              <button
                *ngIf="selectedUser()!.status === 'ACTIVE'"
                type="button"
                class="btn btn--danger"
                [disabled]="saving()"
                (click)="deactivateUser()"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      </ng-container>
    </section>
  `,
  styles: [
    `
      .page { display: grid; gap: 1.25rem; padding: 1rem 0; }
      .page__header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; }
      .filters { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: flex-end; }
      .field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; }
      .field input,
      .field select { padding: 0.4rem 0.6rem; border: 1px solid var(--mat-sys-outline-variant, #ccc); border-radius: 4px; min-width: 12rem; }
      .field__error { color: #d32f2f; font-size: 0.8rem; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 0.65rem 0.75rem; border-bottom: 1px solid var(--mat-sys-outline-variant, #eee); font-size: 0.9rem; }
      th { font-weight: 600; background: var(--mat-sys-surface-variant, #f5f5f5); }
      td.empty { text-align: center; color: #888; padding: 2rem; }
      td.actions { white-space: nowrap; }
      .loading-msg { color: #888; padding: 2rem 0; text-align: center; }
      .pagination { display: flex; gap: 0.75rem; align-items: center; justify-content: flex-end; }
      .status-msg { padding: 0.6rem 1rem; border-radius: 4px; background: #e8f5e9; color: #2e7d32; }
      .status-msg--error { background: #ffebee; color: #c62828; }
      .badge { display: inline-block; padding: 0.2rem 0.55rem; border-radius: 12px; font-size: 0.78rem; font-weight: 500; }
      .badge--role { background: #e3f2fd; color: #1565c0; margin: 0.1rem; }
      .badge--active { background: #e8f5e9; color: #2e7d32; }
      .badge--inactive, .badge--suspended { background: #ffebee; color: #c62828; }
      .badge--pending { background: #fff8e1; color: #f57f17; }
      .btn { padding: 0.45rem 0.9rem; border: 1px solid var(--mat-sys-outline-variant, #ccc); border-radius: 4px; cursor: pointer; background: #fff; font-size: 0.875rem; }
      .btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .btn--primary { background: #1565c0; color: #fff; border-color: #1565c0; }
      .btn--success { background: #2e7d32; color: #fff; border-color: #2e7d32; }
      .btn--danger { background: #c62828; color: #fff; border-color: #c62828; }
      .btn--sm { padding: 0.3rem 0.65rem; font-size: 0.8rem; }
      .form-card, .detail-card { background: var(--mat-sys-surface, #fff); border: 1px solid var(--mat-sys-outline-variant, #eee); border-radius: 8px; padding: 1.5rem; display: grid; gap: 1rem; max-width: 640px; }
      .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
      .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 0.5rem; }
      .checkbox-group { display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.5rem 0; }
      .checkbox-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.9rem; cursor: pointer; }
      fieldset { border: 1px solid var(--mat-sys-outline-variant, #ccc); border-radius: 4px; padding: 0.5rem 0.75rem; }
      legend { font-size: 0.875rem; padding: 0 0.25rem; }
      .detail-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
      .detail-email { margin: 0; color: #555; font-size: 0.9rem; }
      .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: 0.75rem; margin: 0; }
      .meta-grid > div { border: 1px solid var(--mat-sys-outline-variant, #eee); border-radius: 4px; padding: 0.6rem 0.75rem; }
      dt { font-size: 0.8rem; color: #666; }
      dd { margin: 0.2rem 0 0; font-size: 0.95rem; }
      .edit-form, .status-actions { border-top: 1px solid var(--mat-sys-outline-variant, #eee); padding-top: 1rem; display: grid; gap: 0.75rem; }
    `,
  ],
})
export class UsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  // ── View state ─────────────────────────────────────────────────────────────
  readonly view = signal<PageView>('list');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly isError = signal(false);

  // ── List state ─────────────────────────────────────────────────────────────
  readonly users = signal<AdminUserSummary[]>([]);
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);

  searchTerm = '';
  filterRole: Role | '' = '';
  filterStatus: AccountStatus | '' = '';

  // ── Detail state ───────────────────────────────────────────────────────────
  readonly selectedUser = signal<AdminUser | null>(null);
  editDraft: UpdateUserRequest = {};

  // ── Create draft ───────────────────────────────────────────────────────────
  draft: CreateUserRequest = {
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    roles: [],
    phoneNumber: '',
  };

  // ── Reference data ─────────────────────────────────────────────────────────
  readonly allRoles = Object.values(Role);
  readonly allStatuses: AccountStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'];

  ngOnInit(): void {
    this.loadUsers();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  roleLabel(r: Role): string {
    return ROLE_LABELS[r] ?? r;
  }

  statusLabel(s: AccountStatus): string {
    return ACCOUNT_STATUS_LABELS[s] ?? s;
  }

  statusClass(s: AccountStatus): string {
    return `badge--${s.toLowerCase()}`;
  }

  // ── List actions ───────────────────────────────────────────────────────────

  loadUsers(): void {
    this.loading.set(true);
    this.clearMessage();
    this.adminService
      .listUsers({
        search: this.searchTerm || undefined,
        role: this.filterRole || undefined,
        status: this.filterStatus || undefined,
        page: this.currentPage(),
        pageSize: 20,
      })
      .subscribe({
        next: (resp) => {
          this.users.set(resp.data);
          this.totalPages.set(resp.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.showError('Failed to load users.');
          this.loading.set(false);
        },
      });
  }

  onFilterChange(): void {
    this.currentPage.set(0);
    this.loadUsers();
  }

  changePage(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  openCreate(): void {
    this.draft = {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      roles: [],
      phoneNumber: '',
    };
    this.clearMessage();
    this.view.set('create');
  }

  openDetail(summary: AdminUserSummary): void {
    this.clearMessage();
    this.adminService.getUser(summary.id).subscribe({
      next: (resp) => {
        this.selectedUser.set(resp.data);
        this.editDraft = {
          firstName: resp.data.firstName,
          lastName: resp.data.lastName,
          phoneNumber: resp.data.phoneNumber ?? '',
        };
        this.view.set('detail');
      },
      error: () => this.showError('Failed to load user details.'),
    });
  }

  backToList(): void {
    this.clearMessage();
    this.view.set('list');
    this.selectedUser.set(null);
    this.loadUsers();
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  toggleDraftRole(role: Role): void {
    if (this.draft.roles.includes(role)) {
      this.draft.roles = this.draft.roles.filter((r) => r !== role);
    } else {
      this.draft.roles = [...this.draft.roles, role];
    }
  }

  submitCreate(): void {
    this.saving.set(true);
    this.clearMessage();
    this.adminService.createUser(this.draft).subscribe({
      next: (resp) => {
        this.saving.set(false);
        this.showSuccess(`User ${resp.data.email} created successfully.`);
        this.view.set('list');
        this.loadUsers();
      },
      error: () => {
        this.showError('Failed to create user.');
        this.saving.set(false);
      },
    });
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  submitUpdate(): void {
    const user = this.selectedUser();
    if (!user) return;
    this.saving.set(true);
    this.clearMessage();
    this.adminService.updateUser(user.id, this.editDraft).subscribe({
      next: (resp) => {
        this.selectedUser.set(resp.data);
        this.saving.set(false);
        this.showSuccess('User updated.');
      },
      error: () => {
        this.showError('Failed to update user.');
        this.saving.set(false);
      },
    });
  }

  // ── Activate / Deactivate ──────────────────────────────────────────────────

  activateUser(): void {
    const user = this.selectedUser();
    if (!user) return;
    this.saving.set(true);
    this.clearMessage();
    this.adminService.activateUser(user.id).subscribe({
      next: (resp) => {
        this.selectedUser.set(resp.data);
        this.saving.set(false);
        this.showSuccess('User activated.');
      },
      error: () => {
        this.showError('Failed to activate user.');
        this.saving.set(false);
      },
    });
  }

  deactivateUser(): void {
    const user = this.selectedUser();
    if (!user) return;
    if (!confirm(`Deactivate ${user.displayName}? They will no longer be able to sign in.`)) return;
    this.saving.set(true);
    this.clearMessage();
    this.adminService.deactivateUser(user.id).subscribe({
      next: (resp) => {
        this.selectedUser.set(resp.data);
        this.saving.set(false);
        this.showSuccess('User deactivated.');
      },
      error: () => {
        this.showError('Failed to deactivate user.');
        this.saving.set(false);
      },
    });
  }

  // ── Messages ───────────────────────────────────────────────────────────────

  private showSuccess(msg: string): void {
    this.isError.set(false);
    this.message.set(msg);
  }

  private showError(msg: string): void {
    this.isError.set(true);
    this.message.set(msg);
  }

  private clearMessage(): void {
    this.message.set('');
    this.isError.set(false);
  }
}
