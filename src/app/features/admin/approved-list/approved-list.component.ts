import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-approved-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="approved-page animate-fade-in">
      <div class="page-header">
        <h1>المعاملات المؤكدة</h1>
        <p>اختر مستخدماً لعرض معاملاته المؤكدة</p>
        <button class="btn btn-outline btn-sm" (click)="loadUsers()">🔄 تحديث</button>
      </div>

      <div *ngIf="loading" class="loading-state">جاري التحميل...</div>

      <ng-container *ngIf="!loading">
        <div class="users-grid" *ngIf="users.length > 0; else empty">
          <a
            *ngFor="let user of users"
            [routerLink]="['/admin/transactions', user.id]"
            class="user-card">
            <div class="avatar">{{ user.username.charAt(0) }}</div>
            <div class="info">
              <h3>{{ user.username }}</h3>
              <p>{{ user.share_type === 'full' ? 'سهم كامل' : 'نصف سهم' }}</p>
            </div>
            <div class="stats">
              <span class="stat">
                <span class="label">المسدد</span>
                <span class="value text-success">{{ user.paid | number:'1.0-3' }} جم</span>
              </span>
              <span class="stat">
                <span class="label">المتبقي</span>
                <span class="value text-danger">{{ user.remaining }} جم</span>
              </span>
            </div>
            <span class="arrow">←</span>
          </a>
        </div>

        <ng-template #empty>
          <div class="empty-state card">
            <div class="icon">👥</div>
            <h3>لا يوجد مستخدمون</h3>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex; align-items: center; gap: 1rem;
      flex-wrap: wrap; margin-bottom: 2rem;
      h1 { font-size: 1.75rem; font-weight: 800; flex: 1; }
      p { color: var(--text-muted); width: 100%; margin-top: -0.5rem; }
    }
    .btn-sm { padding: 0.4rem 1rem; font-size: 0.82rem; }
    .users-grid { display: flex; flex-direction: column; gap: 1rem; }
    .user-card {
      background: #fff; padding: 1.25rem 1.5rem;
      border-radius: 16px; border: 1px solid var(--border-color);
      display: flex; align-items: center; gap: 1rem;
      text-decoration: none; color: var(--text-main);
      transition: all 0.2s ease;
      &:hover { transform: translateX(-4px); box-shadow: var(--shadow-md); border-color: var(--primary); }
    }
    .avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: var(--primary); color: #000;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; font-weight: 800; flex-shrink: 0;
    }
    .info { flex: 1; h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.2rem; } p { font-size: 0.8rem; color: var(--text-muted); } }
    .stats { display: flex; gap: 1.5rem; }
    .stat { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; }
    .stat .label { font-size: 0.72rem; color: var(--text-muted); }
    .stat .value { font-size: 0.9rem; font-weight: 700; }
    .text-success { color: var(--success); }
    .text-danger { color: var(--danger); }
    .arrow { font-size: 1.25rem; color: var(--text-muted); }
    .loading-state { text-align: center; padding: 3rem; color: var(--text-muted); }
    .empty-state { text-align: center; padding: 3rem; .icon { font-size: 2.5rem; margin-bottom: 0.75rem; } }
  `]
})
export class ApprovedListComponent implements OnInit {
  dataService = inject(DataService);
  cdr = inject(ChangeDetectorRef);
  users: any[] = [];
  loading = true;

  ngOnInit() { this.loadUsers(); }

  async loadUsers() {
    this.loading = true;
    this.cdr.detectChanges();
    const { data, error } = await this.dataService.getUsers();
    if (error) console.error(error);
    this.users = (data || []).filter((u: any) => u.role === 'user');
    this.loading = false;
    this.cdr.detectChanges();
  }
}
