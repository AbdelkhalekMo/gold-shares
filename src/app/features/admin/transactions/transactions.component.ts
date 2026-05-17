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
        <div *ngIf="transactions.length > 0; else empty">
          <!-- Desktop Table -->
          <div class="table-container animate-spring">
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

          <!-- Mobile Card List -->
          <div class="mobile-tx-list animate-spring">
            <div class="tx-card card glass-glow" *ngFor="let tx of transactions">
              <div class="card-header-tx">
                <span class="tx-number">رقم العملية: #{{ tx.transaction_number }}</span>
                <span class="tx-date">{{ tx.created_at | date:'yyyy-MM-dd HH:mm' }}</span>
              </div>
              
              <div class="card-body-tx">
                <div class="stat-item">
                  <span class="label">سعر الجرام:</span>
                  <span class="value">{{ tx.gram_price | number }} ج.م</span>
                </div>
                <div class="stat-item">
                  <span class="label">الجرامات:</span>
                  <span class="value font-bold">{{ tx.grams | number:'1.0-3' }} جم</span>
                </div>
                <div class="stat-item full-width">
                  <span class="label">إجمالي المبلغ:</span>
                  <span class="value text-accent font-bold">{{ tx.amount | number }} ج.م</span>
                </div>
              </div>

              <div class="card-actions-tx">
                <button (click)="deleteTx(tx)" class="btn-delete-mobile">🗑️ حذف واسترجاع</button>
              </div>
            </div>
          </div>
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
    .tx-page { padding: 1rem 0; }
    .page-header { margin-bottom: 2rem; }
    .back-link { display: inline-block; color: var(--text-muted); text-decoration: none; margin-bottom: 0.75rem; font-weight: 600; font-size: 0.9rem; }
    h1 { font-size: 1.75rem; font-weight: 800; }
    
    .btn-delete { background: #fee2e2; color: #991b1b; border: none; padding: 0.4rem 0.875rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
    .btn-delete:hover { opacity: 0.8; }
    .empty-state { text-align: center; padding: 3rem; .icon { font-size: 2.5rem; margin-bottom: 0.75rem; } h3 { color: var(--text-muted); } }
    .font-bold { font-weight: 700; color: var(--success); }
    .loading-state { text-align: center; padding: 3rem; color: var(--text-muted); }

    .mobile-tx-list {
      display: none;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }

    .tx-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 24px;
      
      .card-header-tx {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding-bottom: 0.75rem;
        
        .tx-number {
          font-weight: 800;
          font-size: 0.95rem;
          color: var(--primary);
        }
        .tx-date {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
      }

      .card-body-tx {
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

      .card-actions-tx {
        .btn-delete-mobile {
          width: 100%;
          padding: 0.85rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 800;
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.1);
          color: #ff4d4d;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          
          &:hover {
            background: rgba(239, 68, 68, 0.15);
            border-color: #ef4444;
          }
        }
      }
    }

    @media (max-width: 768px) {
      .table-container {
        display: none !important;
      }
      .mobile-tx-list {
        display: flex !important;
      }
      .page-header {
        margin-bottom: 2rem;
        h1 { font-size: 1.5rem; }
      }
    }
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
