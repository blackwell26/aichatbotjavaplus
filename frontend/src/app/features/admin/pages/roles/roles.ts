/**
 * T7.2 – Role Management page.
 *
 * Allows administrators to:
 *  - View a summary of all roles and their current user counts
 *  - Select a role and browse the users who hold it
 *  - Assign or revoke roles for any user
 *
 * WEB-ADM-001 / WEB-SEC-002
 */
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../../core/models/user.model';
import {
  ROLE_LABELS,
  AdminUserSummary,
  AssignRolesRequest,
  RoleSummary,
} from '../../models/admin.model';
import { AdminService } from '../../services/admin.service';

type PageView = 'summary' | 'role-users' | 'edit-roles';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <!-- ── Header ──────────────────────────────────────────────── -->
      <header class="page__header">
        <div>
          <h1>Role Management</h1>
          <p>View role assignments and manage user permissions.</p>
        </div>
        <div class="header-nav">
          <button
            *ngIf="view() !== 'summary'"
            type="button"
            class="btn"
            (click)="backToSummary()"
          >
            ← Back
          </button>
          <button
            *ngIf="view() === 'role-users'"
            type="button"
            class="btn btn--sm"
            (click)="loadRoleUsers(selectedRole()!)"
          >
            Refresh
          </button>
        </div>
      </header>

      <!-- ── Status message ─────────────────────────────────────── -->
      <p class="status-msg" *ngIf="message()" [class.status-msg--error]="isError()">
        {{ message() }}
      </p>

      <!-- ─────────────────────────────────────────────────────────────
           SUMMARY VIEW – role cards
           ───────────────────────────────────────────────────────── -->
      <ng-container *ngIf="view() === 'summary'">
        <p class="loading-msg" *ngIf="loading()">Loading roles…</p>
        <div class="role-grid" *ngIf="!loading()">
          <button
            *ngFor="let rs of roleSummaries()"
            type="button"
            class="role-card"
            (click)="openRoleUsers(rs.role)"
          >
            <div class="role-card__label">{{ rs.label }}</div>
            <div class="role-card__count">{{ rs.userCount }} users</div>
            <div class="role-card__desc">{{ rs.description }}</div>
          </button>
        </div>
      </ng-container>

      <!-- ─────────────────────────────────────────────────────────────
           ROLE USERS VIEW – list of users with this role
           ───────────────────────────────────────────────────────── -->
      <ng-container *ngIf="view() === 'role-users'">
        <h2 class="role-title">
          Users with role: <span class="badge badge--role">{{ roleLabel(selectedRole()!) }}</span>
        </h2>
        <p class="loading-msg" *ngIf="loading()">Loading…</p>
        <div class="table-wrap" *ngIf="!loading()">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>All roles</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of roleUsers()">
                <td>{{ u.displayName }}</td>
                <td>{{ u.email }}</td>
                <td>
                  <span *ngFor="let r of u.roles" class="badge badge--role">
                    {{ roleLabel(r) }}
                  </span>
                </td>
                <td>
                  <span class="badge" [class]="'badge--' + u.status.toLowerCase()">
                    {{ u.status }}
                  </span>
                </td>
                <td class="actions">
                  <button type="button" class="btn btn--sm" (click)="openEditRoles(u)">
                    Edit roles
                  </button>
                  <button
                    type="button"
                    class="btn btn--sm btn--danger"
                    [disabled]="saving()"
                    (click)="revokeRole(u)"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
              <tr *ngIf="roleUsers().length === 0">
                <td colspan="5" class="empty">No users with this role.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <nav class="pagination" *ngIf="totalPages() > 1" aria-label="Role user list pagination">
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
           EDIT ROLES VIEW – assign / revoke roles for one user
           ───────────────────────────────────────────────────────── -->
      <ng-container *ngIf="view() === 'edit-roles' && editTarget()">
        <div class="form-card">
          <h2>Edit roles for {{ editTarget()!.displayName }}</h2>
          <p class="detail-email">{{ editTarget()!.email }}</p>

          <fieldset class="field">
            <legend>Roles</legend>
            <div class="checkbox-group">
              <label *ngFor="let r of allRoles" class="checkbox-item">
                <input
                  type="checkbox"
                  [checked]="editRoles.includes(r)"
                  (change)="toggleEditRole(r)"
                />
                {{ roleLabel(r) }}
              </label>
            </div>
          </fieldset>

          <div class="form-actions">
            <button type="button" class="btn" (click)="cancelEdit()">Cancel</button>
            <button
              type="button"
              class="btn btn--primary"
              [disabled]="saving()"
              (click)="submitRoles()"
            >
              {{ saving() ? 'Saving…' : 'Save roles' }}
            </button>
          </div>
        </div>
      </ng-container>
    </section>
  `,
  styles: [
    `
      .page { display: grid; gap: 1.25rem; padding: 1rem 0; }
      .page__header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; }
      .header-nav { display: flex; gap: 0.5rem; align-items: center; }
      .loading-msg { color: #888; text-align: center; padding: 2rem 0; }
      .role-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
      .role-card { background: var(--mat-sys-surface, #fff); border: 1px solid var(--mat-sys-outline-variant, #eee); border-radius: 8px; padding: 1rem; text-align: left; cursor: pointer; transition: box-shadow 0.15s; display: grid; gap: 0.25rem; }
      .role-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
      .role-card__label { font-weight: 600; font-size: 1rem; color: #1565c0; }
      .role-card__count { font-size: 1.5rem; font-weight: 700; }
      .role-card__desc { font-size: 0.8rem; color: #666; }
      .role-title { margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 0.65rem 0.75rem; border-bottom: 1px solid var(--mat-sys-outline-variant, #eee); font-size: 0.9rem; }
      th { font-weight: 600; background: var(--mat-sys-surface-variant, #f5f5f5); }
      td.empty { text-align: center; color: #888; padding: 2rem; }
      td.actions { white-space: nowrap; display: flex; gap: 0.4rem; align-items: center; }
      .badge { display: inline-block; padding: 0.2rem 0.55rem; border-radius: 12px; font-size: 0.78rem; font-weight: 500; }
      .badge--role { background: #e3f2fd; color: #1565c0; margin: 0.1rem; }
      .badge--active { background: #e8f5e9; color: #2e7d32; }
      .badge--inactive, .badge--suspended { background: #ffebee; color: #c62828; }
      .badge--pending { background: #fff8e1; color: #f57f17; }
      .pagination { display: flex; gap: 0.75rem; align-items: center; justify-content: flex-end; }
      .status-msg { padding: 0.6rem 1rem; border-radius: 4px; background: #e8f5e9; color: #2e7d32; }
      .status-msg--error { background: #ffebee; color: #c62828; }
      .btn { padding: 0.45rem 0.9rem; border: 1px solid var(--mat-sys-outline-variant, #ccc); border-radius: 4px; cursor: pointer; background: #fff; font-size: 0.875rem; }
      .btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .btn--primary { background: #1565c0; color: #fff; border-color: #1565c0; }
      .btn--danger { background: #c62828; color: #fff; border-color: #c62828; }
      .btn--sm { padding: 0.3rem 0.65rem; font-size: 0.8rem; }
      .form-card { background: var(--mat-sys-surface, #fff); border: 1px solid var(--mat-sys-outline-variant, #eee); border-radius: 8px; padding: 1.5rem; display: grid; gap: 1rem; max-width: 480px; }
      .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 0.5rem; }
      .field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; }
      fieldset { border: 1px solid var(--mat-sys-outline-variant, #ccc); border-radius: 4px; padding: 0.5rem 0.75rem; }
      legend { font-size: 0.875rem; padding: 0 0.25rem; }
      .checkbox-group { display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.5rem 0; }
      .checkbox-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.9rem; cursor: pointer; }
      .detail-email { margin: 0; color: #555; font-size: 0.9rem; }
    `,
  ],
})
export class RolesComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly view = signal<PageView>('summary');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly isError = signal(false);

  readonly roleSummaries = signal<RoleSummary[]>([]);
  readonly selectedRole = signal<Role | null>(null);
  readonly roleUsers = signal<AdminUserSummary[]>([]);
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);

  readonly editTarget = signal<AdminUserSummary | null>(null);
  editRoles: Role[] = [];

  readonly allRoles = Object.values(Role);

  ngOnInit(): void {
    this.loadRoleSummaries();
  }

  roleLabel(r: Role): string {
    return ROLE_LABELS[r] ?? r;
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  loadRoleSummaries(): void {
    this.loading.set(true);
    this.clearMessage();
    this.adminService.listRoles().subscribe({
      next: (resp) => {
        this.roleSummaries.set(resp.data);
        this.loading.set(false);
      },
      error: () => {
        this.showError('Failed to load role summaries.');
        this.loading.set(false);
      },
    });
  }

  // ── Role users ─────────────────────────────────────────────────────────────

  openRoleUsers(role: Role): void {
    this.selectedRole.set(role);
    this.currentPage.set(0);
    this.loadRoleUsers(role);
  }

  loadRoleUsers(role: Role): void {
    this.loading.set(true);
    this.clearMessage();
    this.view.set('role-users');
    this.adminService
      .getUsersByRole(role, this.currentPage(), 20)
      .subscribe({
        next: (resp) => {
          this.roleUsers.set(resp.data);
          this.totalPages.set(resp.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.showError('Failed to load users for this role.');
          this.loading.set(false);
        },
      });
  }

  changePage(page: number): void {
    this.currentPage.set(page);
    this.loadRoleUsers(this.selectedRole()!);
  }

  // ── Revoke single role ─────────────────────────────────────────────────────

  revokeRole(user: AdminUserSummary): void {
    const role = this.selectedRole();
    if (!role) return;
    if (!confirm(`Remove role "${this.roleLabel(role)}" from ${user.displayName}?`)) return;
    this.saving.set(true);
    this.clearMessage();
    this.adminService.revokeRole(user.id, role).subscribe({
      next: () => {
        this.saving.set(false);
        this.showSuccess(`Role removed from ${user.displayName}.`);
        this.loadRoleUsers(role);
      },
      error: () => {
        this.showError('Failed to revoke role.');
        this.saving.set(false);
      },
    });
  }

  // ── Edit roles ─────────────────────────────────────────────────────────────

  openEditRoles(user: AdminUserSummary): void {
    this.editTarget.set(user);
    this.editRoles = [...user.roles];
    this.clearMessage();
    this.view.set('edit-roles');
  }

  toggleEditRole(role: Role): void {
    if (this.editRoles.includes(role)) {
      this.editRoles = this.editRoles.filter((r) => r !== role);
    } else {
      this.editRoles = [...this.editRoles, role];
    }
  }

  submitRoles(): void {
    const target = this.editTarget();
    if (!target) return;
    this.saving.set(true);
    this.clearMessage();
    const payload: AssignRolesRequest = { roles: this.editRoles };
    this.adminService.assignRoles(target.id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.showSuccess(`Roles updated for ${target.displayName}.`);
        this.view.set('role-users');
        this.loadRoleUsers(this.selectedRole()!);
      },
      error: () => {
        this.showError('Failed to update roles.');
        this.saving.set(false);
      },
    });
  }

  cancelEdit(): void {
    this.editTarget.set(null);
    this.view.set('role-users');
    this.clearMessage();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  backToSummary(): void {
    this.view.set('summary');
    this.selectedRole.set(null);
    this.roleUsers.set([]);
    this.clearMessage();
    this.loadRoleSummaries();
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
