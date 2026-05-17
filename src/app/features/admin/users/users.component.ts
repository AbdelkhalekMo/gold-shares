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
    <div class="users-page animate-spring">
      <div class="page-header">
        <div class="title">
          <h1 class="islamic-header text-gradient">إدارة المشتركين</h1>
          <p class="subtitle">التحكم الكامل في سجلات الأعضاء وحصص الذهب</p>
        </div>
        <div class="actions-header">
          <button class="btn btn-glass" (click)="loadUsers()">🔄 تحديث</button>
          <button class="btn btn-primary" (click)="showModal = true">+ إضافة عضو جديد</button>
        </div>
      </div>

      <div *ngIf="loading" class="modern-loading">
        <div class="loader-orb"></div>
        <p>جاري استرجاع قائمة الأعضاء...</p>
      </div>

      <ng-container *ngIf="!loading">
        <div *ngIf="users.length > 0; else emptyUsers">
          <!-- Desktop Table (Visible on large screens) -->
          <div class="table-container animate-spring">
            <table>
              <thead>
                <tr>
                  <th>العضو</th>
                  <th>التواصل</th>
                  <th>نوع الاشتراك</th>
                  <th>المطلوب</th>
                  <th>المسدد</th>
                  <th>الإجراءات</th>
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
                  <td class="email-cell">{{ user.email }}</td>
                  <td>
                    <span class="badge-modern" [ngClass]="user.share_type === 'full' ? 'gold' : 'emerald'">
                      {{ user.share_type === 'full' ? 'سهم كامل' : 'نصف سهم' }}
                    </span>
                  </td>
                  <td class="text-danger font-bold">{{ user.remaining }} جم</td>
                  <td class="text-accent font-bold">{{ user.paid | number:'1.0-3' }} جم</td>
                  <td class="actions">
                    <a [routerLink]="['/admin/transactions', user.id]" class="action-btn view" title="المعاملات">👁️</a>
                    <a [routerLink]="['/admin/user-profile', user.id]" class="action-btn profile" title="البروفايل">👤</a>
                    <button (click)="deleteUser(user)" class="action-btn delete" title="حذف">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Card List (Visible only on mobile) -->
          <div class="mobile-user-list animate-spring">
            <div class="user-card card glass-glow" *ngFor="let user of users">
              <div class="card-header-user">
                <div class="user-cell">
                  <div class="user-avatar">{{ user.username.charAt(0) }}</div>
                  <div class="user-meta">
                    <span class="username">{{ user.username }}</span>
                    <span class="user-email">{{ user.email }}</span>
                  </div>
                </div>
                <span class="badge-modern" [ngClass]="user.share_type === 'full' ? 'gold' : 'emerald'">
                  {{ user.share_type === 'full' ? 'سهم كامل' : 'نصف سهم' }}
                </span>
              </div>
              
              <div class="card-body-user">
                <div class="stat-item">
                  <span class="label">المسدد:</span>
                  <span class="value text-accent font-bold">{{ user.paid | number:'1.0-3' }} جم</span>
                </div>
                <div class="stat-item">
                  <span class="label">المطلوب:</span>
                  <span class="value text-danger font-bold">{{ user.remaining }} جم</span>
                </div>
              </div>

              <div class="card-actions-user">
                <a [routerLink]="['/admin/transactions', user.id]" class="btn-action-mobile view">
                  <span>👁️ المعاملات</span>
                </a>
                <a [routerLink]="['/admin/user-profile', user.id]" class="btn-action-mobile profile">
                  <span>👤 الملف الشخصي</span>
                </a>
                <button (click)="deleteUser(user)" class="btn-action-mobile delete">
                  <span>🗑️ حذف العضو</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <ng-template #emptyUsers>
          <div class="modern-empty card">
            <div class="icon">👥</div>
            <h3>لا توجد سجلات حالياً</h3>
            <p>ابدأ ببناء مجتمعك بإضافة أول عضو للمنظومة.</p>
          </div>
        </ng-template>
      </ng-container>
    </div>

    <!-- Advanced Modern Modal -->
    <div class="modal-wrapper" *ngIf="showModal" (click)="onOverlayClick($event)">
      <div class="modal-glass animate-spring">
        <div class="modal-header">
          <h2 class="text-gradient">تسجيل عضو جديد</h2>
          <button class="close-btn" (click)="showModal = false">×</button>
        </div>
        
        <form (ngSubmit)="addUser()" class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>الاسم الكامل</label>
              <div class="input-modern">
                <input type="text" [(ngModel)]="newUser.username" name="username" required placeholder="اسم المشترك">
              </div>
            </div>
            <div class="form-group">
              <label>البريد الإلكتروني</label>
              <div class="input-modern">
                <input type="email" [(ngModel)]="newUser.email" name="email" required dir="ltr" placeholder="mail@example.com">
              </div>
            </div>
            <div class="form-group">
              <label>كلمة المرور المؤقتة</label>
              <div class="input-modern">
                <input type="password" [(ngModel)]="newUser.password" name="password" required dir="ltr" placeholder="••••••••">
              </div>
            </div>
            <div class="form-group">
              <label>نوع السهم الاستثماري</label>
              <div class="input-modern select-wrapper">
                <select [(ngModel)]="newUser.share_type" name="share_type" required>
                  <option value="full">سهم كامل (مقدم 3.5 جم - متبقي 28 جم)</option>
                  <option value="half">نصف سهم (مقدم 1.5 جم - متبقي 14 جم)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-glass" (click)="showModal = false">إلغاء</button>
            <button type="submit" class="btn btn-primary" [disabled]="saving">
              {{ saving ? 'جاري المعالجة...' : 'تأكيد التسجيل' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .users-page { padding: 1rem 0; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3.5rem; }
    .subtitle { color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem; }
    .actions-header { display: flex; gap: 1rem; }

    .user-cell { display: flex; align-items: center; gap: 1rem; 
      .user-avatar { width: 40px; height: 40px; background: var(--primary); color: #000; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.2rem; }
      .username { font-weight: 800; font-size: 1rem; }
    }
    .email-cell { color: var(--text-muted); font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.9rem; }
    .text-accent { color: var(--accent); }

    .badge-modern {
      padding: 0.4rem 1.2rem; border-radius: 100px; font-size: 0.75rem; font-weight: 900; text-transform: uppercase;
      &.gold { background: rgba(212, 175, 55, 0.1); color: var(--primary); border: 1px solid var(--primary); }
      &.emerald { background: rgba(16, 185, 129, 0.1); color: var(--accent); border: 1px solid var(--accent); }
    }

    .actions { display: flex; gap: 0.75rem; }
    .action-btn {
      width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 12px;
      background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; cursor: pointer;
      transition: all 0.3s ease; text-decoration: none;
      &:hover { transform: translateY(-3px); border-color: var(--primary); color: var(--primary); }
      &.delete:hover { border-color: #ff4d4d; color: #ff4d4d; }
    }

    .modal-wrapper { 
      position: fixed; 
      inset: 0; 
      background: rgba(2, 6, 23, 0.9); 
      backdrop-filter: blur(16px); 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      z-index: 2000; 
      padding: 2rem 1.5rem; 
      overflow-y: auto;
    }
    .modal-glass {
      margin: auto;
      background: linear-gradient(135deg, #021a14 0%, #042f24 100%); 
      border: 1px solid rgba(212, 175, 55, 0.25); 
      border-radius: 32px; 
      width: 100%; 
      max-width: 620px; 
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 50px rgba(212, 175, 55, 0.2);
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: radial-gradient(circle at 50% -20%, rgba(212, 175, 55, 0.15), transparent 70%);
        pointer-events: none;
      }
    }
    .modal-header { padding: 2rem 2.5rem; border-bottom: 1px solid rgba(212, 175, 55, 0.1); display: flex; justify-content: space-between; align-items: center; position: relative;
      h2 { font-size: 1.8rem; font-weight: 900; font-family: 'Amiri', serif; color: var(--primary); text-shadow: 0 0 10px rgba(212, 175, 55, 0.2); }
      .close-btn { background: rgba(212, 175, 55, 0.05); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 12px; color: var(--primary); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; cursor: pointer; transition: all 0.3s ease;
        &:hover { background: var(--primary); color: #000; border-color: var(--primary); box-shadow: 0 0 15px rgba(212, 175, 55, 0.3); }
      }
    }
    .modal-body { padding: 2rem 2.5rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      label {
        font-size: 0.9rem;
        font-weight: 800;
        color: var(--primary);
        margin-right: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        &::before {
          content: '✦';
          font-size: 0.75rem;
          color: var(--primary);
          opacity: 0.8;
        }
      }
    }

    .input-modern {
      position: relative;
      width: 100%;
      
      input, select {
        width: 100%;
        background: rgba(4, 47, 36, 0.25); 
        border: 1px solid rgba(212, 175, 55, 0.15); 
        border-radius: 16px;
        padding: 0.95rem 1.25rem;
        color: #fff;
        font-size: 0.95rem;
        font-weight: 700;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        box-sizing: border-box;
        
        &:focus {
          border-color: var(--primary);
          background: rgba(4, 47, 36, 0.45); 
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.25); 
          outline: none;
        }
      }
      
      select {
        appearance: none;
        -webkit-appearance: none;
        cursor: pointer;
        padding-left: 2.5rem;
        
        option {
          background: #042f24; 
          color: #fff;
          padding: 1rem;
        }
      }
      
      &.select-wrapper::after {
        content: '▼';
        font-size: 0.65rem;
        color: var(--primary);
        position: absolute;
        left: 1.25rem;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        transition: transform 0.3s ease;
      }
      &:focus-within.select-wrapper::after {
        transform: translateY(-50%) rotate(180deg);
      }
    }
    .modal-footer { margin-top: 2.5rem; display: flex; justify-content: flex-end; gap: 1.5rem; }

    .modern-loading { text-align: center; padding: 5rem; .loader-orb { width: 40px; height: 40px; border: 3px solid transparent; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; } }
    @keyframes spin { to { transform: rotate(360deg); } }

    .modern-empty { text-align: center; padding: 5rem; .icon { font-size: 4rem; opacity: 0.3; margin-bottom: 1rem; } }

    .mobile-user-list {
      display: none;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }

    .user-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 24px;
      
      .card-header-user {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding-bottom: 1rem;
        
        .user-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          
          .user-avatar {
            width: 44px;
            height: 44px;
            background: var(--primary);
            color: #000;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 1.2rem;
          }
          
          .user-meta {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            
            .username {
              font-weight: 800;
              font-size: 1rem;
              color: var(--text-main);
            }
            .user-email {
              font-size: 0.8rem;
              color: var(--text-muted);
              font-family: 'Plus Jakarta Sans', sans-serif;
            }
          }
        }
      }

      .card-body-user {
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
            font-size: 1rem;
          }
        }
      }

      .card-actions-user {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
        
        .btn-action-mobile {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 800;
          text-decoration: none;
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s ease;
          cursor: pointer;
          
          &:hover {
            border-color: var(--primary);
            color: var(--primary);
            background: rgba(212, 175, 55, 0.05);
          }
          
          &.delete {
            grid-column: span 2;
            background: rgba(239, 68, 68, 0.05);
            border-color: rgba(239, 68, 68, 0.1);
            color: #ff4d4d;
            
            &:hover {
              background: rgba(239, 68, 68, 0.15);
              border-color: #ef4444;
            }
          }
        }
      }
    }

    @media (max-width: 768px) {
      .table-container {
        display: none !important;
      }
      .mobile-user-list {
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
      .actions-header {
        width: 100%;
        flex-direction: column;
        gap: 0.75rem;
        button { width: 100%; justify-content: center; }
      }
      .modal-glass {
        border-radius: 28px !important;
        max-width: 95vw !important;
      }
      .modal-header {
        padding: 1.5rem 1.75rem !important;
        h2 { font-size: 1.5rem !important; }
      }
      .modal-body {
        padding: 1.5rem 1.75rem !important;
      }
      .modal-footer {
        flex-direction: column-reverse !important;
        gap: 0.75rem !important;
        margin-top: 1.75rem !important;
        button { width: 100% !important; padding: 0.95rem !important; border-radius: 12px !important; justify-content: center !important; }
      }
      .form-grid {
        grid-template-columns: 1fr !important;
        gap: 1.25rem !important;
      }
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
    if ((event.target as HTMLElement).classList.contains('modal-wrapper')) {
      this.showModal = false;
    }
  }
}
