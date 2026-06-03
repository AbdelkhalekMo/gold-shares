import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import { getCairoDate } from '../../../core/utils/date-utils';

@Component({
  selector: 'app-late-payments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="late-page animate-spring">
      <div class="page-header">
        <div class="title">
          <h1 class="islamic-header text-gradient">رصد المتأخرات</h1>
          <p class="subtitle">تحليل تلقائي لمعدلات السداد بناءً على الجداول الزمنية المتفق عليها</p>
        </div>
        <div class="meta-glass card">
          <span class="label">تاريخ المرجعية:</span>
          <span class="value">10/05/2026</span>
          <span class="divider">|</span>
          <span class="label">الدورة الحسابية:</span>
          <span class="value">3 أشهر</span>
        </div>
      </div>

      <div *ngIf="lateUsers.length > 0; else empty">
        <!-- Desktop Table (Visible on large screens) -->
        <div class="table-container animate-spring">
          <table>
            <thead>
              <tr>
                <th>المشترك</th>
                <th>نوع الحصة</th>
                <th>المقدم</th>
                <th>الهدية</th>
                <th>المتبقي الحالي</th>
                <th>الحد الأقصى المسموح</th>
                <th>حالة الامتثال</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of lateUsers">
                <td>
                  <div class="user-cell">
                    <div class="user-avatar">{{ user.username.charAt(0) }}</div>
                    <span class="username">{{ user.username }}</span>
                  </div>
                </td>
                <td>
                  <span class="badge-modern" [ngClass]="user.share_type === 'full' ? 'gold' : (user.share_type === 'half' ? 'emerald' : 'purple')">
                    {{ user.share_type === 'full' ? 'سهم كامل' : (user.share_type === 'half' ? 'نصف سهم' : 'سهم مخصص') }}
                  </span>
                </td>
                <td class="font-bold text-accent">{{ user.advance }} جم</td>
                <td class="font-bold text-warning">{{ user.gift || 0 }} جم</td>
                <td class="text-danger font-bold">{{ user.remaining }} جم</td>
                <td class="text-accent font-bold">{{ user.expected }} جم</td>
                <td>
                  <span class="badge-modern danger-glow animate-pulse">متأخر عن السداد</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Late List (Visible only on mobile) -->
        <div class="mobile-late-list animate-spring">
          <div class="late-card card glass-glow" *ngFor="let user of lateUsers">
            <div class="card-header-late">
              <div class="user-cell">
                <div class="user-avatar">{{ user.username.charAt(0) }}</div>
                <div style="display: flex; flex-direction: column; gap: 0.1rem;">
                  <span class="username">{{ user.username }}</span>
                  <span class="user-sub-info" style="font-size: 0.75rem; color: var(--primary);">
                    المقدم: {{ user.advance }} جم | الهدية: {{ user.gift || 0 }} جم
                  </span>
                </div>
              </div>
              <span class="badge-modern" [ngClass]="user.share_type === 'full' ? 'gold' : (user.share_type === 'half' ? 'emerald' : 'purple')">
                {{ user.share_type === 'full' ? 'سهم كامل' : (user.share_type === 'half' ? 'نصف سهم' : 'سهم مخصص') }}
              </span>
            </div>
            
            <div class="card-body-late">
              <div class="stat-item">
                <span class="label">المتبقي الحالي:</span>
                <span class="value text-danger font-bold">{{ user.remaining }} جم</span>
              </div>
              <div class="stat-item">
                <span class="label">الحد الأقصى المسموح:</span>
                <span class="value text-accent font-bold">{{ user.expected }} جم</span>
              </div>
              <div class="stat-item full-width">
                <span class="label">حالة الامتثال:</span>
                <span class="badge-modern danger-glow animate-pulse text-center">🚨 متأخر عن جدول السداد</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ng-template #empty>
        <div class="modern-empty card">
          <div class="empty-icon">✅</div>
          <h3>التزام كامل بالخطة</h3>
          <p>كافة المشتركين يتبعون جدول السداد بدقة عالية حالياً.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .late-page { padding: 1rem 0; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3.5rem; }
    .subtitle { color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem; }

    .meta-glass {
      padding: 0.75rem 1.5rem; display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; border-radius: 100px;
      background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border);
      .label { color: var(--text-muted); }
      .value { color: var(--primary); font-weight: 800; }
      .divider { opacity: 0.2; }
    }

    .user-cell { display: flex; align-items: center; gap: 1rem; 
      .user-avatar { width: 38px; height: 38px; background: rgba(255, 255, 255, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 1px solid var(--glass-border); }
      .username { font-weight: 800; }
    }

    .badge-modern {
      padding: 0.4rem 1.2rem; border-radius: 100px; font-size: 0.7rem; font-weight: 900; text-transform: uppercase;
      &.gold { background: rgba(212, 175, 55, 0.1); color: var(--primary); border: 1px solid var(--primary); }
      &.emerald { background: rgba(16, 185, 129, 0.1); color: var(--accent); border: 1px solid var(--accent); }
      &.purple { background: rgba(139, 92, 246, 0.1); color: #a78bfa; border: 1px solid #8b5cf6; }
      &.danger-glow { background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1px solid #ff4d4d; box-shadow: 0 0 15px rgba(255, 77, 77, 0.2); }
    }

    .text-accent { color: var(--accent); }
    .modern-empty { text-align: center; padding: 6rem 2rem; .empty-icon { font-size: 5rem; margin-bottom: 1.5rem; opacity: 0.3; } }

    .mobile-late-list {
      display: none;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }

    .late-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 24px;
      
      .card-header-late {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding-bottom: 0.75rem;
        
        .user-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          
          .user-avatar {
            width: 38px;
            height: 38px;
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            border: 1px solid var(--glass-border);
          }
          .username {
            font-weight: 800;
            font-size: 1rem;
          }
        }
      }

      .card-body-late {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        background: rgba(255, 255, 255, 0.02);
        padding: 0.75rem 1rem;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.03);

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          
          .label {
            font-size: 0.75rem;
            color: var(--text-muted);
            font-weight: 800;
          }
          .value {
            font-size: 0.95rem;
          }
          &.full-width {
            grid-column: span 2;
            border-top: 1px solid rgba(255, 255, 255, 0.03);
            padding-top: 0.5rem;
            margin-top: 0.25rem;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
      }
    }

    @media (max-width: 768px) {
      .table-container {
        display: none !important;
      }
      .mobile-late-list {
        display: flex !important;
      }
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1.5rem;
        margin-bottom: 2.25rem;
        .title { width: 100%; }
        .islamic-header { font-size: 1.8rem; }
        .subtitle { font-size: 0.95rem; }
      }
      .meta-glass {
        width: 100%;
        justify-content: center;
        border-radius: 15px;
        padding: 0.75rem;
      }
    }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  `]
})
export class LatePaymentsComponent implements OnInit {
  dataService = inject(DataService);
  lateUsers: any[] = [];
  startDate = getCairoDate('2026-05-10');

  async ngOnInit() {
    this.calculateLate();
  }

  async calculateLate() {
    const { data, error } = await this.dataService.getUsers();
    if (error || !data) { console.error(error); return; }

    const today = getCairoDate();
    const diffMonths =
      (today.getFullYear() - this.startDate.getFullYear()) * 12 +
      (today.getMonth() - this.startDate.getMonth());
    const periods = Math.floor(diffMonths / 3);

    if (periods <= 0) {
      this.lateUsers = [];
      return;
    }

    this.lateUsers = data
      .filter((user: any) => user.role === 'user')
      .filter((user: any) => {
        const initialRemaining = Number(user.initial_remaining || 0);
        // Genaralized expected payment calculation: 1g per 3 months for full share (28g total initial remaining)
        const expectedReduction = periods * (initialRemaining / 28.0);
        const expectedRemaining = initialRemaining - expectedReduction;

        if (Number(user.remaining) > expectedRemaining) {
          user.expected = Math.round(expectedRemaining * 100) / 100;
          return true;
        }
        return false;
      });
  }
}
