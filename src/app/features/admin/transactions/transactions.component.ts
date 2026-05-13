import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="tx-page animate-fade-in">
      <div class="page-header">
        <a routerLink="/admin/users" class="back-link">← العودة للمستخدمين</a>
        <h1>معاملات المستخدم</h1>
      </div>

      <div *ngIf="loading" class="loading-state">جاري التحميل...</div>

      <ng-container *ngIf="!loading">
        <div class="table-container" *ngIf="transactions.length > 0; else empty">
          <table>
            <thead>
              <tr>
                <th>رقم العملية</th>
                <th>سعر الجرام</th>
                <th>الجرامات</th>
                <th>المبلغ</th>
                <th>التاريخ</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tx of transactions">
                <td>#{{ tx.transaction_number }}</td>
                <td>{{ tx.gram_price | number }} ج.م</td>
                <td class="font-bold">{{ tx.grams | number:'1.0-3' }} جم</td>
                <td>{{ tx.amount | number }} ج.م</td>
                <td>{{ tx.created_at | date:'yyyy-MM-dd HH:mm' }}</td>
                <td>
                  <button (click)="deleteTx(tx)" class="btn-delete">🗑️ حذف</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #empty>
          <div class="empty-state card">
            <div class="icon">📄</div>
            <h3>لا توجد معاملات مؤكدة لهذا المستخدم</h3>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 2rem; }
    .back-link { display: inline-block; color: var(--text-muted); text-decoration: none; margin-bottom: 0.75rem; font-weight: 600; font-size: 0.9rem; }
    h1 { font-size: 1.75rem; font-weight: 800; }
    .btn-delete { background: #fee2e2; color: #991b1b; border: none; padding: 0.4rem 0.875rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
    .btn-delete:hover { opacity: 0.8; }
    .empty-state { text-align: center; padding: 3rem; .icon { font-size: 2.5rem; margin-bottom: 0.75rem; } h3 { color: var(--text-muted); } }
    .font-bold { font-weight: 700; color: var(--success); }
    .loading-state { text-align: center; padding: 3rem; color: var(--text-muted); }
  `]
})
export class TransactionsComponent implements OnInit {
  dataService = inject(DataService);
  route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);

  transactions: any[] = [];
  userId = '';
  loading = true;

  ngOnInit() {
    this.userId = this.route.snapshot.params['userId'];
    this.loadTxs();
  }

  async loadTxs() {
    this.loading = true;
    this.cdr.detectChanges();

    const { data, error } = await this.dataService.getApprovedTransactions(this.userId);

    if (error) {
      console.error('Error loading transactions:', error);
      Swal.fire('خطأ في التحميل', error.message, 'error');
    }

    this.transactions = data || [];
    this.loading = false;
    this.cdr.detectChanges();
  }

  async deleteTx(tx: any) {
    const res = await Swal.fire({
      title: 'حذف المعاملة؟',
      text: 'سيتم استرجاع الجرامات للمتبقي وخصمها من المسدد!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، حذف واسترجاع',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444'
    });

    if (res.isConfirmed) {
      const result = await this.dataService.deleteApprovedTransaction(tx);
      if (result.success) {
        Swal.fire({ title: 'تم الحذف', icon: 'success', timer: 1500, showConfirmButton: false });
        this.loadTxs();
      } else {
        Swal.fire('خطأ', result.error || 'حدث خطأ أثناء الحذف', 'error');
      }
    }
  }
}
