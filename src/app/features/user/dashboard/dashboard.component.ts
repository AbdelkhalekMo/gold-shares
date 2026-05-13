import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-dashboard animate-fade-in">
      <div class="page-header">
        <h1>مرحباً، {{ user()?.username }}</h1>
        <p>تابع رصيدك من الذهب ومعاملاتك</p>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="card stat-card">
          <p class="label">المقدم</p>
          <h2 class="value text-primary">{{ user()?.advance ?? 0 }} <small>جم</small></h2>
        </div>
        <div class="card stat-card">
          <p class="label">المتبقي</p>
          <h2 class="value text-danger">{{ user()?.remaining ?? 0 }} <small>جم</small></h2>
        </div>
        <div class="card stat-card">
          <p class="label">ما تم سداده</p>
          <h2 class="value text-success">{{ (user()?.paid ?? 0) | number:'1.0-3' }} <small>جم</small></h2>
        </div>
        <div class="card stat-card">
          <p class="label">إجمالي المدفوع</p>
          <h2 class="value">{{ (user()?.totalAmount ?? 0) | number }} <small>ج.م</small></h2>
        </div>
      </div>

      <!-- Delivery Status -->
      <div class="delivery-banner card" *ngIf="user()?.isReceived">
        <div class="icon">🏆</div>
        <div class="text">
          <h3>تم الاستلام</h3>
          <p>لقد قمت باستلام حصتك من الذهب بنجاح.</p>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="section">
        <h3 class="section-title">المعاملات المؤكدة</h3>

        <div *ngIf="loading" class="loading-state">جاري التحميل...</div>

        <ng-container *ngIf="!loading">
          <div class="table-container" *ngIf="transactions.length > 0; else empty">
            <table>
              <thead>
                <tr>
                  <th>رقم العملية</th>
                  <th>سعر الجرام</th>
                  <th>عدد الجرامات</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tx of transactions">
                  <td>#{{ tx.transaction_number }}</td>
                  <td>{{ tx.gram_price | number }} ج.م</td>
                  <td class="font-bold">{{ tx.grams | number:'1.0-3' }} جم</td>
                  <td>{{ tx.amount | number }} ج.م</td>
                  <td>{{ tx.created_at | date:'yyyy-MM-dd HH:mm' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <ng-template #empty>
            <div class="empty-state card">
              <div class="icon">📄</div>
              <h3>لا توجد معاملات مؤكدة بعد</h3>
              <p>قم بإضافة معاملة جديدة وانتظر موافقة الأدمن.</p>
            </div>
          </ng-template>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 2rem; h1 { font-size: 1.75rem; font-weight: 800; } p { color: var(--text-muted); } }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card {
      text-align: center;
      .label { color: var(--text-muted); font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem; }
      .value { font-size: 1.75rem; font-weight: 800; }
      small { font-size: 0.8rem; color: var(--text-muted); }
    }
    .delivery-banner {
      background: #f0fdf4; border: 2px solid var(--success);
      display: flex; align-items: center; gap: 1.5rem;
      padding: 1.5rem; margin-bottom: 2rem; border-radius: 16px;
      .icon { font-size: 2.5rem; }
      h3 { color: #166534; margin-bottom: 0.25rem; font-size: 1.1rem; font-weight: 800; }
      p { color: #14532d; font-weight: 600; font-size: 0.9rem; }
    }
    .section { margin-top: 2rem; }
    .section-title { margin-bottom: 1rem; font-size: 1.25rem; font-weight: 800; }
    .text-primary { color: var(--primary-dark); }
    .text-danger { color: var(--danger); }
    .text-success { color: var(--success); }
    .font-bold { font-weight: 700; color: var(--success); }
    .loading-state { text-align: center; padding: 2rem; color: var(--text-muted); }
    .empty-state {
      text-align: center; padding: 3rem;
      .icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
      h3 { margin-bottom: 0.5rem; }
      p { color: var(--text-muted); font-size: 0.9rem; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  dataService = inject(DataService);
  authService = inject(AuthService);
  cdr = inject(ChangeDetectorRef);

  user = this.authService.currentUser;
  transactions: any[] = [];
  loading = true;

  ngOnInit() {
    this.loadTransactions();
  }

  async loadTransactions() {
    this.loading = true;
    this.cdr.detectChanges();

    const userId = this.user()?.id;
    if (userId) {
      await this.authService.refreshCurrentUser();
      const { data, error } = await this.dataService.getApprovedTransactions(userId);
      if (error) console.error(error);
      this.transactions = data || [];
    }

    this.loading = false;
    this.cdr.detectChanges();
  }
}
