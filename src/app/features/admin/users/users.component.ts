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
          <p class="subtitle">التحكم الكامل في سجلات الأعضاء، المشرفين، وحصص الذهب الاستثمارية</p>
        </div>
        <div class="actions-header">
          <button class="btn btn-glass" (click)="loadUsers()">🔄 تحديث</button>
          <button class="btn btn-primary" (click)="showModal = true">+ إضافة عضو جديد</button>
        </div>
      </div>

      <!-- Association Share Settings Card -->
      <div class="card glass-glow settings-card animate-spring">
        <div class="card-header-settings">
          <span class="icon">⚙️</span>
          <h2>إعدادات الجرامات والمقدمات للجمعية</h2>
        </div>
        <form (ngSubmit)="saveSettings()" class="settings-form">
          <div class="settings-grid">
            <div class="form-group">
              <label>إجمالي جرامات السهم الكامل</label>
              <div class="input-modern">
                <input type="number" step="0.01" [(ngModel)]="settings.full_share_total" name="full_share_total" required>
                <span class="badge-inside">جرام</span>
              </div>
            </div>
            
            <div class="form-group">
              <label>إجمالي جرامات نصف السهم (محسوب)</label>
              <div class="input-modern locked">
                <input type="number" [value]="settings.full_share_total / 2.0" name="half_share_total" readonly>
                <span class="badge-inside">جرام</span>
              </div>
            </div>
            
            <div class="form-group">
              <label>مقدم السهم الكامل</label>
              <div class="input-modern">
                <input type="number" step="0.01" [(ngModel)]="settings.full_share_advance" name="full_share_advance" required>
                <span class="badge-inside">جرام</span>
              </div>
            </div>
            
            <div class="form-group">
              <label>مقدم نصف السهم</label>
              <div class="input-modern">
                <input type="number" step="0.01" [(ngModel)]="settings.half_share_advance" name="half_share_advance" required>
                <span class="badge-inside">جرام</span>
              </div>
            </div>

            <div class="form-group">
              <label>هدية السهم الكامل</label>
              <div class="input-modern">
                <input type="number" step="0.01" [(ngModel)]="settings.full_share_gift" name="full_share_gift" required>
                <span class="badge-inside">جرام</span>
              </div>
            </div>
            
            <div class="form-group">
              <label>هدية نصف السهم</label>
              <div class="input-modern">
                <input type="number" step="0.01" [(ngModel)]="settings.half_share_gift" name="half_share_gift" required>
                <span class="badge-inside">جرام</span>
              </div>
            </div>
          </div>
          <div class="settings-actions">
            <button type="submit" class="btn btn-primary" [disabled]="savingSettings">
              {{ savingSettings ? 'جاري حفظ الإعدادات وتحديث الأرصدة...' : '💾 حفظ وتعميم الإعدادات' }}
            </button>
          </div>
        </form>
      </div>

      <div *ngIf="loading" class="modern-loading">
        <div class="loader-orb"></div>
        <p>جاري استرجاع قائمة الأعضاء والمشرفين...</p>
      </div>

      <ng-container *ngIf="!loading">
        <div *ngIf="users.length > 0; else emptyUsers">
          <!-- Desktop Table (Visible on large screens) -->
          <div class="table-container animate-spring">
            <table>
              <thead>
                <tr>
                  <th>العضو المشترك</th>
                  <th>التواصل</th>
                  <th>نوع الاشتراك</th>
                  <th>المقدم المطلوب</th>
                  <th>الهدية المقدمة</th>
                  <th>المسدد</th>
                  <th>المتبقي الكلي</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of users">
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar">{{ user.username.charAt(0) }}</div>
                      <div style="display: flex; flex-direction: column;">
                        <span class="username">{{ user.username }}</span>
                        <span class="member-code" style="font-size: 0.75rem; color: var(--primary); font-weight: 800;" *ngIf="user.member_code">
                          رقم العضو: {{ user.member_code }}
                        </span>
                        <span class="delivery-date" style="font-size: 0.7rem; color: var(--text-muted);" *ngIf="user.expected_delivery_date">
                          التسليم المتوقع: {{ user.expected_delivery_date }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="email-cell">{{ user.email }}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <span class="badge-modern" [ngClass]="user.share_type === 'full' ? 'gold' : (user.share_type === 'half' ? 'emerald' : 'purple')">
                        {{ user.share_type === 'full' ? 'سهم كامل' : (user.share_type === 'half' ? 'نصف سهم' : 'سهم مخصص') }}
                      </span>
                      <span *ngIf="user.role === 'supervisor'" class="badge-modern supervisor-badge" title="مشرف ذو صلاحيات مراقبة محدودة">مشرف</span>
                    </div>
                  </td>
                  <td class="font-bold text-accent">{{ user.advance }} جم</td>
                  <td class="font-bold text-warning">{{ user.gift || 0 }} جم</td>
                  <td class="text-success font-bold">{{ user.paid | number:'1.0-3' }} جم</td>
                  <td class="text-danger font-bold">{{ user.remaining }} جم</td>
                  <td class="actions">
                    <button (click)="openEditModal(user)" class="action-btn edit" title="تعديل بيانات العضو">✏️</button>
                    <a [routerLink]="['/admin/transactions', user.id]" class="action-btn view" title="سجل المعاملات الحسابية">👁️</a>
                    
                    <!-- Promote / Demote Role toggle button -->
                    <button (click)="toggleRole(user)" class="action-btn role-toggle" [class.is-supervisor]="user.role === 'supervisor'" [title]="user.role === 'supervisor' ? 'تنزيل لرتبة عضو مساهم' : 'ترقية لرتبة مشرف مراقب'">
                      {{ user.role === 'supervisor' ? '👤' : '🔑' }}
                    </button>
                    
                    <button (click)="deleteUser(user)" class="action-btn delete" title="حذف العضو بالكامل">🗑️</button>
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
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                      <span class="username">{{ user.username }}</span>
                      <span class="member-code" style="font-size: 0.75rem; color: var(--primary); font-weight: 800; display: block; margin-top: 0.15rem;" *ngIf="user.member_code">
                        رقم العضو: {{ user.member_code }}
                      </span>
                      <span class="delivery-date" style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 0.1rem;" *ngIf="user.expected_delivery_date">
                        التسليم المتوقع: {{ user.expected_delivery_date }}
                      </span>
                      <span *ngIf="user.role === 'supervisor'" class="badge-modern supervisor-badge mobile-badge">مشرف</span>
                    </div>
                    <span class="user-email">{{ user.email }}</span>
                  </div>
                </div>
                <span class="badge-modern" [ngClass]="user.share_type === 'full' ? 'gold' : (user.share_type === 'half' ? 'emerald' : 'purple')">
                  {{ user.share_type === 'full' ? 'سهم كامل' : (user.share_type === 'half' ? 'نصف سهم' : 'سهم مخصص') }}
                </span>
              </div>
              
              <div class="card-body-user">
                <div class="stat-item">
                  <span class="label">المقدم المطلوب:</span>
                  <span class="value text-accent font-bold">{{ user.advance }} جم</span>
                </div>
                <div class="stat-item">
                  <span class="label">الهدية المقدمة:</span>
                  <span class="value text-warning font-bold">{{ user.gift || 0 }} جم</span>
                </div>
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
                <button (click)="openEditModal(user)" class="btn-action-mobile edit" style="background: rgba(234, 179, 8, 0.1); color: var(--accent);">
                  <span>✏️ تعديل البيانات</span>
                </button>

                <a [routerLink]="['/admin/transactions', user.id]" class="btn-action-mobile view">
                  <span>👁️ المعاملات</span>
                </a>
                
                <button (click)="toggleRole(user)" class="btn-action-mobile promote">
                  <span>{{ user.role === 'supervisor' ? '👤 تنزيل لعضو' : '🔑 ترقية لمشرف' }}</span>
                </button>
                
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
            <h3>لا توجد حسابات مسجلة</h3>
            <p>لم يتم العثور على أي أعضاء مساهمين أو مشرفين في النظام حالياً.</p>
          </div>
        </ng-template>
      </ng-container>
    </div>

    <!-- Advanced Modern Modal: Add User -->
    <div class="modal-wrapper" *ngIf="showModal" (click)="onOverlayClick($event)">
      <div class="modal-glass animate-spring">
        <div class="modal-header">
          <h2 class="text-gradient">تسجيل عضو جديد</h2>
          <button class="close-btn" (click)="showModal = false">×</button>
        </div>
        
        <form (ngSubmit)="addUser()" class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>رقم/كود العضو الخاص (ID)</label>
              <div class="input-modern">
                <input type="text" [(ngModel)]="newUser.member_code" name="member_code" required placeholder="مثال: GS-105">
              </div>
            </div>

            <div class="form-group">
              <label>تاريخ التسليم المتوقع للسهم</label>
              <div class="input-modern">
                <input type="text" [(ngModel)]="newUser.expected_delivery_date" name="expected_delivery_date" placeholder="مثال: أكتوبر 2026 أو 2026-10-15">
              </div>
            </div>
            
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
                  <option value="full">سهم كامل (المقدم المطلوب: {{ settings.full_share_advance + (settings.full_share_gift || 0) }} جم [منهم {{ settings.full_share_gift || 0 }} هدية] - متبقي {{ settings.full_share_total - settings.full_share_advance - (settings.full_share_gift || 0) }} جم)</option>
                  <option value="half">نصف سهم (المقدم المطلوب: {{ settings.half_share_advance + (settings.half_share_gift || 0) }} جم [منهم {{ settings.half_share_gift || 0 }} هدية] - متبقي {{ (settings.full_share_total / 2.0) - settings.half_share_advance - (settings.half_share_gift || 0) }} جم)</option>
                  <option value="custom">مخصص (إدخال يدوي للمقدم، الإجمالي، والهدية)</option>
                </select>
              </div>
            </div>

            <!-- Custom Share Fields (Shown conditionally) -->
            <ng-container *ngIf="newUser.share_type === 'custom'">
              <div class="form-group">
                <label>إجمالي السهم المخصص (توتال)</label>
                <div class="input-modern">
                  <input type="number" step="0.01" [(ngModel)]="customTotal" name="customTotal" required placeholder="مثال: 50.0">
                  <span class="badge-inside">جرام</span>
                </div>
              </div>
              
              <div class="form-group">
                <label>مقدم السهم المخصص</label>
                <div class="input-modern">
                  <input type="number" step="0.01" [(ngModel)]="customAdvance" name="customAdvance" required placeholder="مثال: 5.0">
                  <span class="badge-inside">جرام</span>
                </div>
              </div>
              
              <div class="form-group full-width-field">
                <label>هدية مخصصة من السهم (تُخصم من الإجمالي)</label>
                <div class="input-modern">
                  <input type="number" step="0.01" [(ngModel)]="customGift" name="customGift" placeholder="مثال: 1.5 (اختياري)">
                  <span class="badge-inside">جرام</span>
                </div>
              </div>
            </ng-container>

            <!-- New Dropdown to select role -->
            <div class="form-group full-width-field">
              <label>رتبة وصلاحية الحساب</label>
              <div class="input-modern select-wrapper">
                <select [(ngModel)]="newUser.role" name="role" required>
                  <option value="user">عضو مساهم (صلاحيات عادية للوحة العضو)</option>
                  <option value="supervisor">مشرف مراقب (متابعة وإدخال دون أرشيف/ملفات)</option>
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

    <!-- Advanced Modern Modal: Edit User -->
    <div class="modal-wrapper" *ngIf="showEditModal" (click)="onOverlayClick($event)">
      <div class="modal-glass animate-spring">
        <div class="modal-header">
          <h2 class="text-gradient">تعديل بيانات العضو</h2>
          <button class="close-btn" (click)="showEditModal = false">×</button>
        </div>
        
        <form (ngSubmit)="saveEditUser()" class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>رقم/كود العضو الخاص (ID)</label>
              <div class="input-modern">
                <input type="text" [(ngModel)]="editingUser.member_code" name="member_code" required placeholder="مثال: GS-105">
              </div>
            </div>

            <div class="form-group">
              <label>تاريخ التسليم المتوقع للسهم</label>
              <div class="input-modern">
                <input type="text" [(ngModel)]="editingUser.expected_delivery_date" name="expected_delivery_date" placeholder="مثال: أكتوبر 2026 أو 2026-10-15">
              </div>
            </div>
            
            <div class="form-group">
              <label>الاسم الكامل</label>
              <div class="input-modern">
                <input type="text" [(ngModel)]="editingUser.username" name="username" required placeholder="اسم المشترك">
              </div>
            </div>
            
            <div class="form-group">
              <label>البريد الإلكتروني</label>
              <div class="input-modern">
                <input type="email" [(ngModel)]="editingUser.email" name="email" required dir="ltr" placeholder="mail@example.com">
              </div>
            </div>
            
            <div class="form-group">
              <label>كلمة المرور الجديدة (اختياري)</label>
              <div class="input-modern">
                <input type="password" [(ngModel)]="editingUser.password" name="password" dir="ltr" placeholder="اتركه فارغاً لعدم التغيير">
              </div>
            </div>
            
            <div class="form-group">
              <label>نوع السهم الاستثماري</label>
              <div class="input-modern select-wrapper">
                <select [(ngModel)]="editingUser.share_type" name="share_type" required>
                  <option value="full">سهم كامل (المقدم المطلوب: {{ settings.full_share_advance + (settings.full_share_gift || 0) }} جم [منهم {{ settings.full_share_gift || 0 }} هدية] - متبقي {{ settings.full_share_total - settings.full_share_advance - (settings.full_share_gift || 0) }} جم)</option>
                  <option value="half">نصف سهم (المقدم المطلوب: {{ settings.half_share_advance + (settings.half_share_gift || 0) }} جم [منهم {{ settings.half_share_gift || 0 }} هدية] - متبقي {{ (settings.full_share_total / 2.0) - settings.half_share_advance - (settings.half_share_gift || 0) }} جم)</option>
                  <option value="custom">مخصص (إدخال يدوي للمقدم، الإجمالي، والهدية)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Custom Inputs for Custom Share Type -->
          <div class="custom-share-fields animate-spring" *ngIf="editingUser.share_type === 'custom'">
            <h3 class="text-gradient-gold">⚙️ تفاصيل السهم المخصص</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>إجمالي وزن السهم (جم)</label>
                <div class="input-modern">
                  <input type="number" step="0.01" [(ngModel)]="customTotal" name="customTotal" required placeholder="مثال: 15.75">
                </div>
              </div>
              <div class="form-group">
                <label>مقدم السهم المالي (جم)</label>
                <div class="input-modern">
                  <input type="number" step="0.01" [(ngModel)]="customAdvance" name="customAdvance" required placeholder="مثال: 2.5">
                </div>
              </div>
              <div class="form-group">
                <label>وزن الهدية الذهبية (جم)</label>
                <div class="input-modern">
                  <input type="number" step="0.01" [(ngModel)]="customGift" name="customGift" placeholder="مثال: 0.5 (اختياري)">
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-glass" (click)="showEditModal = false">إلغاء</button>
            <button type="submit" class="btn btn-primary" [disabled]="saving">
              {{ saving ? 'جاري الحفظ...' : 'حفظ التعديلات' }}
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
      &.purple { background: rgba(139, 92, 246, 0.1); color: #a78bfa; border: 1px solid #8b5cf6; }
      
      &.supervisor-badge {
        background: rgba(167, 139, 250, 0.1);
        color: #c084fc;
        border: 1px solid rgba(167, 139, 250, 0.35);
        font-family: 'Amiri', serif;
        font-size: 0.7rem;
        padding: 0.3rem 0.8rem;
      }
    }

    .actions { display: flex; gap: 0.75rem; }
    .action-btn {
      width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 12px;
      background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; cursor: pointer;
      transition: all 0.3s ease; text-decoration: none;
      &:hover { transform: translateY(-3px); border-color: var(--primary); color: var(--primary); }
      &.role-toggle:hover { border-color: #c084fc; color: #c084fc; background: rgba(167, 139, 250, 0.05); }
      &.role-toggle.is-supervisor { border-color: #a78bfa; color: #a78bfa; background: rgba(167, 139, 250, 0.15); }
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
      &.full-width-field {
        grid-column: span 2;
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
 
     /* Share Settings Card */
     .settings-card {
       padding: 2rem;
       margin-bottom: 2.5rem;
       background: linear-gradient(135deg, rgba(4, 47, 36, 0.15) 0%, rgba(2, 6, 23, 0.4) 100%);
       border: 1px solid var(--glass-border);
       border-radius: 28px;
       
       .card-header-settings {
         display: flex;
         align-items: center;
         gap: 0.75rem;
         margin-bottom: 1.5rem;
         border-bottom: 1px solid rgba(255, 255, 255, 0.05);
         padding-bottom: 0.75rem;
         
         .icon { font-size: 1.5rem; }
         h2 { font-size: 1.25rem; font-weight: 800; color: var(--primary); }
       }
     }
     
     .settings-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.25rem;
        margin-bottom: 1.5rem;
      }
     
     .settings-actions {
       display: flex;
       justify-content: flex-end;
       
       button {
         font-weight: 800;
         padding: 0.95rem 2rem;
       }
     }
     
     .input-modern.locked {
       input {
         background: rgba(255, 255, 255, 0.02);
         border-color: rgba(255, 255, 255, 0.05);
         color: var(--accent);
         font-weight: 900;
       }
     }
     
     .badge-inside {
       position: absolute;
       left: 1rem;
       top: 50%;
       transform: translateY(-50%);
       font-size: 0.8rem;
       color: var(--text-muted);
       font-weight: 800;
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
      .settings-grid {
        grid-template-columns: 1fr !important;
        gap: 1.25rem !important;
      }
      .settings-card {
        padding: 1.5rem !important;
        border-radius: 20px !important;
      }
      .settings-actions button {
        width: 100% !important;
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
  showEditModal = false;
  editingUser: any = null;

  settings = {
    full_share_total: 31.5,
    full_share_advance: 3.5,
    half_share_advance: 1.5,
    full_share_gift: 0,
    half_share_gift: 0
  };
  savingSettings = false;

  newUser = { username: '', email: '', password: '', share_type: 'full' as ShareType, role: 'user', member_code: '', expected_delivery_date: '' };

  customTotal: number | null = null;
  customAdvance: number | null = null;
  customGift: number | null = null;

  ngOnInit() {
    this.loadUsers();
    this.loadSettings();
  }

  async loadSettings() {
    const { data, error } = await this.dataService.getAssociationSettings();
    if (error) {
      console.error('Error loading settings:', error);
    } else if (data) {
      this.settings = {
        full_share_total: Number(data.full_share_total),
        full_share_advance: Number(data.full_share_advance),
        half_share_advance: Number(data.half_share_advance),
        full_share_gift: Number(data.full_share_gift || 0),
        half_share_gift: Number(data.half_share_gift || 0)
      };
    }
    this.cdr.detectChanges();
  }

  async saveSettings() {
    if (this.settings.full_share_total <= 0 || 
        this.settings.full_share_advance < 0 || 
        this.settings.half_share_advance < 0 ||
        this.settings.full_share_gift < 0 ||
        this.settings.half_share_gift < 0) {
      Swal.fire('خطأ', 'برجاء إدخال قيم صحيحة أكبر من الصفر', 'warning');
      return;
    }
    this.savingSettings = true;
    this.cdr.detectChanges();

    const { error } = await this.dataService.updateAssociationSettings({
      full_share_total: this.settings.full_share_total,
      full_share_advance: this.settings.full_share_advance,
      half_share_advance: this.settings.half_share_advance,
      full_share_gift: this.settings.full_share_gift,
      half_share_gift: this.settings.half_share_gift
    });

    if (error) {
      Swal.fire('خطأ في الحفظ', error.message, 'error');
    } else {
      Swal.fire({
        title: 'تم حفظ الإعدادات',
        text: 'تم تحديث أوزان ومقدمات الأسهم لجميع المشتركين تلقائياً بالكامل',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      await this.loadUsers();
    }
    this.savingSettings = false;
    this.cdr.detectChanges();
  }

  async loadUsers() {
    this.loading = true;
    this.cdr.detectChanges();

    const { data, error } = await this.dataService.getUsers();
    if (error) {
      console.error('Error loading users:', error);
      Swal.fire('خطأ في التحميل', error.message, 'error');
    }

    // Load both members and supervisor roles
    this.users = (data || []).filter((u: any) => u.role === 'user' || u.role === 'supervisor');
    this.loading = false;
    this.cdr.detectChanges();
  }

  async addUser() {
    if (!this.newUser.username || !this.newUser.email || !this.newUser.password || !this.newUser.member_code) {
      Swal.fire('تنبيه', 'يرجى ملء جميع الحقول المطلوبة بما فيها كود العضو', 'warning');
      return;
    }
    this.saving = true;

    const cleanCode = this.newUser.member_code.trim();
    if (this.users.some(u => u.member_code && u.member_code.trim().toLowerCase() === cleanCode.toLowerCase())) {
      Swal.fire('تنبيه', 'رقم/كود العضو مستخدم بالفعل لمشترك آخر. يرجى إدخال كود فريد.', 'warning');
      this.saving = false;
      return;
    }

    if (this.newUser.share_type === 'custom') {
      if (!this.customTotal || this.customTotal <= 0) {
        Swal.fire('تنبيه', 'يرجى إدخال إجمالي الجرامات المخصصة بشكل صحيح', 'warning');
        this.saving = false;
        return;
      }
      if (this.customAdvance === null || this.customAdvance < 0) {
        Swal.fire('تنبيه', 'يرجى إدخال قيمة المقدم المخصص بشكل صحيح', 'warning');
        this.saving = false;
        return;
      }
      const total = Number(this.customTotal || 0);
      const adv = Number(this.customAdvance || 0);
      const gift = Number(this.customGift || 0);
      if (total - gift - adv < 0) {
        Swal.fire('تنبيه', 'المجموع المخصص ناقص الهدية والمقدم لا يمكن أن يكون أقل من صفر', 'warning');
        this.saving = false;
        return;
      }
    }

    let advance = 0;
    let remaining = 0;
    let gift = 0;

    if (this.newUser.share_type === 'full') {
      const fullTotal = this.settings.full_share_total;
      const fullAdvance = this.settings.full_share_advance;
      const fullGift = this.settings.full_share_gift || 0;
      advance = fullAdvance + fullGift;
      remaining = fullTotal - fullGift - fullAdvance;
      gift = fullGift;
    } else if (this.newUser.share_type === 'half') {
      const fullTotal = this.settings.full_share_total;
      const halfAdvance = this.settings.half_share_advance;
      const halfTotal = fullTotal / 2.0;
      const halfGift = this.settings.half_share_gift || 0;
      advance = halfAdvance + halfGift;
      remaining = halfTotal - halfGift - halfAdvance;
      gift = halfGift;
    } else if (this.newUser.share_type === 'custom') {
      const total = Number(this.customTotal || 0);
      const adv = Number(this.customAdvance || 0);
      const giftVal = Number(this.customGift || 0);
      advance = adv + giftVal;
      remaining = (total - giftVal) - adv;
      gift = giftVal;
    }

    const userToSave = {
      username: this.newUser.username,
      email: this.newUser.email,
      password: this.newUser.password,
      share_type: this.newUser.share_type,
      advance: advance,
      remaining: remaining,
      paid: 0,
      totalAmount: 0,
      isReceived: false,
      role: this.newUser.role || 'user',
      gift: gift,
      member_code: cleanCode,
      expected_delivery_date: this.newUser.expected_delivery_date || null
    };

    const { error } = await this.dataService.addUser(userToSave);
    if (error) {
      Swal.fire('خطأ', error.message, 'error');
    } else {
      Swal.fire({ title: 'تمت الإضافة', text: 'تم إضافة العضو بنجاح وتعيين رتبته', icon: 'success', timer: 1500, showConfirmButton: false });
      this.showModal = false;
      this.newUser = { username: '', email: '', password: '', share_type: 'full', role: 'user', member_code: '', expected_delivery_date: '' };
      this.customTotal = null;
      this.customAdvance = null;
      this.customGift = null;
      this.loadUsers();
    }
    this.saving = false;
  }

  async toggleRole(user: any) {
    const newRole = user.role === 'supervisor' ? 'user' : 'supervisor';
    const actionText = newRole === 'supervisor' 
      ? `هل تريد ترقية "${user.username}" إلى رتبة مشرف مراقب؟ سيتم منحه صلاحية الإدخال والمتابعة ولكنه لن يتمكن من تصفح الأرشيف الكامل أو ملفات الأعضاء.`
      : `هل تريد إلغاء صلاحية المشرف وتنزيل "${user.username}" إلى رتبة عضو مساهم عادي؟`;
    
    const res = await Swal.fire({
      title: 'تعديل رتبة الحساب',
      text: actionText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، تأكيد التغيير',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: 'var(--primary)'
    });

    if (res.isConfirmed) {
      this.saving = true;
      const { error } = await this.dataService.updateUser(user.id, { role: newRole });
      if (error) {
        Swal.fire('خطأ', error.message, 'error');
      } else {
        Swal.fire({
          title: 'تم تعديل الرتبة',
          text: `تم تغيير صلاحية العضو إلى ${newRole === 'supervisor' ? 'مشرف مراقب' : 'عضو مساهم'} بنجاح`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        await this.loadUsers();
      }
      this.saving = false;
    }
  }

  async deleteUser(user: any) {
    const res = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `سيتم حذف "${user.username}" وجميع معاملاته ومستنداته بالكامل!`,
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
      this.showEditModal = false;
    }
  }

  openEditModal(user: any) {
    this.editingUser = { ...user, password: '' };
    if (this.editingUser.share_type === 'custom') {
      this.customTotal = Number(this.editingUser.remaining || 0) + Number(this.editingUser.advance || 0);
      this.customAdvance = Number(this.editingUser.advance || 0) - Number(this.editingUser.gift || 0);
      this.customGift = Number(this.editingUser.gift || 0);
    } else {
      this.customTotal = null;
      this.customAdvance = null;
      this.customGift = null;
    }
    this.showEditModal = true;
  }

  async saveEditUser() {
    if (!this.editingUser.username || !this.editingUser.email || !this.editingUser.member_code) {
      Swal.fire('تنبيه', 'يرجى ملء جميع الحقول المطلوبة بما فيها كود العضو', 'warning');
      return;
    }
    this.saving = true;

    const cleanCode = this.editingUser.member_code.trim();
    if (this.users.some(u => u.id !== this.editingUser.id && u.member_code && u.member_code.trim().toLowerCase() === cleanCode.toLowerCase())) {
      Swal.fire('تنبيه', 'رقم/كود العضو مستخدم بالفعل لمشترك آخر. يرجى إدخال كود فريد.', 'warning');
      this.saving = false;
      return;
    }

    let advance = Number(this.editingUser.advance || 0);
    let remaining = Number(this.editingUser.remaining || 0);
    let gift = Number(this.editingUser.gift || 0);

    if (this.editingUser.share_type === 'full') {
      const fullTotal = this.settings.full_share_total;
      const fullAdvance = this.settings.full_share_advance;
      const fullGift = this.settings.full_share_gift || 0;
      advance = fullAdvance + fullGift;
      remaining = fullTotal - fullGift - fullAdvance;
      gift = fullGift;
    } else if (this.editingUser.share_type === 'half') {
      const fullTotal = this.settings.full_share_total;
      const halfAdvance = this.settings.half_share_advance;
      const halfTotal = fullTotal / 2.0;
      const halfGift = this.settings.half_share_gift || 0;
      advance = halfAdvance + halfGift;
      remaining = halfTotal - halfGift - halfAdvance;
      gift = halfGift;
    } else if (this.editingUser.share_type === 'custom') {
      if (!this.customTotal || this.customTotal <= 0) {
        Swal.fire('تنبيه', 'يرجى إدخال إجمالي الجرامات المخصصة بشكل صحيح', 'warning');
        this.saving = false;
        return;
      }
      if (this.customAdvance === null || this.customAdvance < 0) {
        Swal.fire('تنبيه', 'يرجى إدخال قيمة المقدم المخصص بشكل صحيح', 'warning');
        this.saving = false;
        return;
      }
      const total = Number(this.customTotal || 0);
      const adv = Number(this.customAdvance || 0);
      const giftVal = Number(this.customGift || 0);
      
      advance = adv + giftVal;
      remaining = (total - giftVal) - adv;
      gift = giftVal;
    }

    const updates: any = {
      username: this.editingUser.username,
      email: this.editingUser.email,
      share_type: this.editingUser.share_type,
      advance: advance,
      remaining: remaining,
      gift: gift,
      member_code: cleanCode,
      expected_delivery_date: this.editingUser.expected_delivery_date || null
    };

    if (this.editingUser.password && this.editingUser.password.trim()) {
      updates.password = this.editingUser.password;
    }

    const { error } = await this.dataService.updateUser(this.editingUser.id, updates);
    if (error) {
      Swal.fire('خطأ', error.message, 'error');
    } else {
      Swal.fire({ title: 'تم التحديث', text: 'تم تحديث بيانات العضو بنجاح', icon: 'success', timer: 1500, showConfirmButton: false });
      this.showEditModal = false;
      this.editingUser = null;
      this.customTotal = null;
      this.customAdvance = null;
      this.customGift = null;
      this.loadUsers();
    }
    this.saving = false;
  }
}
