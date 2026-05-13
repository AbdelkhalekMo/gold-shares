import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-page animate-spring">
      <div class="page-header">
        <h1 class="islamic-header text-gradient">بيانات العضوية</h1>
        <p class="subtitle">يرجى تسجيل بياناتك بدقة لضمان حقوقك وتسهيل التواصل</p>
      </div>

      <div *ngIf="loading()" class="modern-loading">
        <div class="loader-orb"></div>
        <p>جاري مزامنة بياناتك...</p>
      </div>

      <div *ngIf="!loading()" class="profile-content">
        <!-- Modern Status Alert -->
        <div *ngIf="isLocked" class="status-banner animate-spring">
          <div class="icon-wrap">🛡️</div>
          <div class="info">
            <h3>البيانات محفوظة ومؤمنة</h3>
            <p>لقد تم توثيق بياناتك مسبقاً. للتعديل، يرجى تقديم طلب رسمي للإدارة.</p>
          </div>
        </div>

        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="modern-profile-form">
          
          <!-- Bento-style Form Sections -->
          <div class="form-sections-grid">
            
            <!-- Section: Personal -->
            <div class="card form-card glass-glow">
              <div class="card-header">
                <span class="icon">👤</span>
                <h3>البيانات الشخصية</h3>
              </div>
              <div class="grid-form">
                <div class="form-group">
                  <label>الاسم بالكامل</label>
                  <input type="text" formControlName="full_name" placeholder="الاسم الرباعي">
                </div>
                <div class="form-group">
                  <label>تاريخ الميلاد</label>
                  <input type="date" formControlName="birth_date">
                </div>
                <div class="form-group">
                  <label>السن</label>
                  <input type="number" formControlName="age" placeholder="25">
                </div>
                <div class="form-group full">
                  <label>مقر السكن الدائم</label>
                  <input type="text" formControlName="address" placeholder="العنوان بالتفصيل">
                </div>
              </div>
            </div>

            <!-- Section: Education & Work -->
            <div class="card form-card glass-glow">
              <div class="card-header">
                <span class="icon">💼</span>
                <h3>المسار المهني والدراسي</h3>
              </div>
              <div class="grid-form">
                <div class="form-group">
                  <label>المؤهل العلمي</label>
                  <input type="text" formControlName="educational_level" placeholder="التخصص الدراسي">
                </div>
                <div class="form-group">
                  <label>الوظيفة الحالية</label>
                  <input type="text" formControlName="job" placeholder="المسمى الوظيفي">
                </div>
                <div class="form-group">
                  <label>نوع التعاقد</label>
                  <select formControlName="is_permanent">
                    <option value="">اختر النوع...</option>
                    <option value="ثابت">توظيف ثابت</option>
                    <option value="عقد سنوي">عقد سنوي</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>بداية العمل</label>
                  <input type="date" formControlName="job_start_date">
                </div>
              </div>
            </div>

            <!-- Section: Financial -->
            <div class="card form-card highlight gold-glow">
              <div class="card-header">
                <span class="icon">💰</span>
                <h3>الحالة والالتزام المالي</h3>
              </div>
              <div class="grid-form">
                <div class="form-group">
                  <label>متوسط الدخل الشهري</label>
                  <input type="number" formControlName="avg_net_income" placeholder="ج.م">
                </div>
                <div class="form-group">
                  <label>القدرة على الالتزام</label>
                  <select formControlName="can_commit_monthly">
                    <option value="">هل أنت قادر؟</option>
                    <option value="نعم">نعم، أستطيع</option>
                    <option value="لا">لا أستطيع حالياً</option>
                  </select>
                </div>
                <div class="form-group full">
                  <label>المسؤول عن السداد</label>
                  <input type="text" formControlName="responsible_for_payment" placeholder="من سيقوم بدفع الأقساط؟">
                </div>
              </div>
            </div>

            <!-- Section: Marriage -->
            <div class="card form-card glass-glow">
              <div class="card-header">
                <span class="icon">💍</span>
                <h3>بيانات الارتباط والزواج</h3>
              </div>
              <div class="grid-form">
                <div class="form-group">
                  <label>الوضع الحالي</label>
                  <input type="text" formControlName="marriage_current_step" placeholder="خطوبة / زفاف ..">
                </div>
                <div class="form-group">
                  <label>الخطوة المقبلة</label>
                  <input type="text" formControlName="marriage_next_step" placeholder="موعد الخطوة التالية">
                </div>
                <div class="form-group">
                  <label>تاريخ الزفاف المتوقع</label>
                  <input type="date" formControlName="expected_wedding_date">
                </div>
                <div class="form-group">
                  <label>وزن الذهب المطلوب</label>
                  <input type="number" formControlName="shabka_gold_needed" placeholder="جم">
                </div>
              </div>
            </div>
          </div>

          <!-- Section: Notes -->
          <div class="card form-card full-card glass-glow">
            <div class="card-header">
              <span class="icon">📝</span>
              <h3>ملاحظات إضافية</h3>
            </div>
            <div class="form-group">
              <textarea formControlName="notes" rows="4" placeholder="أي تفاصيل أخرى تود إحاطتنا بها..."></textarea>
            </div>
          </div>

          <div class="form-footer" *ngIf="!isLocked">
            <button type="submit" class="btn btn-primary submit-profile-btn" [disabled]="profileForm.invalid || saving()">
              <span *ngIf="!saving()">✨ حفظ واعتماد البيانات نهائياً</span>
              <span *ngIf="saving()">جاري المعالجة...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .profile-page { padding: 1rem 0; }
    .page-header { margin-bottom: 3.5rem; text-align: center; }
    .subtitle { color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem; }

    .status-banner {
      background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 25px; padding: 2rem; display: flex; align-items: center; gap: 1.5rem; margin-bottom: 3rem;
      .icon-wrap { font-size: 2.5rem; }
      h3 { font-size: 1.25rem; font-weight: 800; color: var(--accent); margin-bottom: 0.25rem; }
      p { color: #d1fae5; font-size: 0.95rem; }
    }

    .form-sections-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
    .form-card { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem;
      &.full-card { margin-bottom: 2.5rem; }
      .card-header { display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem;
        .icon { font-size: 1.5rem; }
        h3 { font-size: 1.1rem; font-weight: 900; }
      }
    }

    .grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;
      .full { grid-column: span 2; }
    }

    .form-group {
      label { display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 800; color: var(--text-muted); }
      input, select, textarea { &:disabled { opacity: 0.6; cursor: not-allowed; } }
    }

    .form-footer { display: flex; justify-content: center; margin-top: 3rem; }
    .submit-profile-btn { padding: 1.25rem 4rem; font-size: 1.1rem; border-radius: 20px; }

    .modern-loading { text-align: center; padding: 5rem; .loader-orb { width: 40px; height: 40px; border: 3px solid transparent; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; } }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) { .form-sections-grid { grid-template-columns: 1fr; } }
    @media (max-width: 640px) { .grid-form { grid-template-columns: 1fr; .full { grid-column: span 1; } } }
  `]
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private authService = inject(AuthService);

  profileForm: FormGroup;
  loading = signal(true);
  saving = signal(false);
  isLocked = false;

  constructor() {
    this.profileForm = this.fb.group({
      full_name: ['', Validators.required],
      birth_date: [''],
      age: [null],
      address: ['', Validators.required],
      educational_level: [''],
      graduation_date: [''],
      job: [''],
      job_location: [''],
      is_permanent: [''],
      works_in_field: [''],
      job_start_date: [''],
      avg_net_income: [null],
      can_commit_monthly: [''],
      knows_gold_price_changes: [''],
      planned_for_gold_increase: [''],
      responsible_for_payment: [''],
      marriage_current_step: [''],
      marriage_next_step: [''],
      marriage_next_step_date: [''],
      will_provide_shabka: [''],
      shabka_gold_needed: [null],
      delayed_gold_until_wedding: [null],
      expected_wedding_date: [''],
      advance_payment_day: [''],
      monthly_payment_day: [''],
      expected_shabka_delivery_date: [''],
      notes: ['']
    });
  }

  async ngOnInit() {
    await this.loadProfile();
  }

  async loadProfile() {
    this.loading.set(true);
    const userId = this.authService.currentUser()?.id;
    if (userId) {
      const { data, error } = await this.dataService.getUserProfile(userId);
      if (data) {
        this.profileForm.patchValue(data);
        this.isLocked = true;
        this.profileForm.disable();
      }
    }
    this.loading.set(false);
  }

  async onSubmit() {
    if (this.profileForm.invalid) {
      Swal.fire('خطأ', 'يرجى ملء الحقول المطلوبة (الاسم والعنوان)', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لا يمكن تعديل هذه البيانات بعد الحفظ إلا من خلال الإدارة.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، حفظ',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#eab308'
    });

    if (result.isConfirmed) {
      this.saving.set(true);
      const userId = this.authService.currentUser()?.id;
      
      // Clean data: Convert empty strings to null for better DB compatibility
      const rawValues = this.profileForm.value;
      const cleanedData: any = {};
      
      Object.keys(rawValues).forEach(key => {
        const val = rawValues[key];
        cleanedData[key] = (val === '' || val === undefined) ? null : val;
      });

      const profileData = {
        ...cleanedData,
        id: userId,
        is_locked: true
      };

      const { error } = await this.dataService.saveUserProfile(profileData);
      
      if (error) {
        console.error('Save error:', error);
        Swal.fire({
          icon: 'error',
          title: 'فشل الحفظ',
          text: `حدث خطأ: ${error.message}. تأكد من إعدادات قاعدة البيانات.`,
          confirmButtonText: 'حسناً'
        });
      } else {
        Swal.fire('تم بنجاح', 'تم حفظ بياناتك بنجاح.', 'success');
        this.isLocked = true;
        this.profileForm.disable();
      }
      this.saving.set(false);
    }
  }
}
