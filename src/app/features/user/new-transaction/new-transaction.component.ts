import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="new-tx-page animate-spring">
      <div class="page-header">
        <h1 class="islamic-header text-gradient">طلب إضافة وزن</h1>
        <p class="subtitle">أدخل بيانات شراء الذهب الجديدة لتوثيقها في محفظتك</p>
      </div>

      <div class="form-container">
        <div class="card glass-card form-glass animate-spring">
          <div class="card-glow"></div>
          <form (ngSubmit)="onSubmit()" #txForm="ngForm" class="modern-form">
            
            <div class="form-group">
              <label>سعر الجرام اليومي</label>
              <div class="input-wrapper">
                <span class="prefix">ج.م</span>
                <input
                  type="number"
                  [(ngModel)]="tx.gram_price"
                  name="gram_price"
                  required
                  min="1"
                  placeholder="3500"
                >
              </div>
            </div>

            <div class="form-group">
              <label>الوزن المشترى</label>
              <div class="input-wrapper">
                <span class="prefix">جم</span>
                <input
                  type="number"
                  step="0.001"
                  [(ngModel)]="tx.grams"
                  name="grams"
                  required
                  min="0.001"
                  placeholder="0.500"
                >
              </div>
            </div>

            <div class="form-group">
              <label>القيمة الإجمالية</label>
              <div class="input-wrapper">
                <span class="prefix">ج.م</span>
                <input
                  type="number"
                  [(ngModel)]="tx.amount"
                  name="amount"
                  required
                  min="1"
                  placeholder="أدخل المبلغ المدفوع"
                >
              </div>
            </div>

            <div class="form-hint card">
              <span class="icon">💡</span>
              <p>تأكد من دقة البيانات المدخلة؛ سيقوم النظام بمراجعتها فوراً بعد الإرسال.</p>
            </div>

            <button
              type="submit"
              class="btn btn-primary submit-btn"
              [disabled]="loading || !txForm.valid"
            >
              <span *ngIf="!loading">🚀 إرسال الطلب للتدقيق</span>
              <span *ngIf="loading">جاري المزامنة...</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .new-tx-page { padding: 1rem 0; }
    .page-header { margin-bottom: 3.5rem; text-align: center; }
    .subtitle { color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem; }

    .form-container { display: flex; justify-content: center; }
    .form-glass {
      width: 100%; max-width: 550px; padding: 3rem;
      background: rgba(255, 255, 255, 0.03); border-radius: 40px; position: relative;
    }
    .card-glow { position: absolute; inset: 0; background: radial-gradient(circle at top right, rgba(212, 175, 55, 0.1), transparent); pointer-events: none; }

    .modern-form { display: flex; flex-direction: column; gap: 1.75rem; }
    .form-group {
      label { display: block; margin-bottom: 0.75rem; font-weight: 800; color: var(--primary); font-size: 0.95rem; }
    }

    .input-wrapper {
      position: relative;
      display: flex; align-items: center;
      .prefix { position: absolute; left: 1.25rem; color: var(--text-muted); font-weight: 800; font-size: 0.85rem; }
      input {
        width: 100%; padding: 1.25rem 3.5rem 1.25rem 1.25rem;
        background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); border-radius: 20px;
        color: #fff; font-size: 1.1rem; font-weight: 700; transition: all 0.3s ease;
        &:focus { outline: none; border-color: var(--primary); background: rgba(255, 255, 255, 0.08); box-shadow: 0 0 20px rgba(212, 175, 55, 0.1); }
        &::placeholder { color: rgba(255,255,255,0.2); }
      }
    }

    .form-hint {
      display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: rgba(255, 255, 255, 0.02); border-radius: 18px; border: 1px solid rgba(255, 255, 255, 0.05);
      .icon { font-size: 1.5rem; }
      p { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }
    }

    .submit-btn { width: 100%; padding: 1.25rem; font-size: 1.1rem; border-radius: 20px; }
  `]
})
export class NewTransactionComponent {
  dataService = inject(DataService);
  authService = inject(AuthService);
  router = inject(Router);

  loading = false;
  tx = {
    gram_price: null as number | null,
    grams: null as number | null,
    amount: null as number | null
  };

  async onSubmit() {
    if (!this.tx.grams || !this.tx.gram_price || !this.tx.amount) return;

    this.loading = true;
    const user = this.authService.currentUser();
    if (!user) return;

    const { error } = await this.dataService.addPendingTransaction({
      user_id: user.id,
      gram_price: this.tx.gram_price,
      grams: this.tx.grams,
      amount: this.tx.amount
    });

    if (error) {
      Swal.fire('خطأ', error.message, 'error');
    } else {
      await Swal.fire({
        title: 'تم الإرسال بنجاح',
        text: 'بانتظار مراجعة الأدمن لتحديث رصيدك.',
        icon: 'success',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#d4ff00'
      });
      // Reset form
      this.tx = { gram_price: null, grams: null, amount: null };
      this.router.navigate(['/user']);
    }
    this.loading = false;
  }
}
