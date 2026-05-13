import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="deliveries-page animate-fade-in">
      <div class="page-header">
        <div>
          <h1>التسليمات</h1>
          <p>إدارة حالة استلام الذهب للمشتركين</p>
        </div>
        <button class="btn btn-outline btn-sm" (click)="loadUsers()">🔄 تحديث</button>
      </div>

      <div *ngIf="loading" class="loading-state">جاري التحميل...</div>

      <ng-container *ngIf="!loading">
        <div class="table-container" *ngIf="users.length > 0; else emptyState">
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>نوع السهم</th>
                <th>المسدد</th>
                <th>المتبقي</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users">
                <td class="font-bold">{{ user.username }}</td>
                <td>{{ user.share_type === 'full' ? 'سهم كامل' : 'نصف سهم' }}</td>
                <td class="text-success">{{ user.paid | number:'1.0-3' }} جم</td>
                <td class="text-danger">{{ user.remaining }} جم</td>
                <td>
                  <span class="badge" [ngClass]="user.isReceived ? 'badge-success' : 'badge-warning'">
                    {{ user.isReceived ? 'تم الاستلام' : 'قيد الانتظار' }}
                  </span>
                </td>
                <td>
                  <button *ngIf="!user.isReceived" (click)="markAsReceived(user)" class="btn btn-primary btn-sm">
                    تم التسليم
                  </button>
                  <span *ngIf="user.isReceived" class="text-done">✓ تم التسليم</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #emptyState>
          <div class="empty-state card">
            <div class="icon">📦</div>
            <h3>لا يوجد مستخدمون مسجلون بعد</h3>
            <p>قم بإضافة مستخدمين من صفحة المستخدمين أولاً.</p>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;
      h1 { font-size: 1.75rem; font-weight: 800; }
      p { color: var(--text-muted); }
    }
    .btn-sm { padding: 0.35rem 0.85rem; font-size: 0.82rem; border-radius: 8px; }
    .text-done { font-weight: 700; color: var(--success); }
    .font-bold { font-weight: 700; }
    .text-danger { color: var(--danger); font-weight: 600; }
    .text-success { color: var(--success); font-weight: 600; }
    .loading-state { text-align: center; padding: 3rem; color: var(--text-muted); }
    .empty-state {
      text-align: center; padding: 4rem 2rem;
      .icon { font-size: 3rem; margin-bottom: 1rem; }
      h3 { margin-bottom: 0.5rem; }
      p { color: var(--text-muted); }
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
