import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-approved-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="approved-page animate-spring">
      <div class="page-header">
        <div class="title">
          <h1 class="islamic-header text-gradient">أرشيف المعاملات</h1>
          <p class="subtitle">استعراض سجلات شراء الذهب الموثقة لكافة الأعضاء</p>
        </div>
        <button class="btn btn-glass" (click)="loadUsers()">🔄 تحديث القائمة</button>
      </div>

      <div *ngIf="loading" class="modern-loading">
        <div class="loader-orb"></div>
        <p>جاري استرجاع السجلات المؤرشفة...</p>
      </div>

      <ng-container *ngIf="!loading">
        <div class="users-bento-grid" *ngIf="users.length > 0; else empty">
          <a
            *ngFor="let user of users"
            [routerLink]="['/admin/transactions', user.id]"
            class="user-glass-card animate-spring">
            <div class="card-glow"></div>
            <div class="card-top">
              <div class="avatar-box">{{ user.username.charAt(0) }}</div>
              <div class="info">
                <h3>{{ user.username }}</h3>
                <span class="badge-modern" [ngClass]="user.share_type === 'full' ? 'gold' : 'emerald'">
                  {{ user.share_type === 'full' ? 'سهم كامل' : 'نصف سهم' }}
                </span>
              </div>
            </div>
            
            <div class="card-stats">
              <div class="stat-item">
                <span class="label">إجمالي الموثق</span>
                <span class="value text-accent">{{ user.paid | number:'1.0-3' }} <small>جم</small></span>
              </div>
              <div class="stat-item">
                <span class="label">الالتزام المتبقي</span>
                <span class="value text-danger">{{ user.remaining }} <small>جم</small></span>
              </div>
            </div>

            <div class="card-footer">
              <span class="action-text">عرض التفاصيل</span>
              <span class="arrow">←</span>
            </div>
          </a>
        </div>

        <ng-template #empty>
          <div class="modern-empty card">
            <div class="icon">👥</div>
            <h3>لا توجد بيانات متاحة</h3>
            <p>لم يتم العثور على أي أعضاء مسجلين في المنظومة.</p>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
  styles: [`
    .approved-page { padding: 1rem 0; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3.5rem; }
    .subtitle { color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem; }

    .users-bento-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .user-glass-card {
      background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); border-radius: 30px;
      padding: 1.75rem; position: relative; overflow: hidden; text-decoration: none; color: #fff;
      display: flex; flex-direction: column; gap: 1.5rem; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        transform: translateY(-8px); border-color: var(--primary);
        background: rgba(255, 255, 255, 0.06); box-shadow: 0 15px 35px rgba(0,0,0,0.3);
        .arrow { transform: translateX(-5px); color: var(--primary); }
      }
    }

    .card-glow { position: absolute; inset: 0; background: radial-gradient(circle at top right, rgba(212, 175, 55, 0.05), transparent); pointer-events: none; }

    .card-top { display: flex; align-items: center; gap: 1.25rem;
      .avatar-box { width: 56px; height: 56px; background: var(--primary); color: #000; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 900; }
      .info h3 { font-size: 1.15rem; font-weight: 800; margin-bottom: 0.4rem; }
    }

    .badge-modern {
      padding: 0.3rem 0.8rem; border-radius: 100px; font-size: 0.65rem; font-weight: 900;
      &.gold { background: rgba(212, 175, 55, 0.1); color: var(--primary); border: 1px solid var(--primary); }
      &.emerald { background: rgba(16, 185, 129, 0.1); color: var(--accent); border: 1px solid var(--accent); }
    }

    .card-stats {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1.25rem;
      background: rgba(255, 255, 255, 0.03); border-radius: 20px;
      .stat-item { display: flex; flex-direction: column; gap: 0.25rem;
        .label { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }
        .value { font-size: 1.1rem; font-weight: 900; }
      }
    }

    .card-footer {
      display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--glass-border); padding-top: 1.25rem;
      .action-text { font-size: 0.85rem; font-weight: 800; color: var(--text-muted); }
      .arrow { font-size: 1.25rem; transition: transform 0.3s ease; }
    }

    .modern-loading { text-align: center; padding: 5rem; .loader-orb { width: 40px; height: 40px; border: 3px solid transparent; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; } }
    @keyframes spin { to { transform: rotate(360deg); } }

    .modern-empty { text-align: center; padding: 5rem; .icon { font-size: 4rem; opacity: 0.2; margin-bottom: 1rem; } }
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
