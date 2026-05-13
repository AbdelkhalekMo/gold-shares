import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { User, ShareType } from '../../../core/interfaces/models.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="users-page animate-fade-in">
      <div class="page-header">
        <div class="title">
          <h1>المستخدمين</h1>
          <p>إدارة أعضاء الجمعية وحصصهم</p>
        </div>
        <div class="actions-header">
          <button class="btn btn-outline btn-sm" (click)="loadUsers()">🔄 تحديث</button>
          <button class="btn btn-primary" (click)="showModal = true">+ إضافة مستخدم</button>
        </div>
      </div>

      <div *ngIf="loading" class="loading-state">جاري التحميل...</div>

      <ng-container *ngIf="!loading">
        <div class="table-container" *ngIf="users.length > 0; else emptyUsers">
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>البريد</th>
                <th>نوع السهم</th>
                <th>المتبقي</th>
                <th>المسدد</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users">
                <td class="font-bold">{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="badge" [ngClass]="user.share_type === 'full' ? 'badge-warning' : 'badge-success'">
                    {{ user.share_type === 'full' ? 'سهم كامل' : 'نصف سهم' }}
                  </span>
                </td>
                <td class="text-danger">{{ user.remaining }} جم</td>
                <td class="text-success">{{ user.paid | number:'1.0-3' }} جم</td>
                <td class="actions">
                  <a [routerLink]="['/admin/transactions', user.id]" class="btn-icon view" title="عرض المعاملات">👁️</a>
                  <button (click)="deleteUser(user)" class="btn-icon delete" title="حذف">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #emptyUsers>
          <div class="empty-state card">
            <div class="icon">👥</div>
            <h3>لا يوجد مستخدمون مسجلون</h3>
            <p>قم بإضافة مستخدم جديد باستخدام الزر أعلاه.</p>
          </div>
        </ng-template>
      </ng-container>

      <!-- Add User Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="onOverlayClick($event)">
        <div class="modal-card">
          <h2>إضافة مستخدم جديد</h2>
          <form (ngSubmit)="addUser()">
            <div class="form-group">
              <label>الاسم</label>
              <input type="text" [(ngModel)]="newUser.username" name="username" required placeholder="الاسم الكامل">
            </div>
            <div class="form-group">
              <label>البريد الإلكتروني</label>
              <input type="email" [(ngModel)]="newUser.email" name="email" required dir="ltr" placeholder="example@mail.com">
            </div>
            <div class="form-group">
              <label>كلمة المرور</label>
              <input type="password" [(ngModel)]="newUser.password" name="password" required dir="ltr" placeholder="••••••••">
            </div>
            <div class="form-group">
              <label>نوع السهم</label>
              <select [(ngModel)]="newUser.share_type" name="share_type" required>
                <option value="full">سهم كامل (مقدم 3.5 جم - متبقي 28 جم)</option>
                <option value="half">نصف سهم (مقدم 1.5 جم - متبقي 14 جم)</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" (click)="showModal = false">إلغاء</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving">
                {{ saving ? 'جاري الحفظ...' : 'حفظ المستخدم' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;
      .title h1 { font-size: 1.75rem; font-weight: 800; }
      .title p { color: var(--text-muted); }
    }
    .actions-header { display: flex; gap: 0.75rem; align-items: center; }
    .btn-sm { padding: 0.4rem 1rem; font-size: 0.82rem; }
    .actions { display: flex; gap: 0.5rem; }
    .btn-icon {
      width: 34px; height: 34px; display: flex; align-items: center;
      justify-content: center; border-radius: 8px; cursor: pointer;
      border: 1px solid var(--border-color); text-decoration: none; font-size: 1rem;
      &.view { background: #f0fdf4; }
      &.delete { background: #fef2f2; }
      &:hover { opacity: 0.75; }
    }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem;
    }
    .modal-card {
      background: #fff; padding: 2rem; border-radius: 20px; width: 100%; max-width: 500px;
      h2 { margin-bottom: 1.5rem; font-size: 1.25rem; font-weight: 800; }
    }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.25rem; }
    .text-danger { color: var(--danger); font-weight: 600; }
    .text-success { color: var(--success); font-weight: 600; }
    .font-bold { font-weight: 700; }
    .loading-state { text-align: center; padding: 3rem; color: var(--text-muted); }
    .empty-state {
      text-align: center; padding: 4rem 2rem;
      .icon { font-size: 3rem; margin-bottom: 1rem; }
      h3 { margin-bottom: 0.5rem; }
      p { color: var(--text-muted); }
    }
  `]
})
export class UsersComponent implements OnInit {
  dataService = inject(DataService);
  cdr = inject(ChangeDetectorRef);

  users: any[] = [];
  loading = true;
  saving = false;
  showModal = false;

  newUser = { username: '', email: '', password: '', share_type: 'full' as ShareType };

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    this.cdr.detectChanges();

    const { data, error } = await this.dataService.getUsers();
    if (error) {
      console.error('Error loading users:', error);
      Swal.fire('خطأ في التحميل', error.message, 'error');
    }

    this.users = (data || []).filter((u: any) => u.role === 'user');
    this.loading = false;
    this.cdr.detectChanges();
  }

  async addUser() {
    if (!this.newUser.username || !this.newUser.email || !this.newUser.password) return;
    this.saving = true;

    const isFull = this.newUser.share_type === 'full';
    const userToSave = {
      username: this.newUser.username,
      email: this.newUser.email,
      password: this.newUser.password,
      share_type: this.newUser.share_type,
      advance: isFull ? 3.5 : 1.5,
      remaining: isFull ? 28 : 14,
      paid: 0,
      totalAmount: 0,
      isReceived: false,
      role: 'user'
    };

    const { error } = await this.dataService.addUser(userToSave);
    if (error) {
      Swal.fire('خطأ', error.message, 'error');
    } else {
      Swal.fire({ title: 'تم', text: 'تم إضافة المستخدم بنجاح', icon: 'success', timer: 1500, showConfirmButton: false });
      this.showModal = false;
      this.newUser = { username: '', email: '', password: '', share_type: 'full' };
      this.loadUsers();
    }
    this.saving = false;
  }

  async deleteUser(user: any) {
    const res = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `سيتم حذف "${user.username}" وجميع معاملاته!`,
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء', confirmButtonColor: '#ef4444'
    });
    if (res.isConfirmed) {
      const { error } = await this.dataService.deleteUser(user.id);
      if (error) { Swal.fire('خطأ', error.message, 'error'); }
      else { this.loadUsers(); }
    }
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showModal = false;
    }
  }
}
