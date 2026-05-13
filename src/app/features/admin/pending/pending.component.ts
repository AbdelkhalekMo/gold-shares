import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pending',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="pending-page animate-spring">
      <div class="page-header">
        <div class="title">
          <h1 class="islamic-header text-gradient">الطلبات المعلقة</h1>
          <p class="subtitle">مراجعة وتدقيق طلبات إضافة الأوزان المقدمة من الأعضاء</p>
        </div>
        <button class="btn btn-glass" (click)="loadPending()">🔄 تحديث القائمة</button>
      </div>

      <div *ngIf="loading" class="modern-loading">
        <div class="loader-orb"></div>
        <p>جاري فحص الطلبات الجديدة...</p>
      </div>

      <ng-container *ngIf="!loading">
        <div class="table-container animate-spring" *ngIf="pendingTxs.length > 0; else empty">
          <table>
            <thead>
              <tr>
                <th>المشترك</th>
                <th>سعر اليوم</th>
                <th>الوزن المطلوب</th>
                <th>القيمة الإجمالية</th>
                <th>وقت الطلب</th>
                <th>القرار</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tx of pendingTxs">
                <td>
                  <div class="user-cell">
                    <div class="user-avatar">{{ tx.user?.username?.charAt(0) || '?' }}</div>
                    <span class="username">{{ tx.user?.username || 'غير معروف' }}</span>
                  </div>
                </td>
                <td>{{ tx.gram_price | number }} ج.م</td>
                <td class="text-gold font-bold">{{ tx.grams | number:'1.0-3' }} جم</td>
                <td>{{ tx.amount | number }} ج.م</td>
                <td class="date-cell">{{ tx.created_at | date:'yyyy-MM-dd HH:mm' }}</td>
                <td class="actions">
                  <button (click)="approve(tx)" class="decision-btn approve">
                    <span class="icon">✓</span>
                  </button>
                  <button (click)="reject(tx)" class="decision-btn reject">
                    <span class="icon">×</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #empty>
          <div class="modern-empty card">
            <div class="empty-icon">✨</div>
            <h3>لا توجد طلبات معلقة</h3>
            <p>جميع طلبات الأعضاء تمت معالجتها بدقة.</p>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
  styles: [`
    .pending-page { padding: 1rem 0; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3.5rem; }
    .subtitle { color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem; }

    .user-cell { display: flex; align-items: center; gap: 1rem; 
      .user-avatar { width: 38px; height: 38px; background: rgba(255, 255, 255, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 1px solid var(--glass-border); }
      .username { font-weight: 800; }
    }
    .date-cell { color: var(--text-muted); font-size: 0.85rem; }

    .actions { display: flex; gap: 0.75rem; }
    .decision-btn {
      width: 42px; height: 42px; border-radius: 14px; border: 1px solid var(--glass-border); background: rgba(255, 255, 255, 0.05); color: #fff; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center;
      .icon { font-size: 1.25rem; font-weight: 900; }
      &.approve:hover { background: var(--accent); border-color: var(--accent); transform: translateY(-3px) rotate(10deg); box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3); }
      &.reject:hover { background: #ff4d4d; border-color: #ff4d4d; transform: translateY(-3px) rotate(-10deg); box-shadow: 0 5px 15px rgba(255, 77, 77, 0.3); }
    }

    .modern-loading { text-align: center; padding: 5rem; .loader-orb { width: 40px; height: 40px; border: 3px solid transparent; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; } }
    @keyframes spin { to { transform: rotate(360deg); } }

    .modern-empty { text-align: center; padding: 6rem 2rem; .empty-icon { font-size: 5rem; margin-bottom: 1.5rem; opacity: 0.3; } }
  `]
})
export class PendingComponent implements OnInit {
  dataService = inject(DataService);
  cdr = inject(ChangeDetectorRef);
  
  pendingTxs: any[] = [];
  loading = true;

  ngOnInit() {
    this.loadPending();
  }

  async loadPending() {
    this.loading = true;
    this.cdr.detectChanges();

    const { data, error } = await this.dataService.getPendingTransactions();

    if (error) {
      console.error('Error loading pending transactions:', error);
      Swal.fire('خطأ في التحميل', error.message, 'error');
    }

    this.pendingTxs = data || [];
    this.loading = false;
    this.cdr.detectChanges();
  }

  async approve(tx: any) {
    const res = await Swal.fire({
      title: 'الموافقة على المعاملة؟',
      text: `سيتم تحديث رصيد ${tx.user?.username}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، موافقة',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#d4ff00'
    });

    if (!res.isConfirmed) return;

    const result = await this.dataService.approveTransaction(tx);
    if (result.success) {
      Swal.fire({ title: 'تمت الموافقة', icon: 'success', timer: 1500, showConfirmButton: false });
      this.loadPending();
    } else {
      Swal.fire('خطأ', result.error, 'error');
    }
  }

  async reject(tx: any) {
    const res = await Swal.fire({
      title: 'رفض المعاملة؟',
      text: 'سيتم حذف هذا الطلب نهائياً',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، رفض',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444'
    });

    if (res.isConfirmed) {
      await this.dataService.rejectTransaction(tx.id);
      this.loadPending();
    }
  }
}
