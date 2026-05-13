import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-user-profiles-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="profiles-page animate-spring">
      <div class="page-header">
        <div class="title">
          <h1 class="islamic-header text-gradient">أرشيف بيانات المشتركين</h1>
          <p class="subtitle">استعراض وتحليل البيانات الشخصية والمهنية لكافة أعضاء الجمعية</p>
        </div>
      </div>

      <div *ngIf="loading()" class="modern-loading">
        <div class="loader-orb"></div>
        <p>جاري استحضار الأرشيف...</p>
      </div>

      <div *ngIf="!loading()">
        <div class="table-container animate-spring" *ngIf="profiles().length > 0; else empty">
          <table>
            <thead>
              <tr>
                <th>المشترك</th>
                <th>التخصص المهني</th>
                <th>محل الإقامة</th>
                <th>صافي الدخل</th>
                <th>الالتزام</th>
                <th>تاريخ التسجيل</th>
                <th>التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of profiles()">
                <td>
                  <div class="user-cell">
                    <div class="user-avatar">{{ p.full_name?.charAt(0) }}</div>
                    <span class="username">{{ p.full_name }}</span>
                  </div>
                </td>
                <td class="job-cell">{{ p.job || '---' }}</td>
                <td>{{ p.address }}</td>
                <td class="text-accent font-bold">{{ p.avg_net_income | number }} <small>ج.م</small></td>
                <td>
                  <span class="badge-modern" [ngClass]="p.can_commit_monthly === 'نعم' ? 'emerald' : 'danger'">
                    {{ p.can_commit_monthly }}
                  </span>
                </td>
                <td class="date-cell">{{ p.created_at | date:'yyyy-MM-dd' }}</td>
                <td class="actions">
                  <a [routerLink]="['/admin/user-profile', p.id]" class="action-btn view" title="عرض الملف">👤</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #empty>
          <div class="modern-empty card">
            <div class="empty-icon">📁</div>
            <h3>الأرشيف فارغ حالياً</h3>
            <p>لم يقم أي عضو بملء بياناته التعريفية بعد.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .profiles-page { padding: 1rem 0; }
    .page-header { margin-bottom: 3.5rem; text-align: right; }
    .subtitle { color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem; }

    .user-cell { display: flex; align-items: center; gap: 1rem; 
      .user-avatar { width: 38px; height: 38px; background: rgba(255, 255, 255, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 1px solid var(--glass-border); }
      .username { font-weight: 800; }
    }
    .job-cell { color: var(--text-muted); font-size: 0.9rem; }
    .text-accent { color: var(--accent); }
    .date-cell { font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text-muted); font-size: 0.85rem; }

    .badge-modern {
      padding: 0.4rem 1rem; border-radius: 100px; font-size: 0.7rem; font-weight: 900;
      &.emerald { background: rgba(16, 185, 129, 0.1); color: var(--accent); border: 1px solid var(--accent); }
      &.danger { background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1px solid #ff4d4d; }
    }

    .actions { display: flex; gap: 0.5rem; }
    .action-btn {
      width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 12px;
      background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; cursor: pointer;
      transition: all 0.3s ease; text-decoration: none;
      &:hover { transform: translateY(-3px); border-color: var(--primary); color: var(--primary); }
    }

    .modern-loading { text-align: center; padding: 5rem; .loader-orb { width: 40px; height: 40px; border: 3px solid transparent; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; } }
    @keyframes spin { to { transform: rotate(360deg); } }

    .modern-empty { text-align: center; padding: 6rem 2rem; .empty-icon { font-size: 5rem; margin-bottom: 1.5rem; opacity: 0.3; } }
  `]
})
export class UserProfilesListComponent implements OnInit {
  private dataService = inject(DataService);
  
  profiles = signal<any[]>([]);
  loading = signal(true);

  async ngOnInit() {
    await this.loadProfiles();
  }

  async loadProfiles() {
    this.loading.set(true);
    const { data, error } = await this.dataService.getAllUserProfiles();
    if (data) {
      this.profiles.set(data);
    }
    this.loading.set(false);
  }
}
