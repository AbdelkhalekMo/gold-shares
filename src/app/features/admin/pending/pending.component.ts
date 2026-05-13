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
    <div class="pending-page animate-fade-in">
      <div class="page-header">
        <h1>المعاملات المعلقة</h1>
        <p>مراجعة طلبات إضافة الجرامات من المستخدمين</p>
        <button class="btn btn-outline btn-sm" (click)="loadPending()">🔄 تحديث</button>
      </div>

      <div *ngIf="loading" class="loading-state">
        <p>جاري التحميل...</p>
      </div>

      <ng-container *ngIf="!loading">
        <div class="table-container" *ngIf="pendingTxs.length > 0; else empty">
          <table>
            <thead>
              <tr>
                <th>اسم المستخدم</th>
                <th>سعر الجرام</th>
                <th>عدد الجرامات</th>
                <th>المبلغ</th>
                <th>التاريخ</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tx of pendingTxs">
                <td class="font-bold">{{ tx.user?.username || 'غير معروف' }}</td>
                <td>{{ tx.gram_price | number }} ج.م</td>
                <td class="grams">{{ tx.grams | number:'1.0-3' }} جم</td>
                <td>{{ tx.amount | number }} ج.م</td>
                <td>{{ tx.created_at | date:'yyyy-MM-dd HH:mm' }}</td>
                <td class="actions">
                  <button (click)="approve(tx)" class="btn-action approve">✓ موافقة</button>
                  <button (click)="reject(tx)" class="btn-action reject">✗ رفض</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #empty>
          <div class="empty-state card">
            <div class="icon">✨</div>
            <h3>لا توجد معاملات معلقة</h3>
            <p>جميع الطلبات تم التعامل معها بنجاح.</p>
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
    .actions { display: flex; gap: 0.5rem; }
    .btn-action {
      padding: 0.4rem 0.875rem; border-radius: 8px;
      border: none; font-weight: 700; cursor: pointer; font-size: 0.82rem;
      &.approve { background: var(--primary); color: #000; }
      &.reject { background: #fee2e2; color: #991b1b; }
      &:hover { opacity: 0.8; }
    }
    .grams { font-weight: 700; color: var(--success); }
    .font-bold { font-weight: 700; }
    .loading-state { text-align: center; padding: 3rem; color: var(--text-muted); }
    .empty-state {
      text-align: center; padding: 4rem 2rem;
      .icon { font-size: 3rem; margin-bottom: 1rem; }
      h3 { margin-bottom: 0.5rem; font-size: 1.25rem; }
      p { color: var(--text-muted); }
    }
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
