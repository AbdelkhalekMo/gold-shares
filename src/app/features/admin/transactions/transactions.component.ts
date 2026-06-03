import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="tx-page animate-fade-in">
      <!-- Printable Header (Only visible on paper printout) -->
      <div class="print-header">
        <div class="print-brand">
          <span class="logo-icon">✨</span>
          <h2>جمعية أولاد زينب الخيرية</h2>
        </div>
        <h3>كشف معاملات الذهب التفصيلي</h3>
        <div class="print-meta">
          <p><strong>العضو المشترك:</strong> {{ user?.username || '---' }}</p>
          <p><strong>البريد الإلكتروني:</strong> {{ user?.email || '---' }}</p>
          <p><strong>المقدم والهدية:</strong> مقدم: {{ user?.advance || 0 }} جم | هدية: {{ user?.gift || 0 }} جم</p>
          <p><strong>تاريخ إصدار الكشف:</strong> {{ currentDate | date:'yyyy-MM-dd HH:mm':'Africa/Cairo' }} (بتوقيت القاهرة)</p>
        </div>
        <div class="print-divider"></div>
      </div>

      <!-- Regular Interactive Header -->
      <div class="page-header print-hide">
        <div class="header-left">
          <a routerLink="/admin/users" class="back-link">← العودة للمشتركين</a>
          <h1>معاملات العضو: <span class="text-gradient">{{ user?.username || 'جاري التحميل...' }}</span>
            <span *ngIf="user" style="font-size: 1rem; margin-right: 1rem; color: var(--primary);">
              (المقدم: {{ user.advance }} جم | الهدية: {{ user.gift || 0 }} جم)
            </span>
          </h1>
          <p class="subtitle">المراجعة التفصيلية، التعديل الفوري، الإدخال اليدوي وطباعة الكشوفات</p>
        </div>
        <div class="actions-header">
          <button class="btn btn-glass" (click)="printStatement()">🖨️ طباعة كشف الحساب</button>
          <button class="btn btn-primary" (click)="showAddModal = true">+ إضافة معاملة يدوية</button>
        </div>
      </div>

      <div *ngIf="loading" class="loading-state print-hide">
        <div class="loader-orb"></div>
        <p>جاري استرجاع تفاصيل العمليات الحسابية...</p>
      </div>

      <ng-container *ngIf="!loading">
        <div *ngIf="transactions.length > 0; else empty">
          <!-- Desktop Table (Hidden in mobile, formatted in print) -->
          <div class="table-container animate-spring">
            <table>
              <thead>
                <tr>
                  <th>رقم العملية</th>
                  <th>نوع الدفع</th>
                  <th>سعر الجرام</th>
                  <th>الوزن المطلوب</th>
                  <th>إجمالي المبلغ</th>
                  <th>تاريخ المعاملة</th>
                  <th class="print-hide">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tx of transactions">
                  <td class="tx-number-cell">#{{ tx.transaction_number }}</td>
                  <td>
                    <span class="badge-type" [class.advance]="tx.payment_type === 'advance'" [class.normal]="tx.payment_type !== 'advance'">
                      {{ tx.payment_type === 'advance' ? '💎 مقدم' : (tx.payment_period === '3_months' ? '📈 3 شهور' : '📈 دفع شهر') }}
                    </span>
                  </td>
                  <td>{{ tx.gram_price | number }} ج.م</td>
                  <td class="font-bold text-success">{{ tx.grams | number:'1.0-3' }} جم</td>
                  <td class="font-bold text-accent">{{ tx.amount | number }} ج.م</td>
                  <td class="date-cell">{{ tx.created_at | date:'yyyy-MM-dd HH:mm':'Africa/Cairo' }} (بتوقيت القاهرة)</td>
                  <td class="print-hide">
                    <div class="table-actions">
                      <button (click)="openEditModal(tx)" class="btn-edit" title="تعديل تفاصيل المعاملة">✏️ تعديل</button>
                      <button (click)="deleteTx(tx)" class="btn-delete" title="حذف وتصحيح الرصيد">🗑️ حذف</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Card List (Hidden in print) -->
          <div class="mobile-tx-list animate-spring print-hide">
            <div class="tx-card card glass-glow" *ngFor="let tx of transactions">
              <div class="card-header-tx">
                <span class="tx-number">رقم العملية: #{{ tx.transaction_number }}</span>
                <span class="tx-date">{{ tx.created_at | date:'yyyy-MM-dd HH:mm':'Africa/Cairo' }} (بتوقيت القاهرة)</span>
              </div>
              
              <div class="card-body-tx">
                <div class="stat-item full-width" style="border-bottom: 1px solid rgba(255, 255, 255, 0.03); padding-bottom: 0.5rem; margin-bottom: 0.25rem; border-top: none; padding-top: 0; margin-top: 0; display: flex; justify-content: space-between; align-items: center; flex-direction: row;">
                  <span class="label">نوع الطلب:</span>
                  <span class="value">
                    <span class="badge-type" [class.advance]="tx.payment_type === 'advance'" [class.normal]="tx.payment_type !== 'advance'">
                      {{ tx.payment_type === 'advance' ? '💎 مقدم' : (tx.payment_period === '3_months' ? '📈 3 شهور' : '📈 دفع شهر') }}
                    </span>
                  </span>
                </div>
                <div class="stat-item">
                  <span class="label">سعر الجرام:</span>
                  <span class="value">{{ tx.gram_price | number }} ج.م</span>
                </div>
                <div class="stat-item">
                  <span class="label">الوزن:</span>
                  <span class="value font-bold text-success">{{ tx.grams | number:'1.0-3' }} جم</span>
                </div>
                <div class="stat-item full-width">
                  <span class="label">إجمالي المبلغ:</span>
                  <span class="value text-accent font-bold">{{ tx.amount | number }} ج.م</span>
                </div>
              </div>

              <div class="card-actions-tx">
                <button (click)="openEditModal(tx)" class="btn-edit-mobile">✏️ تعديل المعاملة</button>
                <button (click)="deleteTx(tx)" class="btn-delete-mobile">🗑️ حذف واسترجاع</button>
              </div>
            </div>
          </div>
        </div>

        <ng-template #empty>
          <div class="empty-state card glass-glow print-hide">
            <div class="icon">🕊️</div>
            <h3>لا توجد معاملات مؤكدة للعضو بعد</h3>
            <p>يمكنك تسجيل معاملة جديدة له مباشرة باستخدام زر "إضافة معاملة يدوية" بالأعلى.</p>
            <button class="btn btn-primary btn-sm" (click)="showAddModal = true">+ تسجيل أول معاملة</button>
          </div>
        </ng-template>
      </ng-container>
    </div>

    <!-- Modal 1: Add Manual Transaction -->
    <div class="modal-wrapper print-hide" *ngIf="showAddModal" (click)="onOverlayClick($event, 'add')">
      <div class="modal-glass animate-spring">
        <div class="modal-header">
          <h2 class="text-gradient">✍️ إضافة معاملة يدوية</h2>
          <button class="close-btn" (click)="showAddModal = false">×</button>
        </div>
        
        <form (ngSubmit)="addManualTx()" class="modal-body">
          <p class="modal-intro">سيتم تسجيل هذه المعاملة مباشرة في حساب العضو **({{ user?.username }})** وتحديث أرصدته فوراً دون الحاجة لموافقة إضافية.</p>
          
          <div class="form-grid">
            <div class="form-group">
              <label>سعر الجرام اليوم (ج.م)</label>
              <div class="input-modern">
                <input type="number" [(ngModel)]="newTx.gram_price" name="gram_price" required (input)="calculateNewAmount()" placeholder="مثال: 3500">
              </div>
            </div>
            
            <div class="form-group">
              <label>الوزن المدخل (جم)</label>
              <div class="input-modern">
                <input type="number" step="0.001" [(ngModel)]="newTx.grams" name="grams" required (input)="calculateNewAmount()" placeholder="مثال: 5.25">
              </div>
            </div>

            <div class="form-group">
              <label>نوع الطلب</label>
              <div class="select-modern-wrapper" style="position: relative; width: 100%;">
                <select [(ngModel)]="newTx.payment_type" name="payment_type" required style="width: 100%; background: rgba(4, 47, 36, 0.25); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 16px; padding: 0.95rem 1.25rem; color: #fff; font-weight: 700; cursor: pointer; appearance: none; -webkit-appearance: none;">
                  <option value="advance">💎 مقدم</option>
                  <option value="normal">📈 دفع عادي سهم</option>
                </select>
                <span style="font-size: 0.6rem; color: var(--primary); position: absolute; left: 1.2rem; top: 50%; transform: translateY(-50%); pointer-events: none;">▼</span>
              </div>
            </div>

            <div class="form-group" *ngIf="newTx.payment_type === 'normal'">
              <label>مدة الدفع</label>
              <div class="select-modern-wrapper" style="position: relative; width: 100%;">
                <select [(ngModel)]="newTx.payment_period" name="payment_period" required style="width: 100%; background: rgba(4, 47, 36, 0.25); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 16px; padding: 0.95rem 1.25rem; color: #fff; font-weight: 700; cursor: pointer; appearance: none; -webkit-appearance: none;">
                  <option value="1_month">دفع شهر واحد</option>
                  <option value="3_months">ثلاثة شهور</option>
                </select>
                <span style="font-size: 0.6rem; color: var(--primary); position: absolute; left: 1.2rem; top: 50%; transform: translateY(-50%); pointer-events: none;">▼</span>
              </div>
            </div>
            
            <div class="form-group full-width">
              <label>إجمالي القيمة التقديرية (محسوبة تلقائياً)</label>
              <div class="input-modern locked">
                <input type="number" [value]="newTx.amount" name="amount" readonly dir="rtl">
                <span class="badge-inside">جنيه مصري</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-glass" (click)="showAddModal = false">إلغاء</button>
            <button type="submit" class="btn btn-primary" [disabled]="saving">
              {{ saving ? 'جاري التقييد...' : 'تأكيد وحفظ المعاملة' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal 2: Edit Existing Transaction -->
    <div class="modal-wrapper print-hide" *ngIf="showEditModal" (click)="onOverlayClick($event, 'edit')">
      <div class="modal-glass animate-spring">
        <div class="modal-header">
          <h2 class="text-gradient">✏️ تعديل المعاملة #{{ editingTx?.transaction_number }}</h2>
          <button class="close-btn" (click)="showEditModal = false">×</button>
        </div>
        
        <form (ngSubmit)="updateTx()" class="modal-body">
          <p class="modal-intro">تقوم الآن بتعديل المعاملة الحسابية. سيقوم النظام تلقائياً بإعادة احتساب المسدد والمتبقي من الذهب للعضو بالكامل.</p>
          
          <div class="form-grid">
            <div class="form-group">
              <label>سعر الجرام (ج.م)</label>
              <div class="input-modern">
                <input type="number" [(ngModel)]="editTxForm.gram_price" name="edit_gram_price" required (input)="calculateEditAmount()">
              </div>
            </div>
            
            <div class="form-group">
              <label>الوزن المدخل (جم)</label>
              <div class="input-modern">
                <input type="number" step="0.001" [(ngModel)]="editTxForm.grams" name="edit_grams" required (input)="calculateEditAmount()">
              </div>
            </div>

            <div class="form-group">
              <label>نوع الطلب</label>
              <div class="select-modern-wrapper" style="position: relative; width: 100%;">
                <select [(ngModel)]="editTxForm.payment_type" name="edit_payment_type" required style="width: 100%; background: rgba(4, 47, 36, 0.25); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 16px; padding: 0.95rem 1.25rem; color: #fff; font-weight: 700; cursor: pointer; appearance: none; -webkit-appearance: none;">
                  <option value="advance">💎 مقدم</option>
                  <option value="normal">📈 دفع عادي سهم</option>
                </select>
                <span style="font-size: 0.6rem; color: var(--primary); position: absolute; left: 1.2rem; top: 50%; transform: translateY(-50%); pointer-events: none;">▼</span>
              </div>
            </div>

            <div class="form-group" *ngIf="editTxForm.payment_type === 'normal'">
              <label>مدة الدفع</label>
              <div class="select-modern-wrapper" style="position: relative; width: 100%;">
                <select [(ngModel)]="editTxForm.payment_period" name="edit_payment_period" required style="width: 100%; background: rgba(4, 47, 36, 0.25); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 16px; padding: 0.95rem 1.25rem; color: #fff; font-weight: 700; cursor: pointer; appearance: none; -webkit-appearance: none;">
                  <option value="1_month">دفع شهر واحد</option>
                  <option value="3_months">ثلاثة شهور</option>
                </select>
                <span style="font-size: 0.6rem; color: var(--primary); position: absolute; left: 1.2rem; top: 50%; transform: translateY(-50%); pointer-events: none;">▼</span>
              </div>
            </div>
            
            <div class="form-group full-width">
              <label>إجمالي القيمة الجديدة</label>
              <div class="input-modern locked">
                <input type="number" [value]="editTxForm.amount" name="edit_amount" readonly dir="rtl">
                <span class="badge-inside">جنيه مصري</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-glass" (click)="showEditModal = false">إلغاء</button>
            <button type="submit" class="btn btn-primary" [disabled]="saving">
              {{ saving ? 'جاري التحديث...' : 'حفظ التعديلات' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .tx-page { padding: 1rem 0; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3rem; }
    .back-link { display: inline-block; color: var(--text-muted); text-decoration: none; margin-bottom: 0.75rem; font-weight: 600; font-size: 0.9rem; }
    h1 { font-size: 2rem; font-weight: 800; font-family: 'Amiri', serif; }
    .subtitle { color: var(--text-muted); font-size: 1.05rem; margin-top: 0.25rem; }
    .actions-header { display: flex; gap: 1rem; align-self: center; }

    .table-container { margin-top: 1rem; }
    
    .badge-type {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 800;
      border: 1px solid rgba(255, 255, 255, 0.05);
      
      &.advance {
        background: rgba(212, 175, 55, 0.1);
        border-color: rgba(212, 175, 55, 0.2);
        color: var(--primary);
      }
      
      &.normal {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.2);
        color: var(--accent);
      }
      
      .period-text {
        font-size: 0.75rem;
        opacity: 0.8;
      }
    }

    .tx-number-cell { font-family: 'Plus Jakarta Sans', sans-serif; color: var(--primary); font-weight: 800; }
    .date-cell { color: var(--text-muted); font-size: 0.85rem; }
    .text-success { color: var(--success) !important; }
    .text-accent { color: var(--accent) !important; }

    .table-actions { display: flex; gap: 0.5rem; }
    .btn-edit { background: rgba(212, 175, 55, 0.1); color: var(--primary); border: 1px solid rgba(212, 175, 55, 0.2); padding: 0.4rem 0.8rem; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.85rem; transition: all 0.3s ease; }
    .btn-edit:hover { background: var(--primary); color: #000; }
    .btn-delete { background: rgba(239, 68, 68, 0.1); color: #ff4d4d; border: 1px solid rgba(239, 68, 68, 0.2); padding: 0.4rem 0.8rem; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.85rem; transition: all 0.3s ease; }
    .btn-delete:hover { background: #ef4444; color: #fff; }

    .empty-state { text-align: center; padding: 5rem 2rem; .icon { font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.4; } h3 { font-size: 1.5rem; margin-bottom: 0.5rem; } p { color: var(--text-muted); margin-bottom: 1.5rem; } }
    .loading-state { text-align: center; padding: 5rem 2rem; color: var(--text-muted); .loader-orb { width: 40px; height: 40px; border: 3px solid transparent; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem; } }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Modals Styling */
    .modal-wrapper { position: fixed; inset: 0; background: rgba(2, 6, 23, 0.9); backdrop-filter: blur(16px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 2rem 1.5rem; overflow-y: auto; }
    .modal-glass { margin: auto; background: linear-gradient(135deg, #021a14 0%, #042f24 100%); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 32px; width: 100%; max-width: 600px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 50px rgba(212, 175, 55, 0.2); position: relative;
      &::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(circle at 50% -20%, rgba(212, 175, 55, 0.15), transparent 70%); pointer-events: none; }
    }
    .modal-header { padding: 2rem 2.5rem; border-bottom: 1px solid rgba(212, 175, 55, 0.1); display: flex; justify-content: space-between; align-items: center;
      h2 { font-size: 1.7rem; font-weight: 900; font-family: 'Amiri', serif; color: var(--primary); }
      .close-btn { background: rgba(212, 175, 55, 0.05); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 12px; color: var(--primary); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; cursor: pointer; transition: all 0.3s ease;
        &:hover { background: var(--primary); color: #000; }
      }
    }
    .modal-body { padding: 2rem 2.5rem; }
    .modal-intro { color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem;
      label { font-size: 0.9rem; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 0.4rem;
        &::before { content: '✦'; font-size: 0.75rem; color: var(--primary); opacity: 0.8; }
      }
      &.full-width { grid-column: span 2; }
    }
    .input-modern { position: relative; width: 100%;
      input { width: 100%; background: rgba(4, 47, 36, 0.25); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 16px; padding: 0.95rem 1.25rem; color: #fff; font-size: 0.95rem; font-weight: 700; transition: all 0.3s ease; box-sizing: border-box;
        &:focus { border-color: var(--primary); background: rgba(4, 47, 36, 0.45); box-shadow: 0 0 15px rgba(212, 175, 55, 0.25); outline: none; }
      }
      &.locked { input { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.05); color: var(--accent); font-weight: 900; } }
      .badge-inside { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-size: 0.8rem; color: var(--text-muted); font-weight: 800; }
    }
    .modal-footer { margin-top: 2.5rem; display: flex; justify-content: flex-end; gap: 1.5rem; }

    /* Mobile Views */
    .mobile-tx-list { display: none; flex-direction: column; gap: 1.25rem; margin-bottom: 2.5rem; }
    .tx-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 24px;
      .card-header-tx { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 0.75rem;
        .tx-number { font-weight: 800; font-size: 0.95rem; color: var(--primary); }
        .tx-date { font-size: 0.8rem; color: var(--text-muted); font-family: 'Plus Jakarta Sans', sans-serif; }
      }
      .card-body-tx { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: rgba(255, 255, 255, 0.02); padding: 0.75rem 1rem; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.03);
        .stat-item { display: flex; flex-direction: column; gap: 0.25rem;
          .label { font-size: 0.75rem; color: var(--text-muted); font-weight: 800; }
          .value { font-size: 0.95rem; }
          &.full-width { grid-column: span 2; border-top: 1px solid rgba(255, 255, 255, 0.03); padding-top: 0.5rem; margin-top: 0.25rem; flex-direction: row; justify-content: space-between; align-items: center; }
        }
      }
      .card-actions-tx { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;
        .btn-edit-mobile { width: 100%; padding: 0.85rem; border-radius: 12px; font-size: 0.9rem; font-weight: 800; background: rgba(212, 175, 55, 0.05); border: 1px solid rgba(212, 175, 55, 0.15); color: var(--primary); cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          &:hover { background: var(--primary); color: #000; }
        }
        .btn-delete-mobile { width: 100%; padding: 0.85rem; border-radius: 12px; font-size: 0.9rem; font-weight: 800; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.1); color: #ff4d4d; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          &:hover { background: rgba(239, 68, 68, 0.15); border-color: #ef4444; color: #fff; }
        }
      }
    }

    /* Print Stylesheet (Tax, Audit and member Statement records) */
    .print-header { display: none; }
    
    @media print {
      body { background: #fff !important; color: #000 !important; direction: rtl !important; }
      .print-hide { display: none !important; }
      .print-header { display: block !important; margin-bottom: 2.5rem; border-bottom: 3px double #000; padding-bottom: 1.5rem; text-align: center; }
      .print-brand { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;
        .logo-icon { font-size: 2rem; }
        h2 { font-size: 1.8rem; font-weight: 900; margin: 0; color: #000; }
      }
      h3 { font-size: 1.4rem; font-weight: 800; margin: 0.5rem 0; color: #000; }
      .print-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; text-align: right; margin-top: 1rem; font-size: 0.95rem;
        p { margin: 0; }
      }
      .print-divider { margin-top: 1rem; border-bottom: 1px dashed #000; }
      
      .tx-page { padding: 0 !important; background: transparent !important; }
      .table-container { box-shadow: none !important; border: 1px solid #000 !important; border-radius: 0 !important; background: #fff !important; margin: 0 !important; width: 100% !important; overflow: visible !important; }
      table { width: 100% !important; border-collapse: collapse !important; }
      th, td { border: 1px solid #000 !important; padding: 10px 8px !important; color: #000 !important; text-align: center !important; font-size: 0.95rem !important; background: transparent !important; }
      th { font-weight: 900 !important; background: #f2f2f2 !important; }
      .font-bold { font-weight: bold !important; color: #000 !important; }
      .text-success, .text-accent { color: #000 !important; }
      .badge-type {
        border: none !important;
        background: transparent !important;
        color: #000 !important;
        padding: 0 !important;
        font-weight: normal !important;
      }
    }

    @media (max-width: 768px) {
      .table-container { display: none !important; }
      .mobile-tx-list { display: flex !important; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; margin-bottom: 2.25rem;
        .header-left { width: 100%; }
        h1 { font-size: 1.6rem; }
        .subtitle { font-size: 0.95rem; }
      }
      .actions-header { width: 100%; flex-direction: column; gap: 0.75rem;
        button { width: 100%; justify-content: center; }
      }
      .modal-glass { border-radius: 28px !important; max-width: 95vw !important; }
      .modal-header { padding: 1.5rem 1.75rem !important; h2 { font-size: 1.4rem !important; } }
      .modal-body { padding: 1.5rem 1.75rem !important; }
      .modal-footer { flex-direction: column-reverse !important; gap: 0.75rem !important; margin-top: 1.75rem !important;
        button { width: 100% !important; padding: 0.95rem !important; border-radius: 12px !important; justify-content: center !important; }
      }
      .form-grid { grid-template-columns: 1fr !important; gap: 1.25rem !important; }
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
  user: any = null;
  currentDate = new Date();

  // Modals state
  showAddModal = false;
  showEditModal = false;
  saving = false;

  // Manual transaction form models
  newTx = {
    gram_price: 3500,
    grams: '' as string | number,
    amount: 0,
    payment_type: 'normal' as 'advance' | 'normal',
    payment_period: '1_month' as '1_month' | '3_months' | null
  };

  // Edit transaction form models
  editingTx: any = null;
  editTxForm = {
    gram_price: 0,
    grams: '' as string | number,
    amount: 0,
    payment_type: 'normal' as 'advance' | 'normal',
    payment_period: '1_month' as '1_month' | '3_months' | null
  };

  ngOnInit() {
    this.userId = this.route.snapshot.params['userId'];
    this.loadTxs();
  }

  async loadTxs() {
    this.loading = true;
    this.cdr.detectChanges();

    // 1. Fetch user detail
    const userRes = await this.dataService.getUser(this.userId);
    if (userRes.data) {
      this.user = userRes.data;
    }

    // 2. Fetch approved transactions list
    const { data, error } = await this.dataService.getApprovedTransactions(this.userId);

    if (error) {
      console.error('Error loading transactions:', error);
      Swal.fire('خطأ في التحميل', error.message, 'error');
    }

    this.transactions = data || [];
    this.currentDate = new Date();
    this.loading = false;
    this.cdr.detectChanges();
  }

  calculateNewAmount() {
    const price = Number(this.newTx.gram_price) || 0;
    const grams = Number(this.newTx.grams) || 0;
    this.newTx.amount = Math.round(price * grams);
  }

  calculateEditAmount() {
    const price = Number(this.editTxForm.gram_price) || 0;
    const grams = Number(this.editTxForm.grams) || 0;
    this.editTxForm.amount = Math.round(price * grams);
  }

  async addManualTx() {
    if (!this.newTx.grams || !this.newTx.gram_price) {
      Swal.fire('تنبيه', 'برجاء إدخال الوزن وسعر الجرام', 'warning');
      return;
    }
    this.saving = true;

    const txData = {
      user_id: this.userId,
      gram_price: Number(this.newTx.gram_price),
      grams: Number(this.newTx.grams),
      amount: Number(this.newTx.amount),
      payment_type: this.newTx.payment_type,
      payment_period: this.newTx.payment_type === 'normal' ? this.newTx.payment_period : null
    };

    const { error } = await this.dataService.addApprovedTransaction(txData);
    if (error) {
      Swal.fire('خطأ في الحفظ', error.message, 'error');
    } else {
      Swal.fire({
        title: 'تمت الإضافة بنجاح',
        text: 'تم تقييد المعاملة الحسابية وتعديل أرصدة العضو فوراً',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      this.showAddModal = false;
      this.newTx = {
        gram_price: 3500,
        grams: '',
        amount: 0,
        payment_type: 'normal',
        payment_period: '1_month'
      };
      await this.loadTxs();
    }
    this.saving = false;
  }

  openEditModal(tx: any) {
    this.editingTx = tx;
    this.editTxForm = {
      gram_price: tx.gram_price,
      grams: tx.grams,
      amount: tx.amount,
      payment_type: tx.payment_type || 'normal',
      payment_period: tx.payment_period || null
    };
    this.showEditModal = true;
  }

  async updateTx() {
    if (!this.editTxForm.grams || !this.editTxForm.gram_price) {
      Swal.fire('تنبيه', 'برجاء إدخال الوزن وسعر الجرام', 'warning');
      return;
    }
    this.saving = true;

    const updates = {
      gram_price: Number(this.editTxForm.gram_price),
      grams: Number(this.editTxForm.grams),
      amount: Number(this.editTxForm.amount),
      payment_type: this.editTxForm.payment_type,
      payment_period: this.editTxForm.payment_type === 'normal' ? this.editTxForm.payment_period : null
    };

    const { error } = await this.dataService.updateApprovedTransaction(this.editingTx.id, updates);
    if (error) {
      Swal.fire('خطأ في التحديث', error.message, 'error');
    } else {
      Swal.fire({
        title: 'تم تعديل البيانات',
        text: 'تمت إعادة معالجة الأوزان والموازين المالية وحفظ التغييرات',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      this.showEditModal = false;
      this.editingTx = null;
      await this.loadTxs();
    }
    this.saving = false;
  }

  async deleteTx(tx: any) {
    const res = await Swal.fire({
      title: 'حذف المعاملة؟',
      text: 'تحذير: سيتم التراجع عن هذه الجرامات وخصمها بالكامل من مسددات العضو المالية!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، حذف واسترجاع الرصيد',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444'
    });

    if (res.isConfirmed) {
      const result = await this.dataService.deleteApprovedTransaction(tx);
      if (result.success) {
        Swal.fire({
          title: 'تم الحذف وتصحيح الرصيد',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        await this.loadTxs();
      } else {
        Swal.fire('خطأ في التراجع', result.error || 'حدث خطأ أثناء الحذف', 'error');
      }
    }
  }

  printStatement() {
    window.print();
  }

  onOverlayClick(event: MouseEvent, modalType: 'add' | 'edit') {
    if ((event.target as HTMLElement).classList.contains('modal-wrapper')) {
      if (modalType === 'add') this.showAddModal = false;
      if (modalType === 'edit') this.showEditModal = false;
    }
  }
}
