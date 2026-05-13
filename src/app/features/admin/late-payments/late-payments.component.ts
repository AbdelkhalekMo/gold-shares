import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';

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

      <div class="table-container animate-spring" *ngIf="lateUsers.length > 0; else empty">
        <table>
          <thead>
            <tr>
              <th>المشترك</th>
              <th>نوع الحصة</th>
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
                <span class="badge-modern" [ngClass]="user.share_type === 'full' ? 'gold' : 'emerald'">
                  {{ user.share_type === 'full' ? 'سهم كامل' : 'نصف سهم' }}
                </span>
              </td>
              <td class="text-danger font-bold">{{ user.remaining }} جم</td>
              <td class="text-accent font-bold">{{ user.expected }} جم</td>
              <td>
                <span class="badge-modern danger-glow animate-pulse">متأخر عن السداد</span>
              </td>
            </tr>
          </tbody>
        </table>
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
      &.danger-glow { background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1px solid #ff4d4d; box-shadow: 0 0 15px rgba(255, 77, 77, 0.2); }
    }

    .text-accent { color: var(--accent); }
    .modern-empty { text-align: center; padding: 6rem 2rem; .empty-icon { font-size: 5rem; margin-bottom: 1.5rem; opacity: 0.3; } }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  `]
})
export class LatePaymentsComponent implements OnInit {
  dataService = inject(DataService);
  lateUsers: any[] = [];
  startDate = new Date('2026-05-10');

  async ngOnInit() {
    this.calculateLate();
  }

  async calculateLate() {
    const { data, error } = await this.dataService.getUsers();
    if (error || !data) { console.error(error); return; }

    const today = new Date();
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
        const isFull = user.share_type === 'full';
        const expectedReduction = periods * (isFull ? 1 : 0.5);
        const initialRemaining = isFull ? 28 : 14;
        const expectedRemaining = initialRemaining - expectedReduction;

        if (Number(user.remaining) > expectedRemaining) {
          user.expected = expectedRemaining;
          return true;
        }
        return false;
      });
  }
}
