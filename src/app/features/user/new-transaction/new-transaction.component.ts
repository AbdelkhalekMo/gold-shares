import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
        <p class="subtitle">وثق معاملات شراء الذهب عيار 21 بسهولة تامة لتحديث رصيد محفظتك الاستثمارية فوراً</p>
      </div>

      <div class="form-container">
        <div class="card glass-card form-glass animate-spring">
          <div class="card-glow"></div>
          
          <!-- Decorative gold luxury corners -->
          <div class="decorative-corner top-left"></div>
          <div class="decorative-corner bottom-right"></div>

          <!-- Stacking context prioritized via position & z-index -->
          <form (ngSubmit)="onSubmit()" #txForm="ngForm" class="modern-form">
            
            <!-- Payment Type Selector (Segmented Cards) -->
            <div class="form-group">
              <label><span class="icon-label">🏷️</span> نوع الطلب</label>
              
              <div *ngIf="checkingAdvance" class="segmented-control skeleton-loading">
                <div class="control-btn skeleton">
                  <div class="skeleton-icon"></div>
                  <div class="skeleton-text"></div>
                </div>
                <div class="control-btn skeleton">
                  <div class="skeleton-icon"></div>
                  <div class="skeleton-text"></div>
                </div>
              </div>

              <div *ngIf="!checkingAdvance" class="segmented-control">
                <button
                  type="button"
                  class="control-btn"
                  [class.active]="tx.payment_type === 'advance'"
                  [disabled]="isAdvancePaid"
                  [title]="isAdvancePaid ? 'لقد قمت بسداد المقدم بالفعل' : ''"
                  (click)="setPaymentType('advance')"
                >
                  <span class="btn-icon">💎</span>
                  <span class="btn-title">مقدم</span>
                  <span class="btn-subtitle">المتبقي: {{ getMaxAdvanceAllowed() | number:'1.0-3' }} جم</span>
                </button>
                <button
                  type="button"
                  class="control-btn"
                  [class.active]="tx.payment_type === 'normal'"
                  [disabled]="isRemainingPaid"
                  [title]="isRemainingPaid ? 'لقد قمت بسداد كامل السهم بالفعل' : ''"
                  (click)="setPaymentType('normal')"
                >
                  <span class="btn-icon">📈</span>
                  <span class="btn-title">دفع عادي سهم</span>
                  <span class="btn-subtitle">المتبقي: {{ getMaxNormalAllowed() | number:'1.0-3' }} جم</span>
                </button>
              </div>
            </div>

            <!-- Payment Period Selector (Conditionally shown) -->
            <div class="form-group animate-slide-down" *ngIf="tx.payment_type === 'normal'">
              <label><span class="icon-label">📅</span> مدة الدفع</label>
              <div class="segmented-control secondary">
                <button
                  type="button"
                  class="control-btn"
                  [class.active]="tx.payment_period === '1_month'"
                  (click)="setPaymentPeriod('1_month')"
                >
                  <span class="btn-title">دفع شهر واحد</span>
                </button>
                <button
                  type="button"
                  class="control-btn"
                  [class.active]="tx.payment_period === '3_months'"
                  (click)="setPaymentPeriod('3_months')"
                >
                  <span class="btn-title">ثلاثة شهور</span>
                </button>
              </div>
            </div>

            <!-- Gram Price Daily -->
            <div class="form-group">
              <label for="gram_price">
                <span class="icon-label">🪙</span> سعر جرام الذهب لعيار 21 اليوم
              </label>
              <div class="input-wrapper">
                <input
                  id="gram_price"
                  type="text"
                  inputmode="decimal"
                  [(ngModel)]="tx.gram_price"
                  name="gram_price"
                  required
                  placeholder="3500"
                  (input)="onCalculate()"
                >
                <span class="prefix-badge">ج.م / جرام</span>
              </div>
            </div>

            <!-- Weight Bought with Interactive presets -->
            <div class="form-group">
              <label for="grams">
                <span class="icon-label">⚖️</span> الوزن المشترى بالجرام
              </label>
              <div class="input-wrapper" [class.has-error]="isGramsExceeded()">
                <input
                  id="grams"
                  type="text"
                  inputmode="decimal"
                  [(ngModel)]="tx.grams"
                  name="grams"
                  required
                  placeholder="0.500"
                  (input)="onCalculate()"
                >
                <span class="prefix-badge">جرام (جم)</span>
              </div>
              
              <!-- Validation Warning Message -->
              <span class="validation-error-msg animate-slide-down" *ngIf="isGramsExceeded()">
                ⚠️ الوزن المدخل يتجاوز الحد الأقصى المسموح به سداده حالياً لهذا الجزء وهو ({{ getMaxAllowed() | number:'1.0-3' }} جم)
              </span>
              
              <!-- Luxury Preset Chips -->
              <div class="preset-chips-container">
                <button
                  *ngFor="let preset of weightPresets"
                  type="button"
                  class="preset-chip"
                  (click)="selectPreset(preset.value)"
                  [class.active]="parseToNumber(tx.grams) === preset.value"
                >
                  {{ preset.label }}
                </button>
              </div>
            </div>

            <!-- Total Amount -->
            <div class="form-group">
              <label for="amount">
                <span class="icon-label">💰</span> القيمة المدفوعة الإجمالية
              </label>
              <div class="input-wrapper">
                <input
                  id="amount"
                  type="text"
                  inputmode="decimal"
                  [(ngModel)]="tx.amount"
                  name="amount"
                  required
                  placeholder="1750"
                >
                <span class="prefix-badge">ج.م</span>
              </div>
            </div>

            <!-- Simulated Luxury Invoice Receipt Card -->
            <div class="live-calc-box invoice-box animate-spring" *ngIf="tx.gram_price || tx.grams">
              <div class="invoice-header">
                <span class="invoice-logo">⚜️</span>
                <span class="invoice-title">ملخص كشف العملية التقديري</span>
              </div>
              <div class="invoice-body">
                <div class="invoice-item">
                  <span class="label">نوع الطلب:</span>
                  <span class="value font-bold text-gradient-gold" style="-webkit-text-fill-color: initial; background: none; color: var(--primary);">
                    {{ tx.payment_type === 'advance' ? 'مقدم' : (tx.payment_period === '1_month' ? 'دفع شهر' : '3 شهور') }}
                  </span>
                </div>
                <div class="invoice-item">
                  <span class="label">الصنف المختار:</span>
                  <span class="value">ذهب عيار 21 قيراط</span>
                </div>
                <div class="invoice-item">
                  <span class="label">سعر الجرام اليومي:</span>
                  <span class="value">{{ parseToNumber(tx.gram_price) | number:'1.0-0' }} ج.م</span>
                </div>
                <div class="invoice-item">
                  <span class="label">الوزن الإجمالي للذهب:</span>
                  <span class="value font-bold">{{ parseToNumber(tx.grams) }} جرام</span>
                </div>
                <div class="invoice-divider"></div>
                <div class="invoice-total">
                  <span class="total-label">الحسبة الإجمالية التقريبية:</span>
                  <span class="total-value text-gradient-gold">{{ getCalculatedAmount() | number:'1.0-2' }} ج.م</span>
                </div>
              </div>
            </div>

            <div class="form-hint card">
              <span class="hint-icon">💡</span>
              <p>تأكد من مطابقة السعر مع الفاتورة الفعلية المرفقة بطلبك لتسريع الموافقة التلقائية.</p>
            </div>

            <button
              type="submit"
              class="submit-btn-premium"
              [disabled]="loading || !txForm.valid || isGramsExceeded()"
            >
              <div class="btn-glow-container"></div>
              <span class="btn-content" *ngIf="!loading">
                <span class="btn-icon">🚀</span> تقديم المعاملة للمراجعة
              </span>
              <span class="btn-content-loading" *ngIf="loading">
                <span class="spinner"></span> جاري تسجيل معاملتك بأمان...
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .new-tx-page { 
      padding: 2.5rem 0; 
      position: relative;
    }
    .page-header { 
      margin-bottom: 2.5rem; 
      text-align: center;
      position: relative;
      z-index: 2;
    }
    .subtitle { 
      color: var(--text-muted); 
      font-size: 1.05rem; 
      margin-top: 0.65rem; 
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.6;
    }

    .form-container { 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      width: 100%; 
      position: relative;
      z-index: 2;
    }
    .form-glass {
      width: 100%; 
      max-width: 550px; 
      padding: 3.5rem;
      background: rgba(255, 255, 255, 0.02); 
      border-radius: 35px; 
      position: relative;
      border: 1px solid rgba(212, 175, 55, 0.12);
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(40px);
      -webkit-backdrop-filter: blur(40px);
    }
    .card-glow { 
      position: absolute; 
      inset: 0; 
      background: radial-gradient(circle at top right, rgba(212, 175, 55, 0.08), transparent 60%); 
      pointer-events: none; 
      border-radius: 35px;
      z-index: 1; /* Pushed to bottom of stacking context */
    }

    /* Luxury Decorative Gold Corners */
    .decorative-corner {
      position: absolute;
      width: 25px;
      height: 25px;
      border: 2px solid rgba(212, 175, 55, 0.25);
      pointer-events: none;
      z-index: 1; /* Pushed to bottom of stacking context */
      
      &.top-left {
        top: 1.5rem;
        left: 1.5rem;
        border-right: none;
        border-bottom: none;
      }
      &.bottom-right {
        bottom: 1.5rem;
        right: 1.5rem;
        border-left: none;
        border-top: none;
      }
    }

    /* Form element placed at highest z-index layer to guarantee clickable areas */
    .modern-form { 
      position: relative;
      z-index: 10;
      display: flex; 
      flex-direction: column; 
      gap: 1.85rem; 
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      
      label { 
        display: flex; 
        align-items: center;
        gap: 0.5rem;
        font-weight: 800; 
        color: var(--primary); 
        font-size: 0.95rem; 
        text-shadow: 0 0 10px rgba(212, 175, 55, 0.1);
        cursor: pointer;
      }
    }

    /* Preset Chips */
    .preset-chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .preset-chip {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      color: var(--text-muted);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.4rem 0.75rem;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(212, 175, 55, 0.08);
        border-color: rgba(212, 175, 55, 0.25);
        color: var(--primary);
      }
      
      &.active {
        background: rgba(212, 175, 55, 0.15);
        border-color: var(--primary);
        color: #fff;
      }
    }

    .icon-label {
      font-size: 1.15rem;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }

    .input-wrapper {
      position: relative;
      display: flex; 
      align-items: center;
      width: 100%;

      .prefix-badge { 
        position: absolute; 
        left: 0.75rem; 
        top: 50%;
        transform: translateY(-50%);
        width: 6.2rem; /* Fixed width to make all input badges look exactly identical */
        text-align: center; /* Center the text inside the badge */
        background: rgba(212, 175, 55, 0.12);
        border: 1px solid rgba(212, 175, 55, 0.25);
        color: var(--primary); 
        font-weight: 800; 
        font-size: 0.78rem; 
        padding: 0.45rem 0; /* Vertical padding only, as width is now fixed */
        border-radius: 12px;
        pointer-events: none;
        user-select: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
      }

      input {
        width: 100%; 
        padding: 1.25rem 1.25rem 1.25rem 7.8rem !important; /* Balanced left-padding to clear the identical badges */
        background: rgba(255, 255, 255, 0.03) !important; 
        border: 1px solid rgba(255, 255, 255, 0.08) !important; 
        border-radius: 18px !important;
        color: #fff !important; 
        font-size: 1.15rem !important; 
        font-weight: 700 !important; 
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        
        /* Native RTL Alignment for Text Input */
        direction: rtl !important; 
        text-align: right !important; /* Keep numbers and cursor aligned to the right for RTL design */
        
        &:focus { 
          outline: none !important; 
          border-color: var(--primary) !important; 
          background: rgba(255, 255, 255, 0.06) !important; 
          box-shadow: 0 0 25px rgba(212, 175, 55, 0.15), inset 0 0 10px rgba(212, 175, 55, 0.05) !important;
        }

        &::placeholder { 
          color: rgba(255, 255, 255, 0.2) !important; 
          text-align: right !important;
        }
      }

      &:focus-within .prefix-badge {
        background: rgba(212, 175, 55, 0.2);
        border-color: var(--primary);
        box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
      }
    }

    /* Simulated Luxury Invoice Box */
    .invoice-box {
      background: rgba(0, 0, 0, 0.25) !important;
      border: 1px solid rgba(212, 175, 55, 0.18) !important;
      border-radius: 20px;
      padding: 1.5rem !important;
      box-shadow: inset 0 0 15px rgba(212, 175, 55, 0.02);
      
      .invoice-header {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        margin-bottom: 1rem;
        
        .invoice-logo {
          font-size: 1.25rem;
          filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.4));
        }
        .invoice-title {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: 0.5px;
        }
      }
      .invoice-body {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }
      .invoice-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8rem;
        
        .label {
          color: var(--text-muted);
        }
        .value {
          color: #fff;
          font-weight: 700;
        }
        .font-bold {
          font-weight: 800;
        }
      }
      .invoice-divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.25), transparent);
        margin: 0.5rem 0;
      }
      .invoice-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .total-label {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--primary);
        }
        .total-value {
          font-size: 1.25rem;
          font-weight: 900;
          text-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
        }
      }
    }
    .text-gradient-gold {
      background: linear-gradient(135deg, var(--primary) 0%, #fff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .form-hint {
      display: flex; 
      align-items: center; 
      gap: 1rem; 
      padding: 1.25rem; 
      background: rgba(255, 255, 255, 0.01); 
      border-radius: 18px; 
      border: 1px solid rgba(255, 255, 255, 0.04);
      
      .hint-icon { 
        font-size: 1.5rem; 
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
      }
      p { 
        font-size: 0.82rem; 
        color: var(--text-muted); 
        line-height: 1.6; 
      }
    }

    /* Premium Metallic Gold Submit Button */
    .submit-btn-premium { 
      width: 100%; 
      padding: 1.25rem; 
      font-size: 1.1rem; 
      font-weight: 800;
      border-radius: 20px; 
      background: linear-gradient(135deg, var(--primary) 0%, #b8860b 50%, #996515 100%);
      color: #000;
      border: none;
      cursor: pointer;
      position: relative;
      z-index: 12; /* Placed at the highest z-index to guarantee clickability */
      overflow: hidden;
      box-shadow: 0 8px 25px rgba(212, 175, 55, 0.25);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: flex;
      justify-content: center;
      align-items: center;

      &::after {
        content: '';
        position: absolute;
        top: 0; left: -100%;
        width: 100%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        transition: 0.6s;
      }
      
      &:hover:not(:disabled) {
        transform: translateY(-4px);
        box-shadow: 0 15px 35px rgba(212, 175, 55, 0.45);
        &::after { left: 100%; }
      }
      
      &:active:not(:disabled) {
        transform: translateY(-1px) scale(0.98);
      }
      
      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        color: var(--text-muted) !important;
        box-shadow: none !important;
        transform: none !important;
      }

      .btn-content {
        display: flex;
        align-items: center;
        gap: 0.65rem;
      }
      
      .btn-icon {
        font-size: 1.25rem;
      }
    }

    /* Loading Spinner */
    .btn-content-loading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #94a3b8;
    }
    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Segmented Controls for Premium Choices */
    .segmented-control {
      display: flex;
      gap: 1rem;
      width: 100%;
      margin-bottom: 0.5rem;
      direction: rtl;
      
      .control-btn {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 18px;
        color: var(--text-muted);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        
        .btn-icon {
          font-size: 1.5rem;
          transition: transform 0.3s ease;
        }
        .btn-title {
          font-size: 0.95rem;
          font-weight: 800;
        }
        .btn-subtitle {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.2rem;
          font-weight: 700;
        }
        
        &:hover {
          background: rgba(212, 175, 55, 0.05);
          border-color: rgba(212, 175, 55, 0.2);
          color: var(--primary);
          
          .btn-icon {
            transform: scale(1.15);
          }
        }
        &:disabled {
          opacity: 0.3;
          cursor: not-allowed;
          background: rgba(0, 0, 0, 0.2);
          border-color: rgba(255, 255, 255, 0.03);
          color: var(--text-muted);
          &:hover {
            background: rgba(0, 0, 0, 0.2);
            border-color: rgba(255, 255, 255, 0.03);
            color: var(--text-muted);
            .btn-icon { transform: none; }
          }
        }

        &.active {
          background: rgba(212, 175, 55, 0.12);
          border-color: var(--primary);
          color: #fff;
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.15), inset 0 0 10px rgba(212, 175, 55, 0.05);
          
          .btn-icon {
            transform: scale(1.2);
            filter: drop-shadow(0 0 8px var(--primary));
          }
          .btn-subtitle {
            color: var(--primary);
          }
        }
      }
      
      &.secondary {
        gap: 0.75rem;
        .control-btn {
          padding: 0.85rem;
          flex-direction: row;
          border-radius: 14px;
          
          &.active {
            background: rgba(16, 185, 129, 0.12);
            border-color: var(--accent);
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.15);
          }
          &:hover:not(.active) {
            background: rgba(16, 185, 129, 0.04);
            border-color: rgba(16, 185, 129, 0.2);
            color: var(--accent);
          }
        }
      }

      &.skeleton-loading {
        pointer-events: none;
        
        .skeleton {
          background: rgba(255, 255, 255, 0.01) !important;
          border: 1px solid rgba(255, 255, 255, 0.03) !important;
          position: relative;
          overflow: hidden;
          
          &::after {
            content: "";
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(212, 175, 55, 0.05),
              transparent
            );
            animation: skeleton-shimmer 1.6s infinite;
          }
        }
        
        .skeleton-icon {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 50%;
          margin-bottom: 0.5rem;
        }
        
        .skeleton-text {
          width: 60px;
          height: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
        }
      }
    }

    /* Micro animations */
    .animate-slide-down {
      animation: slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes skeleton-shimmer {
      0% {
        transform: translateX(100%);
      }
      100% {
        transform: translateX(-100%);
      }
    }

    .validation-error-msg {
      color: #ef4444;
      font-size: 0.78rem;
      font-weight: 700;
      margin-top: 0.35rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .input-wrapper.has-error {
      input {
        border-color: #ef4444 !important;
        box-shadow: 0 0 15px rgba(239, 68, 68, 0.15), inset 0 0 10px rgba(239, 68, 68, 0.05) !important;
        
        &:focus {
          border-color: #ef4444 !important;
          box-shadow: 0 0 25px rgba(239, 68, 68, 0.25) !important;
        }
      }
      .prefix-badge {
        background: rgba(239, 68, 68, 0.12) !important;
        border-color: rgba(239, 68, 68, 0.25) !important;
        color: #f87171 !important;
      }
    }

    @media (max-width: 768px) {
      .new-tx-page { padding: 1.5rem 0; }
      .page-header { margin-bottom: 2rem; }
      .subtitle { font-size: 0.95rem; padding: 0 1rem; }
      .form-glass {
        padding: 2.25rem 2rem;
        border-radius: 28px;
      }
      .modern-form { gap: 1.5rem; }
    }

    @media (max-width: 480px) {
      .page-header { margin-bottom: 1.5rem; }
      .islamic-header { font-size: 2.15rem; }
      .form-glass {
        padding: 1.5rem 1.15rem;
        border-radius: 22px;
      }
      .input-wrapper input {
        padding: 1.1rem 1rem 1.1rem 5.8rem !important; /* Responsive luxury spacing */
        font-size: 1.05rem !important;
      }
      .input-wrapper .prefix-badge {
        left: 0.5rem;
        width: 4.8rem; /* Fixed badge width on mobile */
        text-align: center;
        padding: 0.4rem 0;
        font-size: 0.72rem;
      }
      .submit-btn-premium {
        padding: 1.1rem;
        font-size: 1rem;
        border-radius: 16px;
      }
      .form-hint {
        padding: 1rem;
        gap: 0.75rem;
        .hint-icon { font-size: 1.25rem; }
        p { font-size: 0.75rem; }
      }
      .invoice-box {
        padding: 1rem !important;
        .invoice-logo { font-size: 1.15rem; }
        .invoice-title { font-size: 0.78rem; }
        .invoice-item { font-size: 0.75rem; }
        .invoice-total .total-label { font-size: 0.78rem; }
        .invoice-total .total-value { font-size: 1.1rem; }
      }
    }
  `]
})
export class NewTransactionComponent implements OnInit {
  dataService = inject(DataService);
  authService = inject(AuthService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);

  loading = false;
  selectedKarat = '21'; // Fixed Karat 21 strictly
  weightPresets = [
    { label: '0.5 جرام', value: 0.5 },
    { label: '1 جرام', value: 1 },
    { label: '5 جرام', value: 5 },
    { label: '10 جرام', value: 10 },
    { label: 'جنيه ذهب (8ج)', value: 8 },
    { label: 'أونصة (31.1ج)', value: 31.1 }
  ];

  tx = {
    gram_price: '3500' as string | number | null, // Pre-populated with default 21K price for ultimate ease of use!
    grams: '' as string | number | null,
    amount: '' as string | number | null,
    payment_type: 'advance' as 'advance' | 'normal',
    payment_period: null as '1_month' | '3_months' | null
  };

  isAdvancePaid = false;
  isRemainingPaid = false;
  checkingAdvance = true;
  userAdvance = 0;
  userRemaining = 0;
  pendingAdvance = 0;
  pendingNormal = 0;

  constructor() {
    console.log('NewTransactionComponent constructor start');
    const user = this.authService.currentUser();
    console.log('User in constructor:', user);
    if (user) {
      this.userAdvance = Number(user.advance || 0);
      this.userRemaining = Number(user.remaining || 0);
      this.isAdvancePaid = this.userAdvance <= 0;
      this.isRemainingPaid = this.userRemaining <= 0;
      if (this.isAdvancePaid) {
        this.tx.payment_type = 'normal';
        this.tx.payment_period = '1_month';
        this.checkingAdvance = false;
      }
    }
    console.log('NewTransactionComponent constructor end, checkingAdvance =', this.checkingAdvance);
  }

  async ngOnInit() {
    console.log('NewTransactionComponent ngOnInit start');
    try {
      console.log('Calling refreshCurrentUser...');
      await this.authService.refreshCurrentUser();
      console.log('refreshCurrentUser completed');
      
      const user = this.authService.currentUser();
      console.log('User after refresh:', user);
      if (user) {
        this.userAdvance = Number(user.advance || 0);
        this.userRemaining = Number(user.remaining || 0);
        const userId = user.id;
        
        let pendingAdvanceGrams = 0;
        let pendingNormalGrams = 0;
        try {
          console.log('Querying transactions for user:', userId);
          const pendingRes = await this.dataService.getPendingTransactions(userId);
          console.log('Transactions queried successfully');
          const pendingList = pendingRes?.data || [];
          
          pendingAdvanceGrams = pendingList
            .filter((tx: any) => tx.payment_type === 'advance')
            .reduce((sum: number, tx: any) => sum + Number(tx.grams || 0), 0);
            
          pendingNormalGrams = pendingList
            .filter((tx: any) => tx.payment_type === 'normal')
            .reduce((sum: number, tx: any) => sum + Number(tx.grams || 0), 0);
        } catch (dbErr) {
          console.error('Failed to query user transactions history:', dbErr);
        }
        
        this.pendingAdvance = pendingAdvanceGrams;
        this.pendingNormal = pendingNormalGrams;
        
        this.isAdvancePaid = (this.userAdvance - this.pendingAdvance) <= 0;
        this.isRemainingPaid = (this.userRemaining - this.pendingNormal) <= 0;
      }
      
      // 3. Set default transaction type based on advance payment state
      if (this.isAdvancePaid) {
        this.tx.payment_type = 'normal';
        this.tx.payment_period = '1_month';
      } else {
        this.tx.payment_type = 'advance';
        this.tx.payment_period = null;
      }
    } catch (err) {
      console.error('Error loading transaction configuration:', err);
    } finally {
      this.checkingAdvance = false;
      this.cdr.detectChanges();
      console.log('NewTransactionComponent ngOnInit end, checkingAdvance =', this.checkingAdvance);
    }
  }

  getMaxAdvanceAllowed(): number {
    const limit = this.userAdvance - this.pendingAdvance;
    return limit > 0 ? Number(limit.toFixed(3)) : 0;
  }

  getMaxNormalAllowed(): number {
    const limit = this.userRemaining - this.pendingNormal;
    return limit > 0 ? Number(limit.toFixed(3)) : 0;
  }

  getMaxAllowed(): number {
    return this.tx.payment_type === 'advance' ? this.getMaxAdvanceAllowed() : this.getMaxNormalAllowed();
  }

  isGramsExceeded(): boolean {
    const grams = Number(this.tx.grams);
    if (!grams) return false;
    const max = this.getMaxAllowed();
    return grams > max;
  }

  setPaymentType(type: 'advance' | 'normal') {
    if (type === 'advance' && this.isAdvancePaid) return;
    this.tx.payment_type = type;
    if (type === 'advance') {
      this.tx.payment_period = null;
    } else {
      this.tx.payment_period = '1_month';
    }
  }

  setPaymentPeriod(period: '1_month' | '3_months') {
    this.tx.payment_period = period;
  }

  selectPreset(weight: number) {
    this.tx.grams = weight;
    this.onCalculate();
  }

  onCalculate() {
    const price = Number(this.tx.gram_price);
    const grams = Number(this.tx.grams);
    if (price && grams) {
      // Auto-calculate EGP amount: Price per gram * Gram weight
      this.tx.amount = Math.round(price * grams * 100) / 100;
    }
  }

  getCalculatedAmount(): number {
    const price = Number(this.tx.gram_price) || 0;
    const grams = Number(this.tx.grams) || 0;
    return price * grams;
  }

  parseToNumber(value: any): number {
    return Number(value) || 0;
  }

  async onSubmit() {
    const price = Number(this.tx.gram_price);
    const grams = Number(this.tx.grams);
    const amount = Number(this.tx.amount);

    if (!grams || !price || !amount) return;

    this.loading = true;
    const user = this.authService.currentUser();
    if (!user) return;

    const { error } = await this.dataService.addPendingTransaction({
      user_id: user.id,
      gram_price: price,
      grams: grams,
      amount: amount,
      payment_type: this.tx.payment_type,
      payment_period: this.tx.payment_type === 'normal' ? this.tx.payment_period : null
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
      // Reset form dynamically based on advance paid state
      this.tx = {
        gram_price: '3500',
        grams: '',
        amount: '',
        payment_type: this.isAdvancePaid ? 'normal' : 'advance',
        payment_period: this.isAdvancePaid ? '1_month' : null
      };
      this.router.navigate(['/user']);
    }
    this.loading = false;
  }
}
