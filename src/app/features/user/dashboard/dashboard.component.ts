import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-dashboard animate-spring">
      <div class="page-header">
        <h1 class="islamic-header"><span class="text-gradient">أهلاً بك،</span> {{ user()?.username }}</h1>
        <p class="subtitle">بارك الله في مالك وزادك من فضله</p>
      </div>

      <!-- Bento Stats Grid -->
      <div class="bento-grid">
        <div class="card stat-card glass-glow">
          <div class="card-icon">💰</div>
          <div class="stat-content">
            <p class="label">المقدم</p>
            <h2 class="value">{{ user()?.advance ?? 0 }} <small>جم</small></h2>
          </div>
        </div>
        <div class="card stat-card glass-glow danger">
          <div class="card-icon">📉</div>
          <div class="stat-content">
            <p class="label">المتبقي</p>
            <h2 class="value text-danger">{{ user()?.remaining ?? 0 }} <small>جم</small></h2>
          </div>
        </div>
        <div class="card stat-card highlight gold-glow">
          <div class="card-icon pulse">🏆</div>
          <div class="stat-content">
            <p class="label">إجمالي المسدد</p>
            <h2 class="value text-gradient">{{ (user()?.paid ?? 0) | number:'1.0-3' }} <small>جم</small></h2>
          </div>
        </div>
        <div class="card stat-card glass-glow">
          <div class="card-icon">🏛️</div>
          <div class="stat-content">
            <p class="label">إجمالي المدفوعات</p>
            <h2 class="value text-primary">{{ (user()?.totalAmount ?? 0) | number }} <small>ج.م</small></h2>
          </div>
        </div>
      </div>

      <!-- Modern Delivery Banner -->
      <div class="delivery-card animate-spring" *ngIf="user()?.isReceived">
        <div class="glass-inner">
          <div class="glow-effect"></div>
          <div class="icon-wrap">✨</div>
          <div class="text">
            <h3>تم استلام الحصة بنجاح</h3>
            <p>تهانينا! لقد اكتملت رحلتك الادخارية باستلام الذهب.</p>
          </div>
          <div class="badge-modern">مكتمل</div>
        </div>
      </div>

      <!-- Transactions Section -->
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">📜 تاريخ العمليات</h3>
          <div class="line"></div>
        </div>

        <div *ngIf="loading" class="modern-loading">
          <div class="loader-orb"></div>
          <p>جاري مزامنة البيانات مع الشبكة...</p>
        </div>

        <ng-container *ngIf="!loading">
          <div class="table-container animate-spring" *ngIf="transactions.length > 0; else empty">
            <table>
              <thead>
                <tr>
                  <th>الرقم المرجعي</th>
                  <th>السعر اليومي</th>
                  <th>الوزن</th>
                  <th>القيمة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tx of transactions">
                  <td class="ref-id">#{{ tx.transaction_number }}</td>
                  <td>{{ tx.gram_price | number }} ج.م</td>
                  <td class="text-gold font-bold">{{ tx.grams | number:'1.0-3' }} جم</td>
                  <td>{{ tx.amount | number }} ج.م</td>
                  <td class="date">{{ tx.created_at | date:'yyyy-MM-dd HH:mm' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <ng-template #empty>
            <div class="modern-empty card glass-glow">
              <div class="empty-icon">🕊️</div>
              <h3>السجل فارغ حالياً</h3>
              <p>بمجرد تأكيد معاملاتك، ستظهر هنا بالتفصيل.</p>
              <button class="btn btn-primary" routerLink="/user/new-transaction">إضافة معاملة</button>
            </div>
          </ng-template>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .user-dashboard { padding: 1rem 0; }
    .page-header { margin-bottom: 3rem; text-align: right; }
    .subtitle { color: var(--text-muted); font-size: 1.2rem; font-weight: 500; margin-top: 0.5rem; }
    
    .stat-card {
      display: flex; align-items: center; gap: 1.5rem; padding: 2.5rem 2rem;
      .card-icon { font-size: 3rem; opacity: 0.8; }
      .label { color: var(--text-muted); font-weight: 800; font-size: 0.9rem; text-transform: uppercase; margin-bottom: 0.5rem; }
      .value { font-size: 2.25rem; font-weight: 900; }
      small { font-size: 0.9rem; color: var(--text-muted); }
      &.danger { .value { color: #ff4d4d; } }
      &.gold-glow { border-color: var(--primary); box-shadow: 0 0 20px rgba(212, 175, 55, 0.1); }
    }
    
    .delivery-card {
      margin-bottom: 4rem;
      .glass-inner {
        background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 30px; padding: 3rem; display: flex; align-items: center; gap: 2.5rem;
        position: relative; overflow: hidden; backdrop-filter: blur(10px);
      }
      .icon-wrap { font-size: 4rem; filter: drop-shadow(0 0 15px var(--accent)); }
      h3 { font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem; }
      p { color: #d1fae5; font-size: 1.1rem; }
      .badge-modern { position: absolute; top: 2rem; left: 2rem; background: var(--accent); color: #000; padding: 0.5rem 1.5rem; border-radius: 100px; font-weight: 900; font-size: 0.8rem; }
    }

    .section-header {
      display: flex; align-items: center; gap: 2rem; margin-bottom: 2rem;
      .section-title { font-size: 1.5rem; font-weight: 800; white-space: nowrap; }
      .line { height: 1px; width: 100%; background: linear-gradient(to left, var(--glass-border), transparent); }
    }

    .modern-loading {
      text-align: center; padding: 5rem;
      .loader-orb { width: 50px; height: 50px; border: 3px solid transparent; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .ref-id { font-family: 'Plus Jakarta Sans', sans-serif; color: var(--primary); font-weight: 800; }
    .date { color: var(--text-muted); font-size: 0.85rem; }

    .modern-empty {
      text-align: center; padding: 6rem 2rem;
      .empty-icon { font-size: 5rem; margin-bottom: 1.5rem; opacity: 0.3; }
      h3 { font-size: 1.75rem; margin-bottom: 1rem; }
      p { color: var(--text-muted); margin-bottom: 2rem; }
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
