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
    <div class="new-tx-page animate-fade-in">
      <div class="page-header">
        <h1>إضافة معاملة جديدة</h1>
        <p>أدخل تفاصيل شراء الذهب وانتظر موافقة الأدمن</p>
      </div>

      <div class="card form-card">
        <form (ngSubmit)="onSubmit()" #txForm="ngForm">

          <div class="form-group">
            <label for="gram_price">سعر الجرام (ج.م)</label>
            <input
              id="gram_price"
              type="number"
              [(ngModel)]="tx.gram_price"
              name="gram_price"
              required
              min="1"
              placeholder="مثال: 3500"
            >
          </div>

          <div class="form-group">
            <label for="grams">عدد الجرامات</label>
            <input
              id="grams"
              type="number"
              step="0.001"
              [(ngModel)]="tx.grams"
              name="grams"
              required
              min="0.001"
              placeholder="مثال: 0.500"
            >
          </div>

          <div class="form-group">
            <label for="amount">المبلغ المدفوع (ج.م)</label>
            <input
              id="amount"
              type="number"
              [(ngModel)]="tx.amount"
              name="amount"
              required
              min="1"
              placeholder="أدخل المبلغ يدوياً"
            >
          </div>

          <button
            type="submit"
            class="btn btn-primary w-full"
            [disabled]="loading || !txForm.valid"
          >
            {{ loading ? 'جاري الإرسال...' : 'تأكيد المعاملة وإرسالها' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 2rem; h1 { font-size: 1.75rem; font-weight: 800; } p { color: var(--text-muted); } }
    .form-card { max-width: 520px; margin: 0 auto; padding: 2rem; }
    .w-full { width: 100%; margin-top: 1rem; }
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
