import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-profile-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-page animate-spring">
      <div class="page-header">
        <div class="header-top">
          <button class="btn btn-glass btn-sm" (click)="goBack()">← العودة للوحة التحكم</button>
          <div class="status-badge" [ngClass]="hasProfile ? 'verified' : 'missing'">
            {{ hasProfile ? 'ملف مكتمل' : 'بيانات ناقصة' }}
          </div>
        </div>
        <h1 class="islamic-header text-gradient">ملف العضو: {{ username }}</h1>
        <p class="subtitle">استعراض وتدقيق البيانات التعريفية والمالية المسجلة من قبل العضو</p>
      </div>

      <div *ngIf="loading()" class="modern-loading">
        <div class="loader-orb"></div>
        <p>جاري استحضار ملف العضو...</p>
      </div>

      <div *ngIf="!loading()" class="profile-content">
        <!-- Modern Warning for Missing Profile -->
        <div *ngIf="!hasProfile" class="modern-warning animate-spring">
          <div class="icon">⚠️</div>
          <div class="info">
            <h3>لم يتم استكمال البيانات</h3>
            <p>هذا العضو لم يقم بتعبئة بيانات البروفايل حتى هذه اللحظة.</p>
          </div>
        </div>

        <form [formGroup]="profileForm" (ngSubmit)="onUpdate()" class="modern-profile-form">
          
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
                  <input type="text" formControlName="full_name">
                </div>
                <div class="form-group">
                  <label>تاريخ الميلاد</label>
                  <input type="date" formControlName="birth_date">
                </div>
                <div class="form-group">
                  <label>السن</label>
                  <input type="number" formControlName="age">
                </div>
                <div class="form-group full">
                  <label>مقر السكن</label>
                  <input type="text" formControlName="address">
                </div>
                <div class="form-group">
                  <label>المؤهل الدراسي</label>
                  <input type="text" formControlName="educational_level">
                </div>
              </div>
            </div>

            <!-- Section: Education & Work -->
            <div class="card form-card glass-glow">
              <div class="card-header">
                <span class="icon">💼</span>
                <h3>المسار المهني</h3>
              </div>
              <div class="grid-form">
                <div class="form-group">
                  <label>الوظيفة</label>
                  <input type="text" formControlName="job">
                </div>
                <div class="form-group">
                  <label>مكان العمل</label>
                  <input type="text" formControlName="job_location">
                </div>
                <div class="form-group">
                  <label>نوع التوظيف</label>
                  <select formControlName="is_permanent">
                    <option value="ثابت">ثابت</option>
                    <option value="عقد سنوي">عقد سنوي</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>تاريخ التعيين</label>
                  <input type="date" formControlName="job_start_date">
                </div>
              </div>
            </div>

            <!-- Section: Financial -->
            <div class="card form-card gold-glow">
              <div class="card-header">
                <span class="icon">💰</span>
                <h3>القدرة المالية</h3>
              </div>
              <div class="grid-form">
                <div class="form-group">
                  <label>الدخل الصافي (شهرياً)</label>
                  <input type="number" formControlName="avg_net_income">
                </div>
                <div class="form-group">
                  <label>جاهزية الالتزام</label>
                  <select formControlName="can_commit_monthly">
                    <option value="نعم">نعم</option>
                    <option value="لا">لا</option>
                  </select>
                </div>
                <div class="form-group full">
                  <label>المسؤول المالي</label>
                  <input type="text" formControlName="responsible_for_payment">
                </div>
              </div>
            </div>

            <!-- Section: Marriage -->
            <div class="card form-card glass-glow">
              <div class="card-header">
                <span class="icon">💍</span>
                <h3>بيانات الارتباط</h3>
              </div>
              <div class="grid-form">
                <div class="form-group">
                  <label>المرحلة الحالية</label>
                  <input type="text" formControlName="marriage_current_step">
                </div>
                <div class="form-group">
                  <label>الخطوة القادمة</label>
                  <input type="text" formControlName="marriage_next_step">
                </div>
                <div class="form-group">
                  <label>تاريخ الزفاف</label>
                  <input type="date" formControlName="expected_wedding_date">
                </div>
                <div class="form-group">
                  <label>الذهب المستهدف</label>
                  <input type="number" formControlName="shabka_gold_needed">
                </div>
              </div>
            </div>
          </div>

          <div class="card form-card full-card glass-glow">
            <div class="card-header">
              <span class="icon">📝</span>
              <h3>ملاحظات العضو</h3>
            </div>
            <div class="form-group">
              <textarea formControlName="notes" rows="3"></textarea>
            </div>
          </div>

          <div class="form-footer" *ngIf="hasProfile">
            <button type="submit" class="btn btn-primary update-btn" [disabled]="profileForm.invalid || saving()">
              <span *ngIf="!saving()">💾 تحديث بيانات الملف</span>
              <span *ngIf="saving()">جاري الحفظ...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .profile-page { padding: 1rem 0; }
    .page-header { margin-bottom: 3.5rem; }
    .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .subtitle { color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem; }

    .status-badge {
      padding: 0.4rem 1rem; border-radius: 100px; font-size: 0.8rem; font-weight: 800;
      &.verified { background: rgba(16, 185, 129, 0.1); color: var(--accent); border: 1px solid var(--accent); }
      &.missing { background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1px solid #ff4d4d; }
    }

    .modern-warning {
      background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 20px; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; margin-bottom: 2.5rem;
      .icon { font-size: 2rem; }
      h3 { font-size: 1.1rem; font-weight: 800; color: var(--primary); margin-bottom: 0.2rem; }
      p { color: var(--text-muted); font-size: 0.9rem; }
    }

    .form-sections-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
    .form-card { padding: 2rem; 
      .card-header { display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem; margin-bottom: 1.5rem;
        .icon { font-size: 1.5rem; }
        h3 { font-size: 1.1rem; font-weight: 900; }
      }
    }

    .grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; .full { grid-column: span 2; } }

    .form-group {
      label { display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 800; color: var(--text-muted); }
    }

    .form-footer { display: flex; justify-content: center; margin-top: 3rem; }
    .update-btn { padding: 1.1rem 4rem; font-size: 1.05rem; border-radius: 18px; }

    .modern-loading { text-align: center; padding: 5rem; .loader-orb { width: 40px; height: 40px; border: 3px solid transparent; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; } }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) { .form-sections-grid { grid-template-columns: 1fr; } }
    @media (max-width: 640px) { .grid-form { grid-template-columns: 1fr; .full { grid-column: span 1; } } }
  `]
})
export class UserProfileViewComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  profileForm: FormGroup;
  loading = signal(true);
  saving = signal(false);
  hasProfile = false;
  userId: string | null = null;
  username: string = '';

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
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      await this.loadProfile();
    }
  }

  async loadProfile() {
    this.loading.set(true);
    
    // First, fetch the user basic info to get the username
    const { data: userData } = await this.dataService.getUser(this.userId!);
    if (userData) {
      this.username = userData.username;
    }

    // Then, fetch the profile
    const { data, error } = await this.dataService.getUserProfile(this.userId!);
    if (data) {
      this.profileForm.patchValue(data);
      this.hasProfile = true;
      // If profile has full_name, use it instead of username
      if (data.full_name) this.username = data.full_name;
    } else {
      this.hasProfile = false;
    }
    this.loading.set(false);
  }

  async onUpdate() {
    if (this.profileForm.invalid) return;

    this.saving.set(true);
    const { error } = await this.dataService.updateUserProfile(this.userId!, this.profileForm.value);
    
    if (error) {
      Swal.fire('فشل التحديث', error.message, 'error');
    } else {
      Swal.fire('تم بنجاح', 'تم تحديث بيانات البروفايل بنجاح.', 'success');
    }
    this.saving.set(false);
  }

  goBack() {
    this.router.navigate(['/admin/users']);
  }
}
