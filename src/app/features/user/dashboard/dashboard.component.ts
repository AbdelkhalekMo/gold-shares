import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="user-dashboard animate-spring">
      <!-- Premium Welcome & Quick Action Header -->
      <div class="dashboard-header-container">
        <div class="welcome-section">
          <div class="avatar-emblem">{{ user()?.username?.substring(0, 1)?.toUpperCase() }}</div>
          <div class="welcome-text">
            <h1 class="islamic-header">
              <span class="text-gradient">أهلاً بك،</span> {{ user()?.username }}
              <span *ngIf="user()?.member_code" style="font-size: 1.1rem; color: var(--primary); font-weight: 800; margin-right: 0.5rem; vertical-align: middle;">
                (كود: {{ user()?.member_code }})
              </span>
            </h1>
            <p class="subtitle" style="display: flex; flex-direction: column; gap: 0.25rem;">
              <span>مرحباً بك في لوحة تحكم جمعية الذهب المشترك. محفظتك الاستثمارية نشطة حالياً.</span>
              <span *ngIf="user()?.expected_delivery_date" style="color: var(--accent); font-weight: bold; margin-top: 0.25rem;">
                📅 تاريخ التسليم المتوقع للسهم: {{ user()?.expected_delivery_date }}
              </span>
            </p>
          </div>
        </div>
        <div class="quick-actions">
          <button class="btn btn-primary glow-btn animate-pulse-subtle" routerLink="/user/new-transaction">
            <span>➕ طلب إضافة وزن جديد</span>
          </button>
        </div>
      </div>

      <!-- Bento Stats Grid -->
      <div class="bento-grid">
        <div class="stat-card advance-card">
          <div class="card-icon">💎</div>
          <div class="stat-content">
            <p class="label">المقدم المطلوب</p>
            <h2 class="value">{{ user()?.advance ?? 0 }} <small>جم</small></h2>
          </div>
        </div>
        <div class="stat-card remaining-card">
          <div class="card-icon">📉</div>
          <div class="stat-content">
            <p class="label">الوزن المتبقي</p>
            <h2 class="value">{{ user()?.remaining ?? 0 }} <small>جم</small></h2>
          </div>
        </div>
        <div class="stat-card paid-card">
          <div class="card-icon">🏆</div>
          <div class="stat-content">
            <p class="label">إجمالي المسدد</p>
            <h2 class="value">{{ (user()?.paid ?? 0) | number:'1.0-3' }} <small>جم</small></h2>
          </div>
        </div>
        <div class="stat-card amount-card">
          <div class="card-icon">🏛️</div>
          <div class="stat-content">
            <p class="label">إجمالي المدفوعات</p>
            <h2 class="value">{{ (user()?.totalAmount ?? 0) | number }} <small>ج.م</small></h2>
          </div>
        </div>
      </div>

      <!-- Advance Payment Status Banner -->
      <div class="advance-status-card animate-spring" *ngIf="user()" [class.success]="isAdvanceFullyPaid()" [class.pending]="!isAdvanceFullyPaid()">
        <div class="glass-inner">
          <div class="glow-effect"></div>
          <div class="icon-wrap">{{ isAdvanceFullyPaid() ? '👑' : '⏳' }}</div>
          <div class="text">
            <h3>{{ isAdvanceFullyPaid() ? 'تم دفع المقدم بنجاح' : 'متبقي سداد جزء من المقدم' }}</h3>
            <p *ngIf="isAdvanceFullyPaid()">بارك الله فيك، لقد قمت بسداد كامل مبلغ مقدم الجمعية المترتب عليك بنجاح!</p>
            <p *ngIf="!isAdvanceFullyPaid()">
              متبقي لك 
              <span class="highlight-grams">{{ getRemainingAdvance() }} جرام</span> 
              لتغطية المقدم بالكامل (المطلوب: {{ user()?.initial_advance || 0 }} جم، المسدد حالياً: {{ ((user()?.initial_advance || 0) - (user()?.advance || 0)) | number:'1.0-3' }} جم).
            </p>
          </div>
          <div class="badge-modern">{{ isAdvanceFullyPaid() ? 'مكتمل' : 'متبقي' }}</div>
        </div>
      </div>

      <!-- Modern Delivery Progress Card -->
      <div class="delivery-card animate-spring" *ngIf="user()">
        <div class="glass-inner" [class.success]="user()?.isReceived" [class.pending]="!user()?.isReceived">
          <div class="glow-effect"></div>
          <div class="icon-wrap">{{ user()?.isReceived ? '👑' : '📦' }}</div>
          <div class="text">
            <h3>📦 حالة استلام حصتك للذهب المادي</h3>
            <p *ngIf="user()?.isReceived">تهانينا! لقد اكتملت رحلتك الادخارية وتم استلام كامل حصتك من الذهب بنجاح ({{ getUserTotalGrams() | number:'1.0-3' }} جم).</p>
            <p *ngIf="!user()?.isReceived && getDeliveredGrams() > 0">
              تم تسليمك <span class="highlight-grams">{{ getDeliveredGrams() | number:'1.0-3' }} جم</span> حتى الآن من إجمالي مستحقاتك البالغة <span class="highlight-grams-total">{{ getUserTotalGrams() | number:'1.0-3' }} جم</span>. 
              المتبقي لتستلمه: <span class="highlight-grams-rem">{{ getRemainingDeliveryGrams() | number:'1.0-3' }} جم</span>.
            </p>
            <p *ngIf="!user()?.isReceived && getDeliveredGrams() === 0">
              بانتظار بدء عملية تسليم الذهب المادي من قِبل الإدارة. إجمالي مستحقاتك البالغة: <span class="highlight-grams-total">{{ getUserTotalGrams() | number:'1.0-3' }} جم</span>.
            </p>
            
            <!-- Delivery Progress Bar -->
            <div class="delivery-progress-container">
              <div class="delivery-progress-bar" [style.width.%]="getDeliveryProgress()"></div>
              <span class="delivery-progress-text">{{ getDeliveryProgress() | number:'1.0-1' }}% تم استلامه</span>
            </div>
          </div>
          <div class="badge-modern">{{ user()?.isReceived ? 'مكتمل' : (getDeliveredGrams() > 0 ? 'استلام جزئي' : 'بانتظار الاستلام') }}</div>
        </div>
      </div>

      <!-- Transactions Section -->
      <div class="section animate-spring">
        <div class="section-header">
          <h3 class="section-title">📜 تاريخ العمليات</h3>
          <div class="line"></div>
        </div>

        <div *ngIf="loading" class="modern-loading">
          <div class="loader-orb"></div>
          <p>جاري مزامنة البيانات مع الشبكة...</p>
        </div>

        <ng-container *ngIf="!loading">
          <div class="table-container" *ngIf="transactions.length > 0; else empty">
            <table>
              <thead>
                <tr>
                  <th>الرقم المرجعي</th>
                  <th>نوع الدفع</th>
                  <th>السعر اليومي</th>
                  <th>الوزن</th>
                  <th>القيمة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tx of transactions">
                  <td class="ref-id">#{{ tx.transaction_number }}</td>
                  <td>
                    <span class="badge-type" [class.advance]="tx.payment_type === 'advance'" [class.normal]="tx.payment_type !== 'advance'">
                      {{ tx.payment_type === 'advance' ? '💎 مقدم' : (tx.payment_period === '3_months' ? '📈 3 شهور' : '📈 دفع شهر') }}
                    </span>
                  </td>
                  <td>{{ tx.gram_price | number }} ج.م</td>
                  <td class="text-gold font-bold">{{ tx.grams | number:'1.0-3' }} جم</td>
                  <td>{{ tx.amount | number }} ج.م</td>
                  <td class="date">{{ tx.created_at | date:'yyyy-MM-dd HH:mm':'Africa/Cairo' }} (بتوقيت القاهرة)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <ng-template #empty>
            <div class="modern-empty card glass-glow">
              <div class="empty-icon">🕊️</div>
              <h3>السجل فارغ حالياً</h3>
              <p>بمجرد تأكيد معاملاتك، ستظهر هنا بالتفصيل.</p>
              <button class="btn btn-primary" routerLink="/user/new-transaction">إضافة معاملة</button>
            </div>
          </ng-template>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .user-dashboard { 
      padding: 1.5rem 0; 
    }

    /* Premium Header Container */
    .dashboard-header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2.25rem 2.5rem;
      margin-bottom: 2.5rem;
      border-radius: 28px;
      background: rgba(255, 255, 255, 0.015);
      border: 1px solid rgba(212, 175, 55, 0.08);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35), inset 0 0 30px rgba(255, 255, 255, 0.01);
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      
      &::before {
        content: '';
        position: absolute;
        top: 0; right: 0;
        width: 180px; height: 180px;
        background: radial-gradient(circle, rgba(212, 175, 55, 0.04) 0%, transparent 70%);
        pointer-events: none;
      }
      
      .welcome-section {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        
        .avatar-emblem {
          width: 65px;
          height: 65px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary) 0%, #b8860b 100%);
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.85rem;
          font-weight: 900;
          box-shadow: 0 8px 25px rgba(212, 175, 55, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.2);
          user-select: none;
        }
        
        .welcome-text {
          .islamic-header {
            margin: 0;
            line-height: 1.25;
            font-size: 2.25rem;
          }
          .subtitle {
            margin: 0.35rem 0 0;
            font-size: 1.05rem;
            color: var(--text-muted);
            font-weight: 500;
          }
        }
      }
      
      .quick-actions {
        .glow-btn {
          background: linear-gradient(135deg, var(--primary) 0%, #b8860b 100%) !important;
          color: #000 !important;
          font-weight: 800;
          font-size: 1rem;
          padding: 1rem 2rem;
          border-radius: 18px;
          box-shadow: 0 8px 20px rgba(212, 175, 55, 0.2);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
          border: none;
          
          &:hover {
            transform: translateY(-4px);
            box-shadow: 0 15px 30px rgba(212, 175, 55, 0.4);
          }
        }
      }
    }

    /* Bento Stats Grid */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    .stat-card {
      position: relative;
      overflow: hidden;
      padding: 2rem 1.5rem;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.012);
      border: 1px solid rgba(255, 255, 255, 0.04);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
      display: flex;
      align-items: center;
      gap: 1.25rem;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 24px;
        padding: 1px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent 60%);
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
      }
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.35);
        background: rgba(255, 255, 255, 0.025);
      }

      .card-icon {
        width: 54px;
        height: 54px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.75rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        transition: all 0.3s ease;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        
        .label {
          color: var(--text-muted);
          font-weight: 700;
          font-size: 0.82rem;
          margin: 0;
          text-transform: uppercase;
        }
        .value {
          font-size: 1.85rem;
          font-weight: 900;
          color: #fff;
          margin: 0;
          line-height: 1.2;
          
          small {
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-right: 0.25rem;
          }
        }
      }

      /* Card Specialties */
      &.advance-card {
        border-color: rgba(212, 175, 55, 0.1);
        .card-icon {
          background: rgba(212, 175, 55, 0.06);
          border-color: rgba(212, 175, 55, 0.18);
          color: var(--primary);
        }
        &:hover {
          border-color: rgba(212, 175, 55, 0.3);
          box-shadow: 0 15px 35px rgba(212, 175, 55, 0.08);
          .card-icon { transform: scale(1.05) rotate(5deg); }
        }
      }

      &.remaining-card {
        border-color: rgba(239, 68, 68, 0.1);
        .card-icon {
          background: rgba(239, 68, 68, 0.06);
          border-color: rgba(239, 68, 68, 0.18);
          color: #ef4444;
        }
        .value { color: #f87171; }
        &:hover {
          border-color: rgba(239, 68, 68, 0.3);
          box-shadow: 0 15px 35px rgba(239, 68, 68, 0.08);
          .card-icon { transform: scale(1.05) translateY(-2px); }
        }
      }

      &.paid-card {
        border-color: rgba(16, 185, 129, 0.12);
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.01), rgba(0, 0, 0, 0.15));
        .card-icon {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.2);
          color: var(--accent);
        }
        .value {
          background: linear-gradient(135deg, #fff 0%, var(--primary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        &:hover {
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 15px 35px rgba(16, 185, 129, 0.1);
          .card-icon { transform: scale(1.1) rotate(-5deg); }
        }
      }

      &.amount-card {
        border-color: rgba(59, 130, 246, 0.1);
        .card-icon {
          background: rgba(59, 130, 246, 0.06);
          border-color: rgba(59, 130, 246, 0.18);
          color: #3b82f6;
        }
        &:hover {
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 15px 35px rgba(59, 130, 246, 0.08);
          .card-icon { transform: scale(1.05) scaleX(-1); }
        }
      }
    }

    /* Banners (Advance Status and Delivery) */
    .advance-status-card, .delivery-card {
      margin-bottom: 2.5rem;
      
      .glass-inner {
        border-radius: 24px;
        padding: 1.75rem 2.25rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
        transition: all 0.3s ease;
        
        &::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 24px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(255,255,255,0.06), transparent 50%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      }

      .icon-wrap {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        background: rgba(255, 255, 255, 0.02);
        box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.02);
      }

      .text {
        flex: 1;
        
        h3 {
          font-size: 1.35rem;
          font-weight: 800;
          margin-bottom: 0.35rem;
        }
        p {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.5;
        }
      }

      .badge-modern {
        padding: 0.45rem 1.25rem;
        border-radius: 100px;
        font-weight: 900;
        font-size: 0.75rem;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      &.success {
        .glass-inner {
          background: rgba(16, 185, 129, 0.08); 
          border: 1px solid rgba(16, 185, 129, 0.2);
          .icon-wrap { filter: drop-shadow(0 0 15px rgba(16, 185, 129, 0.4)); }
          h3 { color: var(--accent); }
          .badge-modern { background: var(--accent); color: #000; }
        }
      }
      
      &.pending {
        .glass-inner {
          background: rgba(212, 175, 55, 0.05); 
          border: 1px solid rgba(212, 175, 55, 0.15);
          .icon-wrap { filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.3)); }
          h3 { color: var(--primary); }
          .badge-modern { background: var(--primary); color: #000; }
        }
      }
    }

    /* Delivery Progress Card Styles */
    .delivery-card {
      margin-bottom: 2.5rem;
      
      .glass-inner.success {
        background: rgba(16, 185, 129, 0.08); 
        border: 1px solid rgba(16, 185, 129, 0.2);
        h3 { color: var(--accent); }
        .badge-modern { background: var(--accent); color: #000; }
      }
      .glass-inner.pending {
        background: rgba(212, 175, 55, 0.04); 
        border: 1px solid rgba(212, 175, 55, 0.12);
        h3 { color: var(--primary); }
        .badge-modern { background: var(--primary); color: #000; }
      }
      
      .text {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
      }
      
      .highlight-grams { color: var(--primary); font-weight: 800; }
      .highlight-grams-total { color: #fff; font-weight: 800; }
      .highlight-grams-rem { color: #ef4444; font-weight: 800; }
      
      .delivery-progress-container {
        width: 100%;
        height: 18px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        margin-top: 0.5rem;
        border: 1px solid rgba(255, 255, 255, 0.03);
      }
      .delivery-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--primary), var(--accent));
        border-radius: 10px;
        transition: width 0.4s ease;
      }
      .delivery-progress-text {
        position: absolute;
        left: 10px;
        font-size: 0.7rem;
        font-weight: 900;
        color: #fff;
        text-shadow: 0 1px 2px rgba(0,0,0,0.8);
      }
    }

    /* History Table Section */
    .section {
      margin-top: 3.5rem;
      background: rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: 30px;
      padding: 2.5rem;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2.25rem;
      
      .section-title {
        font-size: 1.5rem;
        font-weight: 800;
        white-space: nowrap;
        color: #fff;
      }
      .line {
        height: 1px;
        width: 100%;
        background: linear-gradient(to left, var(--glass-border), transparent);
      }
    }

    .table-container {
      background: transparent !important;
      border: none !important;
      backdrop-filter: none !important;
      border-radius: 0 !important;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 10px !important;
      padding: 0;
      min-width: 600px;
      
      th {
        background: transparent;
        color: var(--primary) !important;
        font-size: 0.85rem !important;
        font-weight: 900 !important;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding: 1.25rem 1rem !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
        text-align: right;
      }
      
      tbody tr {
        background: rgba(255, 255, 255, 0.01);
        border: 1px solid rgba(255, 255, 255, 0.02);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        
        td {
          background: rgba(255, 255, 255, 0.015) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          padding: 1.25rem 1.25rem !important;
          font-weight: 600;
          color: #e2e8f0;
          text-align: right;
          
          /* Fixed border radius for RTL */
          &:first-child { 
            border-right: 1px solid rgba(255, 255, 255, 0.02);
            border-radius: 0 16px 16px 0 !important; 
          }
          &:last-child { 
            border-left: 1px solid rgba(255, 255, 255, 0.02);
            border-radius: 16px 0 0 16px !important; 
          }
        }
        
        &:hover {
          transform: translateY(-2px);
          
          td {
            background: rgba(212, 175, 55, 0.04) !important;
            border-color: rgba(212, 175, 55, 0.15) !important;
            color: #fff;
            
            &.text-gold {
              color: var(--primary);
              text-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
            }
          }
        }
      }
    }

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
    }

    .ref-id { 
      font-family: 'Plus Jakarta Sans', sans-serif; 
      color: var(--primary); 
      font-weight: 800; 
    }
    
    .date { 
      color: var(--text-muted); 
      font-size: 0.85rem; 
    }

    .modern-empty {
      text-align: center;
      padding: 5rem 2rem;
      
      .empty-icon { 
        font-size: 4rem; 
        margin-bottom: 1.5rem; 
        opacity: 0.35; 
      }
      h3 { 
        font-size: 1.6rem; 
        margin-bottom: 0.75rem; 
        color: #fff;
      }
      p { 
        color: var(--text-muted); 
        margin-bottom: 2rem; 
        font-size: 1rem;
      }
    }

    .modern-loading {
      text-align: center;
      padding: 4rem;
      
      .loader-orb {
        width: 45px;
        height: 45px;
        border: 3px solid transparent;
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1.5rem;
      }
      p {
        color: var(--text-muted);
        font-size: 0.95rem;
      }
    }

    @keyframes spin { 
      to { transform: rotate(360deg); } 
    }

    @keyframes pulse-subtle {
      0%, 100% {
        box-shadow: 0 8px 20px rgba(212, 175, 55, 0.2);
      }
      50% {
        box-shadow: 0 8px 30px rgba(212, 175, 55, 0.45);
      }
    }
    
    .animate-pulse-subtle {
      animation: pulse-subtle 3s infinite ease-in-out;
    }

    /* Responsiveness */
    @media (max-width: 1024px) {
      .bento-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .dashboard-header-container {
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 2rem 1.5rem;
        margin-bottom: 2rem;
        gap: 1.5rem;
        
        .welcome-section {
          flex-direction: column;
          gap: 1rem;
          
          .avatar-emblem {
            width: 60px;
            height: 60px;
            font-size: 1.75rem;
          }
          .welcome-text {
            .islamic-header {
              font-size: 1.85rem;
            }
            .subtitle {
              font-size: 0.95rem;
            }
          }
        }
        
        .quick-actions {
          width: 100%;
          .glow-btn {
            width: 100%;
            justify-content: center;
            padding: 1rem;
            font-size: 1rem;
          }
        }
      }

      .stat-card {
        padding: 1.5rem 1.25rem;
        gap: 1rem;
        .card-icon { 
          width: 48px;
          height: 48px;
          font-size: 1.5rem; 
        }
        .value { font-size: 1.5rem; }
      }

      .advance-status-card, .delivery-card {
        margin-bottom: 1.5rem;
        .glass-inner {
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1.25rem;
          padding: 2.25rem 1.5rem 1.5rem;
        }
        .icon-wrap { font-size: 2.5rem; }
        h3 { font-size: 1.3rem; }
        p { font-size: 0.9rem; }
        .badge-modern {
          position: static;
          margin-top: 0.75rem;
          display: inline-block;
        }
      }

      .section {
        padding: 1.5rem;
        border-radius: 20px;
        margin-top: 2rem;
      }
      
      .section-header {
        margin-bottom: 1.5rem;
        .section-title { font-size: 1.25rem; }
      }
    }

    @media (max-width: 520px) {
      .bento-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  dataService = inject(DataService);
  authService = inject(AuthService);
  cdr = inject(ChangeDetectorRef);

  user = this.authService.currentUser;
  transactions: any[] = [];
  loading = true;

  getRemainingAdvance(): number {
    const userObj = this.user();
    if (!userObj) return 0;
    return Number(userObj.advance || 0);
  }

  isAdvanceFullyPaid(): boolean {
    const userObj = this.user();
    if (!userObj) return false;
    return Number(userObj.advance || 0) <= 0;
  }

  getUserTotalGrams(): number {
    const userObj = this.user();
    if (!userObj) return 0;
    return Number(userObj.initial_advance || 0) + Number(userObj.initial_remaining || 0);
  }

  getDeliveredGrams(): number {
    const userObj = this.user();
    if (!userObj) return 0;
    return Number(userObj.delivered_grams || 0);
  }

  getRemainingDeliveryGrams(): number {
    const rem = this.getUserTotalGrams() - this.getDeliveredGrams();
    return rem > 0 ? rem : 0;
  }

  getDeliveryProgress(): number {
    const total = this.getUserTotalGrams();
    if (!total) return 0;
    return Math.min(100, (this.getDeliveredGrams() / total) * 100);
  }

  ngOnInit() {
    this.loadTransactions();
  }

  async loadTransactions() {
    this.loading = true;
    this.cdr.detectChanges();

    const userId = this.user()?.id;
    if (userId) {
      await this.authService.refreshCurrentUser();
      const { data, error } = await this.dataService.getApprovedTransactions(userId);
      if (error) console.error(error);
      this.transactions = data || [];
    }

    this.loading = false;
    this.cdr.detectChanges();
  }
}
