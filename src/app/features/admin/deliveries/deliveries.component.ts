import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="deliveries-page animate-spring">
      <div class="page-header">
        <div class="title">
          <h1 class="islamic-header text-gradient">إدارة التسليمات</h1>
          <p class="subtitle">متابعة وتوثيق عمليات استلام حصص الذهب المادية للأعضاء</p>
        </div>
        <button class="btn btn-glass" (click)="loadUsers()">🔄 تحديث الحالة</button>
      </div>

      <div *ngIf="loading" class="modern-loading">
        <div class="loader-orb"></div>
        <p>جاري مزامنة بيانات الشحن والتسليم...</p>
      </div>

      <ng-container *ngIf="!loading">
        <div *ngIf="users.length > 0; else emptyState">
          <!-- Desktop Table (Visible on large screens) -->
          <div class="table-container animate-spring">
            <table>
              <thead>
                <tr>
                  <th>المشترك</th>
                  <th>نوع الحصة</th>
                  <th>إجمالي المسدد</th>
                  <th>الرصيد المتبقي</th>
                  <th>حالة الاستلام</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of users">
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
                  <td class="text-accent font-bold">{{ user.paid | number:'1.0-3' }} جم</td>
                  <td class="text-danger font-bold">{{ user.remaining }} جم</td>
                  <td>
                    <div class="status-wrap" [ngClass]="user.isReceived ? 'received' : 'pending'">
                      <span class="dot"></span>
                      {{ user.isReceived ? 'تم الاستلام' : 'بانتظار التسليم' }}
                    </div>
                  </td>
                  <td>
                    <button *ngIf="!user.isReceived" (click)="markAsReceived(user)" class="btn btn-primary btn-mini">
                      📦 تأكيد الاستلام
                    </button>
                    <span *ngIf="user.isReceived" class="text-done">✨ اكتملت العملية</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Deliveries List (Visible only on mobile) -->
          <div class="mobile-deliveries-list animate-spring">
            <div class="delivery-card card glass-glow" *ngFor="let user of users">
              <div class="card-header-delivery">
                <div class="user-cell">
                  <div class="user-avatar">{{ user.username.charAt(0) }}</div>
                  <span class="username">{{ user.username }}</span>
                </div>
                <span class="badge-modern" [ngClass]="user.share_type === 'full' ? 'gold' : 'emerald'">
                  {{ user.share_type === 'full' ? 'سهم كامل' : 'نصف سهم' }}
                </span>
              </div>
              
              <div class="card-body-delivery">
                <div class="stat-item">
                  <span class="label">إجمالي المسدد:</span>
                  <span class="value text-accent font-bold">{{ user.paid | number:'1.0-3' }} جم</span>
                </div>
                <div class="stat-item">
                  <span class="label">الرصيد المتبقي:</span>
                  <span class="value text-danger font-bold">{{ user.remaining }} جم</span>
                </div>
                <div class="stat-item full-width">
                  <span class="label">حالة الاستلام:</span>
                  <div class="status-wrap" [ngClass]="user.isReceived ? 'received' : 'pending'">
                    <span class="dot"></span>
                    {{ user.isReceived ? 'تم الاستلام' : 'بانتظار التسليم' }}
                  </div>
                </div>
              </div>

              <div class="card-actions-delivery">
                <button *ngIf="!user.isReceived" (click)="markAsReceived(user)" class="btn-action-delivery btn-primary">
                  📦 تأكيد التسليم وتوثيق الحالة
                </button>
                <span *ngIf="user.isReceived" class="text-done">✨ اكتملت عملية الاستلام بنجاح</span>
              </div>
            </div>
          </div>
        </div>

        <ng-template #emptyState>
          <div class="modern-empty card">
            <div class="icon">📦</div>
            <h3>لا توجد سجلات حالياً</h3>
            <p>سيظهر هنا سجل الأعضاء وجاهزيتهم للاستلام.</p>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
  styles: [`
    .deliveries-page { padding: 1rem 0; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3.5rem; }
    .subtitle { color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem; }

    .user-cell { display: flex; align-items: center; gap: 1rem; 
      .user-avatar { width: 38px; height: 38px; background: rgba(255, 255, 255, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 1px solid var(--glass-border); }
      .username { font-weight: 800; }
    }

    .badge-modern {
      padding: 0.4rem 1.2rem; border-radius: 100px; font-size: 0.75rem; font-weight: 900; text-transform: uppercase;
      &.gold { background: rgba(212, 175, 55, 0.1); color: var(--primary); border: 1px solid var(--primary); }
      &.emerald { background: rgba(16, 185, 129, 0.1); color: var(--accent); border: 1px solid var(--accent); }
    }

    .status-wrap {
      display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 1rem; border-radius: 100px; font-size: 0.85rem; font-weight: 800;
      .dot { width: 8px; height: 8px; border-radius: 50%; }
      &.received { background: rgba(16, 185, 129, 0.1); color: var(--accent); .dot { background: var(--accent); box-shadow: 0 0 10px var(--accent); } }
      &.pending { background: rgba(212, 175, 55, 0.1); color: var(--primary); .dot { background: var(--primary); box-shadow: 0 0 10px var(--primary); animation: pulse 1.5s infinite; } }
    }

    .btn-mini { padding: 0.5rem 1rem; font-size: 0.8rem; border-radius: 12px; }
    .text-done { color: var(--accent); font-weight: 900; font-size: 0.9rem; text-shadow: 0 0 10px rgba(16, 185, 129, 0.2); }
    .text-accent { color: var(--accent); }

    .modern-loading { text-align: center; padding: 5rem; .loader-orb { width: 40px; height: 40px; border: 3px solid transparent; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; } }
    @keyframes spin { to { transform: rotate(360deg); } }

    .modern-empty { text-align: center; padding: 6rem 2rem; .icon { font-size: 5rem; margin-bottom: 1.5rem; opacity: 0.3; } }

    .mobile-deliveries-list {
      display: none;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }

    .delivery-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 24px;
      
      .card-header-delivery {
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

      .card-body-delivery {
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

      .card-actions-delivery {
        display: flex;
        justify-content: center;
        align-items: center;
        
        .btn-action-delivery {
          width: 100%;
          padding: 0.85rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--primary), #b8860b);
          color: #000;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          
          &:hover {
            box-shadow: 0 5px 15px rgba(212, 175, 55, 0.2);
            transform: translateY(-2px);
          }
        }
        .text-done {
          width: 100%;
          text-align: center;
          padding: 0.75rem;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 12px;
          color: var(--accent);
          font-weight: 800;
          font-size: 0.9rem;
          text-shadow: none;
        }
      }
    }

    @media (max-width: 768px) {
      .table-container {
        display: none !important;
      }
      .mobile-deliveries-list {
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
      .btn { width: 100%; justify-content: center; }
    }
  `]
})
export class DeliveriesComponent implements OnInit {
  dataService = inject(DataService);
  cdr = inject(ChangeDetectorRef);
  users: any[] = [];
  loading = true;

  ngOnInit() { this.loadUsers(); }

  async loadUsers() {
    this.loading = true;
    this.cdr.detectChanges();
    const { data, error } = await this.dataService.getUsers();
    if (error) console.error('Error:', error);
    this.users = (data || []).filter((u: any) => u.role === 'user');
    this.loading = false;
    this.cdr.detectChanges();
  }

  async markAsReceived(user: any) {
    const res = await Swal.fire({
      title: 'تأكيد التسليم؟',
      text: `سيتم تغيير حالة "${user.username}" إلى "تم الاستلام"`,
      icon: 'question', showCancelButton: true,
      confirmButtonText: 'نعم، تم التسليم', cancelButtonText: 'إلغاء', confirmButtonColor: '#d4ff00'
    });
    if (res.isConfirmed) {
      const { error } = await this.dataService.updateUser(user.id, { isReceived: true });
      if (error) { Swal.fire('خطأ', error.message, 'error'); }
      else { this.loadUsers(); }
    }
  }
}
