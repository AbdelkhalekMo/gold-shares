import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-late-payments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="late-page animate-fade-in">
      <div class="page-header">
        <h1>المتأخرون عن السداد</h1>
        <p>تاريخ البداية: 10/05/2026 | يتم الحساب كل 3 أشهر</p>
      </div>

      <div class="table-container" *ngIf="lateUsers.length > 0; else empty">
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>نوع السهم</th>
              <th>المتبقي الحالي</th>
              <th>الحد الأقصى المسموح</th>
              <th>حالة التأخير</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of lateUsers">
              <td class="font-bold">{{ user.username }}</td>
              <td>{{ user.share_type === 'full' ? 'سهم كامل' : 'نصف سهم' }}</td>
              <td class="text-danger">{{ user.remaining }} جم</td>
              <td class="text-success">{{ user.expected }} جم</td>
              <td>
                <span class="badge badge-danger">متأخر</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #empty>
        <div class="empty-state card">
          <div class="icon">✅</div>
          <h3>لا يوجد متأخرون حالياً</h3>
          <p>جميع المشتركين ملتزمون بجدول السداد.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 2rem; h1 { font-size: 1.75rem; font-weight: 800; } p { color: var(--text-muted); } }
    .font-bold { font-weight: 700; }
    .text-danger { color: var(--danger); font-weight: 700; }
    .text-success { color: var(--success); font-weight: 700; }
    .empty-state {
      text-align: center; padding: 4rem 2rem;
      .icon { font-size: 3rem; margin-bottom: 1rem; }
      h3 { margin-bottom: 0.5rem; font-size: 1.25rem; }
      p { color: var(--text-muted); }
    }
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
