import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';
import { getCairoDate } from '../../../core/utils/date-utils';

interface UserStatement {
  user: any;
  transactions: any[];
  totalGrams: number;
  totalAmount: number;
  overallGrams: number;
  overallPaid: number;
  overallRemaining: number;
  selected: boolean; // For bulk checkbox selection
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-page animate-spring no-print">
      <div class="page-header">
        <h1 class="islamic-header text-gradient">مركز التقارير وكشوف الحسابات</h1>
        <p class="subtitle">قم بفرز وتوليد ملخصات الحسابات للمساهمين بشكل يومي، أسبوعي، شهري أو سنوي وطباعتها ورقياً بشكل رسمي.</p>
      </div>

      <!-- Filters Panel -->
      <div class="card glass-card filter-panel">
        <div class="card-glow"></div>
        <div class="filters-grid">
          
          <!-- Select Shareholder -->
          <div class="filter-group">
            <label for="user-select">👤 المساهم</label>
            <select id="user-select" [(ngModel)]="selectedUserId" (change)="onFilterChange()">
              <option value="all">كل المساهمين</option>
              <option *ngFor="let u of users" [value]="u.id">{{ u.username }}{{ u.member_code ? ' (كود: ' + u.member_code + ')' : '' }} ({{ u.email }})</option>
            </select>
          </div>

          <!-- Select Period Type -->
          <div class="filter-group">
            <label for="period-select">📅 الدورة الزمنية</label>
            <select id="period-select" [(ngModel)]="periodType" (change)="onFilterChange()">
              <option value="all">كل الأوقات</option>
              <option value="daily">يومي</option>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
              <option value="yearly">سنوي</option>
              <option value="custom">فترة مخصصة</option>
            </select>
          </div>

          <!-- Dynamic Period Inputs -->
          <ng-container [ngSwitch]="periodType">
            
            <!-- Daily Date Picker -->
            <div class="filter-group" *ngSwitchCase="'daily'">
              <label for="date-input">📆 اختر اليوم</label>
              <input type="date" id="date-input" [(ngModel)]="filterDate" (change)="onFilterChange()">
            </div>

            <!-- Weekly Date Picker -->
            <div class="filter-group" *ngSwitchCase="'weekly'">
              <label for="week-input">📆 اختر يوم في الأسبوع</label>
              <input type="date" id="week-input" [(ngModel)]="filterDate" (change)="onFilterChange()">
              <span class="hint-text">يعرض المعاملات طوال الأسبوع من السبت إلى الجمعة.</span>
            </div>

            <!-- Monthly Selector -->
            <ng-container *ngSwitchCase="'monthly'">
              <div class="filter-group">
                <label for="month-select">🌙 الشهر</label>
                <select id="month-select" [(ngModel)]="filterMonth" (change)="onFilterChange()">
                  <option *ngFor="let m of monthsList" [value]="m.value">{{ m.label }}</option>
                </select>
              </div>
              <div class="filter-group">
                <label for="year-select">🗓️ السنة</label>
                <select id="year-select" [(ngModel)]="filterYear" (change)="onFilterChange()">
                  <option *ngFor="let y of availableYears" [value]="y">{{ y }}</option>
                </select>
              </div>
            </ng-container>

            <!-- Yearly Selector -->
            <div class="filter-group" *ngSwitchCase="'yearly'">
              <label for="year-only-select">🗓️ السنة</label>
              <select id="year-only-select" [(ngModel)]="filterYear" (change)="onFilterChange()">
                <option *ngFor="let y of availableYears" [value]="y">{{ y }}</option>
              </select>
            </div>

            <!-- Custom Date Range -->
            <ng-container *ngSwitchCase="'custom'">
              <div class="filter-group">
                <label for="start-date">من تاريخ</label>
                <input type="date" id="start-date" [(ngModel)]="filterStartDate" (change)="onFilterChange()">
              </div>
              <div class="filter-group">
                <label for="end-date">إلى تاريخ</label>
                <input type="date" id="end-date" [(ngModel)]="filterEndDate" (change)="onFilterChange()">
              </div>
            </ng-container>

          </ng-container>

        </div>

        <!-- Action Buttons -->
        <div class="actions-container">
          <button class="btn btn-secondary" (click)="printAccountantSheet()" [disabled]="getSelectedCount() === 0">
             📊 طباعة شيت الحسابات للمحاسب ({{ getSelectedCount() }})
          </button>
          <button class="btn btn-primary" (click)="printSelected()" [disabled]="getSelectedCount() === 0">
             🖨️ طباعة كشوفات المحدد المختارين ({{ getSelectedCount() }})
          </button>
        </div>
      </div>

      <!-- Advance Payments Tracker Card (Screen only) -->
      <div class="card glass-card advance-tracker animate-spring">
        <div class="card-glow"></div>
        <div class="tracker-header">
          <span class="icon">💎</span>
          <div class="tracker-title-wrap">
            <h2>متابعة سداد مقدمات الأعضاء</h2>
            <p>مراقبة حية للأعضاء الذين سددوا دفعة المقدم المطلوبة</p>
          </div>
          <div class="tracker-counter">
            <span class="numerator">{{ getAdvancePaidCount() }}</span>
            <span class="divider">/</span>
            <span class="denominator">{{ users.length }}</span>
            <span class="label">أعضاء</span>
          </div>
        </div>

        <div class="tracker-progress">
          <div class="progress-bar-fill" [style.width.%]="(getAdvancePaidCount() / (users.length || 1)) * 100"></div>
        </div>

        <div class="tracker-lists">
          <div class="tracker-column unpaid">
            <h3>⚠️ لم يسددوا المقدم بعد ({{ users.length - getAdvancePaidCount() }})</h3>
            <div class="unpaid-users-scroll">
              <div class="user-strip-badge" *ngFor="let u of getUnpaidAdvanceUsers()">
                <span class="user-dot red"></span>
                <span class="name">{{ u.username }} <span *ngIf="u.member_code" style="font-size: 0.75rem; color: var(--primary); font-weight: 800;">({{ u.member_code }})</span></span>
                <span class="badge-mini text-alert" [class.gold]="u.share_type === 'full'" [class.emerald]="u.share_type === 'half'" [class.purple]="u.share_type === 'custom'">
                  {{ u.share_type === 'full' ? 'كامل' : (u.share_type === 'half' ? 'نصف' : 'مخصص') }} (المتبقي: {{ getRemainingCashAdvance(u) }} جم | هدية: {{ u.gift || 0 }} جم)
                </span>
              </div>
              <div class="empty-list-text" *ngIf="users.length === getAdvancePaidCount()">
                🎉 ممتاز! الجميع قام بسداد دفعة المقدم.
              </div>
            </div>
          </div>

          <div class="tracker-column paid">
            <h3>✅ تم سداد المقدم ({{ getAdvancePaidCount() }})</h3>
            <div class="paid-users-scroll">
              <div class="user-strip-badge" *ngFor="let u of getPaidAdvanceUsers()">
                <span class="user-dot green"></span>
                <span class="name">{{ u.username }} <span *ngIf="u.member_code" style="font-size: 0.75rem; color: var(--primary); font-weight: 800;">({{ u.member_code }})</span></span>
                <span class="badge-mini" [class.gold]="u.share_type === 'full'" [class.emerald]="u.share_type === 'half'" [class.purple]="u.share_type === 'custom'">
                  {{ u.share_type === 'full' ? 'كامل' : (u.share_type === 'half' ? 'نصف' : 'مخصص') }} (تم السداد | هدية: {{ u.gift || 0 }} جم)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Screen Layout: Compact Summary Table -->
      <div class="table-section" *ngIf="userStatements.length > 0">
        <div class="table-header-row">
          <h2 class="section-title">ملخص نشاط الحسابات بالفترة: <span class="period-badge">{{ getPeriodLabel() }}</span></h2>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">
                  <input type="checkbox" [checked]="isAllSelected()" (change)="toggleSelectAll($event)">
                </th>
                <th>المساهم</th>
                <th>نوع السهم</th>
                <th>المقدم</th>
                <th>الهدية</th>
                <th>مدفوعات الفترة</th>
                <th>وزن الذهب بالفترة</th>
                <th>المدفوع الكلي</th>
                <th>المتبقي الكلي</th>
                <th style="width: 180px;">العمليات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of pagedStatements">
                <td>
                  <input type="checkbox" [(ngModel)]="row.selected" (change)="cdr.markForCheck()">
                </td>
                <td>
                  <div class="user-cell">
                    <span class="user-name">
                      {{ row.user.username }}
                      <span *ngIf="row.user.member_code" style="font-size: 0.75rem; color: var(--primary); font-weight: 800; margin-right: 0.25rem;">
                        ({{ row.user.member_code }})
                      </span>
                    </span>
                    <span class="user-email">{{ row.user.email }}</span>
                  </div>
                </td>
                <td>
                  <span class="share-badge" [class.gold]="row.user.share_type === 'full'" [class.emerald]="row.user.share_type === 'half'" [class.purple]="row.user.share_type === 'custom'">
                    {{ row.user.share_type === 'full' ? 'سهم كامل' : (row.user.share_type === 'half' ? 'نصف سهم' : 'سهم مخصص') }}
                  </span>
                </td>
                <td class="font-bold text-accent">{{ row.user.advance }} جم</td>
                <td class="font-bold text-warning">{{ row.user.gift || 0 }} جم</td>
                <td class="font-bold text-accent">{{ row.totalAmount | number:'1.0-2' }} ج.م</td>
                <td class="font-bold text-gradient-gold">{{ row.totalGrams | number:'1.0-3' }} جرام</td>
                <td>{{ row.overallPaid | number:'1.0-2' }} ج.م</td>
                <td class="text-alert">{{ row.overallRemaining | number:'1.0-2' }} ج.م</td>
                <td>
                  <div class="action-buttons-cell">
                    <button class="btn-action btn-view" (click)="viewStatementDetails(row)" title="معاينة كشف الحساب">👁️ معاينة</button>
                    <button class="btn-action btn-print" (click)="printSingle(row)" title="طباعة كشف الحساب">🖨️ طباعة</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card Layout (visible only on ≤576px via CSS) -->
        <div class="mobile-cards-list">
          <div class="mobile-user-card" *ngFor="let row of pagedStatements">
            <div class="mc-header">
              <input class="mc-checkbox" type="checkbox" [(ngModel)]="row.selected" (change)="cdr.markForCheck()">
              <div class="mc-user">
                <div class="mc-name">
                  {{ row.user.username }}
                  <span *ngIf="row.user.member_code" style="font-size: 0.75rem; color: var(--primary); font-weight: 800; margin-right: 0.25rem;">
                    ({{ row.user.member_code }})
                  </span>
                </div>
                <div class="mc-email">{{ row.user.email }}</div>
              </div>
              <span class="share-badge" [class.gold]="row.user.share_type === 'full'" [class.emerald]="row.user.share_type === 'half'" [class.purple]="row.user.share_type === 'custom'">
                {{ row.user.share_type === 'full' ? 'كامل' : (row.user.share_type === 'half' ? 'نصف' : 'مخصص') }}
              </span>
            </div>
            <div class="mc-stats-grid">
              <div class="mc-stat">
                <div class="mc-stat-label">المقدم</div>
                <div class="mc-stat-value text-accent">{{ row.user.advance }} جم</div>
              </div>
              <div class="mc-stat">
                <div class="mc-stat-label">الهدية</div>
                <div class="mc-stat-value text-warning">{{ row.user.gift || 0 }} جم</div>
              </div>
              <div class="mc-stat">
                <div class="mc-stat-label">مدفوعات الفترة</div>
                <div class="mc-stat-value text-accent">{{ row.totalAmount | number:'1.0-2' }} ج.م</div>
              </div>
              <div class="mc-stat">
                <div class="mc-stat-label">وزن الفترة</div>
                <div class="mc-stat-value text-gradient-gold">{{ row.totalGrams | number:'1.0-3' }} جم</div>
              </div>
              <div class="mc-stat">
                <div class="mc-stat-label">المدفوع الكلي</div>
                <div class="mc-stat-value">{{ row.overallPaid | number:'1.0-2' }} ج.م</div>
              </div>
              <div class="mc-stat">
                <div class="mc-stat-label">المتبقي الكلي</div>
                <div class="mc-stat-value text-alert">{{ row.overallRemaining | number:'1.0-2' }} ج.م</div>
              </div>
            </div>
            <div class="mc-actions">
              <button class="btn-action btn-view" (click)="viewStatementDetails(row)">👁️ معاينة</button>
              <button class="btn-action btn-print" (click)="printSingle(row)">🖨️ طباعة</button>
            </div>
          </div>
        </div>

        <!-- Pagination Controls -->
        <div class="pagination-container" *ngIf="totalPages > 1">
          <button class="btn-page" [disabled]="currentPage === 1" (click)="goToPage(currentPage - 1)">« السابق</button>
          <span class="page-indicator">صفحة {{ currentPage }} من {{ totalPages }}</span>
          <button class="btn-page" [disabled]="currentPage === totalPages" (click)="goToPage(currentPage + 1)">التالي »</button>
        </div>
      </div>


      <!-- No Data State -->
      <div class="card glass-card empty-state" *ngIf="userStatements.length === 0">
        <span class="empty-icon">📂</span>
        <h3>لا توجد كشوفات حساب لعرضها</h3>
        <p>قم بتغيير خيارات الفلترة أو تأكد من وجود معاملات للمساهمين في الفترة المحددة.</p>
      </div>
    </div>

    <!-- On-Screen Interactive Preview Modal -->
    <div class="modal-backdrop" *ngIf="previewStatement" (click)="closePreviewModal()">
      <div class="modal-card card glass-card animate-spring" (click)="$event.stopPropagation()">
        <button class="close-modal-btn" (click)="closePreviewModal()">×</button>
        
        <div class="modal-header">
          <h2>⚜️ معاينة كشف الحساب التفصيلي</h2>
        </div>

        <div class="modal-body scrollable-content">
          <div class="modal-statement-sheet">
            <!-- Header -->
            <div class="statement-print-header">
              <div class="logo-and-name">
                <span class="gold-seal">⚜️</span>
                <div class="society-details">
                  <h2>جمعية الذهب المشترك الاستثمارية</h2>
                  <p>كشف حساب مالي وتفصيلي</p>
                </div>
              </div>
              <div class="statement-meta">
                <p><strong>تاريخ المعاينة:</strong> {{ currentDate | date:'yyyy-MM-dd HH:mm':'Africa/Cairo' }}</p>
                <p><strong>الفترة المحددة:</strong> {{ getPeriodLabel() }}</p>
              </div>
            </div>

            <div class="divider"></div>

            <!-- User Info Grid -->
            <div class="shareholder-info-section">
              <h3 class="info-title">👤 بيانات المساهم</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">اسم المساهم:</span>
                  <span class="value font-bold">
                    {{ previewStatement.user.username }}
                    <span *ngIf="previewStatement.user.member_code" style="color: var(--primary); font-weight: 800; margin-right: 0.25rem;">
                      ({{ previewStatement.user.member_code }})
                    </span>
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">البريد الإلكتروني:</span>
                  <span class="value">{{ previewStatement.user.email }}</span>
                </div>
                <div class="info-item">
                  <span class="label">نوع السهم / الاشتراك:</span>
                  <span class="value">
                    {{ previewStatement.user.share_type === 'full' ? 'سهم كامل' : (previewStatement.user.share_type === 'half' ? 'نصف سهم' : 'سهم مخصص') }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">تاريخ الانضمام:</span>
                  <span class="value">{{ previewStatement.user.created_at | date:'yyyy-MM-dd':'Africa/Cairo' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">مقدم السهم:</span>
                  <span class="value">{{ previewStatement.user.advance }} جم</span>
                </div>
                <div class="info-item">
                  <span class="label">الهدية المقدمة:</span>
                  <span class="value">{{ previewStatement.user.gift || 0 }} جم</span>
                </div>
              </div>
            </div>

            <!-- Stats -->
            <div class="financial-summary-section">
              <h3 class="info-title">📊 الخلاصة المالية للمساهم</h3>
              <div class="summary-cards">
                <div class="summary-mini-card period-card">
                  <h4>نشاط الفترة المحددة</h4>
                  <div class="summary-row">
                    <span>إجمالي المدفوع بالفترة:</span>
                    <span class="highlight-val">{{ previewStatement.totalAmount | number:'1.0-2' }} ج.م</span>
                  </div>
                  <div class="summary-row">
                    <span>إجمالي الوزن بالفترة:</span>
                    <span class="highlight-val">{{ previewStatement.totalGrams | number:'1.0-3' }} جرام</span>
                  </div>
                </div>

                <div class="summary-mini-card overall-card">
                  <h4>الحساب التراكمي الشامل</h4>
                  <div class="summary-row">
                    <span>المدفوع الإجمالي:</span>
                    <span class="highlight-val">{{ previewStatement.overallPaid | number:'1.0-2' }} ج.م</span>
                  </div>
                  <div class="summary-row">
                    <span>الرصيد الكلي بالذهب:</span>
                    <span class="highlight-val">{{ previewStatement.overallGrams | number:'1.0-3' }} جرام</span>
                  </div>
                  <div class="summary-row text-alert">
                    <span>المتبقي المطلوب:</span>
                    <span class="highlight-val-alert">{{ previewStatement.overallRemaining | number:'1.0-2' }} ج.م</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Table -->
            <div class="transactions-table-section">
              <h3 class="info-title">📜 المعاملات المعتمدة خلال هذه الفترة</h3>
              <div class="table-container-modal" *ngIf="previewStatement.transactions.length > 0; else noTxs">
                <table class="modal-table">
                  <thead>
                    <tr>
                      <th>رقم المعاملة</th>
                      <th>نوع الدفع</th>
                      <th>التاريخ والوقت</th>
                      <th>سعر جرام عيار 21 اليومي</th>
                      <th>الوزن المشترى</th>
                      <th>المبلغ المدفوع</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let tx of previewStatement.transactions">
                      <td><code class="tx-num">{{ tx.transaction_number || 'N/A' }}</code></td>
                      <td>
                        <span class="badge-type" [class.advance]="tx.payment_type === 'advance'" [class.normal]="tx.payment_type !== 'advance'">
                          {{ tx.payment_type === 'advance' ? '💎 مقدم' : (tx.payment_period === '3_months' ? '📈 3 شهور' : '📈 دفع شهر') }}
                        </span>
                      </td>
                      <td>{{ tx.created_at | date:'yyyy-MM-dd HH:mm':'Africa/Cairo' }}</td>
                      <td>{{ tx.gram_price | number:'1.0-0' }} ج.م</td>
                      <td class="font-bold text-gradient-gold">{{ tx.grams }} جرام</td>
                      <td class="font-bold text-accent">{{ tx.amount | number:'1.0-2' }} ج.م</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <ng-template #noTxs>
                <div class="no-tx-box">
                  <p>لم يتم تسجيل أي معاملات شراء أو سداد معتمدة للمساهم خلال هذه الفترة المحددة.</p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" (click)="printSingle(previewStatement)">🖨️ طباعة هذا الكشف</button>
          <button class="btn btn-glass" (click)="closePreviewModal()">إغلاق المعاينة</button>
        </div>
      </div>
    </div>

    <!-- Printable Statements Container (invisible on screen, visible during browser printing) -->
    <div class="statements-print-container" *ngIf="!printModeAccountant">
      <ng-container *ngIf="printModeSingle && singlePrintStatement; else printChecked">
        <!-- Print Single User -->
        <ng-container *ngTemplateOutlet="printTemplate; context: { $implicit: singlePrintStatement }"></ng-container>
      </ng-container>
      <ng-template #printChecked>
        <!-- Print All Selected Users -->
        <ng-container *ngFor="let statement of userStatements">
          <ng-container *ngIf="statement.selected">
            <ng-container *ngTemplateOutlet="printTemplate; context: { $implicit: statement }"></ng-container>
          </ng-container>
        </ng-container>
      </ng-template>
    </div>

    <!-- Printable Accountant Sheet Container (invisible on screen, visible during accountant print) -->
    <div class="accountant-print-container" *ngIf="printModeAccountant">
      <div class="accountant-sheet">
        <!-- Official Print Header -->
        <div class="statement-print-header">
          <div class="logo-and-name">
            <span class="gold-seal">⚜️</span>
            <div class="society-details">
              <h2>جمعية الذهب المشترك الاستثمارية</h2>
              <p>شيت الحسابات المالي الموحد - عرض المحاسب</p>
            </div>
          </div>
          <div class="statement-meta">
            <p><strong>تاريخ الطباعة:</strong> {{ currentDate | date:'yyyy-MM-dd HH:mm':'Africa/Cairo' }}</p>
            <p><strong>الدورة الزمنية:</strong> {{ getPeriodLabel() }}</p>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Association Gold Target Summary (At the top of accountant sheet) -->
        <div class="print-association-summary">
          <div class="summary-box-item required">
            <span class="label">إجمالي الجرامات المطلوبة للوصول (المستهدف)</span>
            <span class="value">{{ associationTotalRequired | number:'1.0-3' }} <small>جم</small></span>
          </div>
          <div class="summary-box-item collected">
            <span class="label">إجمالي الجرامات التي تم جمعها</span>
            <span class="value">{{ associationTotalCollected | number:'1.0-3' }} <small>جم</small></span>
          </div>
          <div class="summary-box-item remaining">
            <span class="label">إجمالي الجرامات المتبقية الكلية</span>
            <span class="value">{{ associationTotalRemaining | number:'1.0-3' }} <small>جم</small></span>
          </div>
        </div>

        <!-- Ledger Table -->
        <div class="table-container-print">
          <table class="print-table accountant-table">
            <thead>
              <tr>
                <th>اسم المساهم</th>
                <th>نوع السهم</th>
                <th>دفع المقدم؟</th>
                <th>حالة الاستلام</th>
                <th>الجرامات المدفوعة</th>
                <th>الجرامات المتبقية</th>
                <th>مدفوعات الفترة (ج.م)</th>
                <th>وزن الذهب بالفترة (جم)</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let row of userStatements">
                <tr *ngIf="row.selected">
                   <td class="font-bold">
                     <div>{{ row.user.username }} <span *ngIf="row.user.member_code" style="font-size: 8pt; font-weight: 800; color: var(--primary);">({{ row.user.member_code }})</span></div>
                     <div style="font-size: 8pt; font-weight: normal; color: #444;">
                       المقدم: {{ row.user.advance }} جم | الهدية: {{ row.user.gift || 0 }} جم
                     </div>
                   </td>
                  <td>{{ row.user.share_type === 'full' ? 'سهم كامل' : (row.user.share_type === 'half' ? 'نصف سهم' : 'سهم مخصص') }}</td>
                  <td class="font-bold">
                    {{ hasPaidAdvance(row) ? '🟢 نعم' : '🔴 لا' }}
                  </td>
                  <td class="font-bold">
                    {{ row.user.isReceived ? '🟢 تم الاستلام' : '🔴 لم يستلم' }}
                  </td>
                  <td class="font-bold">{{ row.user.paid | number:'1.0-3' }} جم</td>
                  <td class="font-bold text-danger">{{ row.user.remaining }} جم</td>
                  <td>{{ row.totalAmount | number:'1.0-2' }} ج.م</td>
                  <td>{{ row.totalGrams | number:'1.0-3' }} جرام</td>
                </tr>
              </ng-container>
              <!-- Totals Row -->
              <tr class="totals-row">
                <td colspan="4" class="font-bold">الإجمالي المجموع للأعضاء المحددين</td>
                <td class="font-bold">{{ getSelectedTotalPaidGrams() | number:'1.0-3' }} جم</td>
                <td class="font-bold text-danger">{{ getSelectedTotalRemainingGrams() | number:'1.0-2' }} جم</td>
                <td class="font-bold">{{ getSelectedTotalAmount() | number:'1.0-2' }} ج.م</td>
                <td class="font-bold">{{ getSelectedTotalGrams() | number:'1.0-3' }} جرام</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Auditor Signature Area -->
        <div class="print-signatures-area accountant-sig">
          <div class="signature-box">
            <p>إعداد المحاسب</p>
            <div class="sig-line"></div>
          </div>
          <div class="signature-box">
            <p>مراجعة المشرف العام</p>
            <div class="sig-line"></div>
          </div>
          <div class="signature-box">
            <p>اعتماد رئيس مجلس الإدارة</p>
            <div class="sig-line"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reusable Template for Printing individual member sheets -->
    <ng-template #printTemplate let-statement>
      <div class="statement-sheet">
        <!-- Official Print Header -->
        <div class="statement-print-header">
          <div class="logo-and-name">
            <span class="gold-seal">⚜️</span>
            <div class="society-details">
              <h2>جمعية الذهب المشترك الاستثمارية</h2>
              <p>كشف حساب مالي وتفصيلي للمساهم</p>
            </div>
          </div>
          <div class="statement-meta">
            <p><strong>تاريخ الطباعة:</strong> {{ currentDate | date:'yyyy-MM-dd HH:mm':'Africa/Cairo' }}</p>
            <p><strong>الدورة الزمنية:</strong> {{ getPeriodLabel() }}</p>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Shareholder Info Grid -->
        <div class="shareholder-info-section">
          <h3 class="info-title">👤 بيانات المساهم</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">اسم المساهم:</span>
              <span class="value font-bold">{{ statement.user.username }} <span *ngIf="statement.user.member_code" style="font-size: 0.95rem; font-weight: 800; color: var(--primary);">({{ statement.user.member_code }})</span></span>
            </div>
            <div class="info-item">
              <span class="label">البريد الإلكتروني:</span>
              <span class="value">{{ statement.user.email }}</span>
            </div>
            <div class="info-item">
              <span class="label">نوع السهم / الاشتراك:</span>
              <span class="value">
                {{ statement.user.share_type === 'full' ? 'سهم كامل' : (statement.user.share_type === 'half' ? 'نصف سهم' : 'سهم مخصص') }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">تاريخ الانضمام:</span>
              <span class="value">{{ statement.user.created_at | date:'yyyy-MM-dd':'Africa/Cairo' }}</span>
            </div>
            <div class="info-item">
              <span class="label">مقدم السهم:</span>
              <span class="value">{{ statement.user.advance }} جم</span>
            </div>
            <div class="info-item">
              <span class="label">الهدية المقدمة:</span>
              <span class="value">{{ statement.user.gift || 0 }} جم</span>
            </div>
          </div>
        </div>

        <!-- Financial Summary Grid -->
        <div class="financial-summary-section">
          <h3 class="info-title">📊 الخلاصة المالية للمساهم</h3>
          <div class="summary-cards">
            <!-- Period Specific Summary -->
            <div class="summary-mini-card period-card">
              <h4>نشاط الفترة المحددة</h4>
              <div class="summary-row">
                <span>إجمالي المدفوع:</span>
                <span class="highlight-val">{{ statement.totalAmount | number:'1.0-2' }} ج.م</span>
              </div>
              <div class="summary-row">
                <span>إجمالي الوزن المشترى:</span>
                <span class="highlight-val">{{ statement.totalGrams | number:'1.0-3' }} جرام</span>
              </div>
            </div>

            <!-- Overall Summary -->
            <div class="summary-mini-card overall-card">
              <h4>الحساب التراكمي الشامل</h4>
              <div class="summary-row">
                <span>المدفوع الإجمالي:</span>
                <span class="highlight-val">{{ statement.overallPaid | number:'1.0-2' }} ج.م</span>
              </div>
              <div class="summary-row">
                <span>الرصيد الكلي بالذهب:</span>
                <span class="highlight-val">{{ statement.overallGrams | number:'1.0-3' }} جرام</span>
              </div>
              <div class="summary-row text-alert">
                <span>المتبقي المطلوب:</span>
                <span class="highlight-val">{{ statement.overallRemaining | number:'1.0-2' }} ج.م</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Transactions Details Table -->
        <div class="transactions-table-section">
          <h3 class="info-title">📜 المعاملات المعتمدة خلال هذه الفترة</h3>
          
          <div class="table-container-print" *ngIf="statement.transactions.length > 0; else noTransactions">
            <table class="print-table">
              <thead>
                <tr>
                  <th>رقم المعاملة</th>
                  <th>نوع الدفع</th>
                  <th>التاريخ والوقت</th>
                  <th>سعر جرام عيار 21 اليومي</th>
                  <th>الوزن المشترى</th>
                  <th>المبلغ المدفوع</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tx of statement.transactions">
                  <td><code>{{ tx.transaction_number || 'N/A' }}</code></td>
                  <td>
                    <span class="badge-type" [class.advance]="tx.payment_type === 'advance'" [class.normal]="tx.payment_type !== 'advance'">
                      {{ tx.payment_type === 'advance' ? '💎 مقدم' : (tx.payment_period === '3_months' ? '📈 3 شهور' : '📈 دفع شهر') }}
                    </span>
                  </td>
                  <td>{{ tx.created_at | date:'yyyy-MM-dd HH:mm':'Africa/Cairo' }}</td>
                  <td>{{ tx.gram_price | number:'1.0-0' }} ج.م</td>
                  <td class="font-bold">{{ tx.grams }} جرام</td>
                  <td class="font-bold">{{ tx.amount | number:'1.0-2' }} ج.م</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <ng-template #noTransactions>
            <div class="no-tx-box">
              <p>لم يتم تسجيل أي معاملات شراء أو سداد معتمدة للمساهم خلال هذه الفترة المحددة.</p>
            </div>
          </ng-template>
        </div>

        <!-- Print Signature Fields -->
        <div class="print-signatures-area">
          <div class="signature-box">
            <p>توقيع المساهم</p>
            <div class="sig-line"></div>
          </div>
          <div class="signature-box">
            <p>توقيع وختم الإدارة المسؤول</p>
            <div class="sig-line"></div>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .reports-page {
      padding: 1.5rem 0;
    }
    .page-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 1.05rem;
      margin-top: 0.65rem;
      max-width: 650px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.6;
    }

    .filter-panel {
      padding: 2.5rem;
      border-radius: 30px;
      margin-bottom: 2.5rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(212, 175, 55, 0.12);
    }
    
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;

      label {
        font-weight: 800;
        color: var(--primary);
        font-size: 0.95rem;
        cursor: pointer;
        text-shadow: 0 0 10px rgba(212, 175, 55, 0.1);
      }
      
      .hint-text {
        font-size: 0.78rem;
        color: var(--text-muted);
        line-height: 1.4;
        margin-top: 0.2rem;
      }
    }

    .actions-container {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .table-section {
      margin-bottom: 3rem;
    }

    .table-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 1.3rem;
      font-weight: 800;
      color: #fff;
    }
    
    .period-badge {
      color: var(--primary);
      text-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
    }

    /* User Row layout on Screen */
    .user-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      
      .user-name {
        font-weight: 800;
        color: #fff;
      }
      .user-email {
        font-size: 0.78rem;
        color: var(--text-muted);
      }
    }

    .share-badge {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 0.3rem 0.6rem;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #fff;
    }

    .action-buttons-cell {
      display: flex;
      gap: 0.5rem;
    }

    .btn-action {
      padding: 0.5rem 0.85rem;
      font-size: 0.82rem;
      font-weight: 700;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.2s ease;
      
      &.btn-view {
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.1);
        
        &:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
        }
      }
      
      &.btn-print {
        background: rgba(212, 175, 55, 0.12);
        color: var(--primary);
        border: 1px solid rgba(212, 175, 55, 0.25);
        
        &:hover {
          background: rgba(212, 175, 55, 0.22);
          transform: translateY(-2px);
        }
      }
    }

    /* Screen Pagination styles */
    .pagination-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .btn-page {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #fff;
      padding: 0.5rem 1rem;
      font-size: 0.88rem;
      font-weight: 700;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        background: rgba(212, 175, 55, 0.12);
        border-color: var(--primary);
        color: var(--primary);
      }
      
      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }
    
    .page-indicator {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      border-radius: 30px;
      border: 1px dashed rgba(255, 255, 255, 0.1);
      
      .empty-icon {
        font-size: 3.5rem;
        display: block;
        margin-bottom: 1rem;
      }
      h3 {
        font-size: 1.4rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
        color: #fff;
      }
      p {
        color: var(--text-muted);
        font-size: 0.95rem;
        max-width: 450px;
        margin: 0 auto;
        line-height: 1.6;
      }
    }

    /* On Screen Modal Styling */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1050;
      padding: 2rem 1rem;
    }
    
    .modal-card {
      width: 100%;
      max-width: 850px;
      max-height: 90vh;
      border-radius: 35px;
      border: 1px solid rgba(212, 175, 55, 0.25);
      background: rgba(15, 23, 42, 0.95);
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      padding: 2rem !important;
      position: relative;
      overflow: hidden;
    }
    
    .close-modal-btn {
      position: absolute;
      top: 1.25rem;
      right: 1.25rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #fff;
      font-size: 1.6rem;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 10;
      
      &:hover {
        background: #dc2626;
        color: #fff;
        border-color: #dc2626;
      }
    }
    
    .modal-header {
      margin-bottom: 1.5rem;
      h2 {
        font-size: 1.4rem;
        font-weight: 900;
        color: var(--primary);
        text-shadow: 0 0 10px rgba(212, 175, 55, 0.15);
      }
    }
    
    .scrollable-content {
      flex: 1;
      overflow-y: auto;
      padding-right: 0.5rem;
      margin-bottom: 1.5rem;
      scrollbar-width: thin;
      scrollbar-color: rgba(212, 175, 55, 0.2) transparent;
      
      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background: rgba(212, 175, 55, 0.2);
        border-radius: 10px;
      }
    }

    .modal-statement-sheet {
      padding: 1rem 0;
    }

    /* Statement structure (used inside modal preview) */
    .statement-print-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
      
      .logo-and-name {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .gold-seal {
        font-size: 2.2rem;
        filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.4));
      }
      .society-details {
        h2 {
          font-family: 'Amiri', serif;
          font-size: 1.5rem;
          color: var(--primary);
          margin-bottom: 0.1rem;
        }
        p {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
      }
      .statement-meta {
        text-align: left;
        font-size: 0.82rem;
        color: var(--text-muted);
        line-height: 1.5;
        
        strong {
          color: #fff;
        }
      }
    }

    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent);
      margin: 1.5rem 0;
    }

    .info-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 1rem;
      border-right: 3px solid var(--primary);
      padding-right: 0.6rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      background: rgba(255, 255, 255, 0.01);
      padding: 1.25rem;
      border-radius: 18px;
      border: 1px solid rgba(255, 255, 255, 0.03);
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      
      .label {
        font-size: 0.78rem;
        color: var(--text-muted);
      }
      .value {
        font-size: 0.95rem;
        color: #fff;
        font-weight: 700;
      }
      .font-bold {
        font-weight: 900;
      }
    }

    .financial-summary-section {
      margin-top: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
    }

    .summary-mini-card {
      padding: 1.25rem;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      
      h4 {
        font-size: 0.9rem;
        font-weight: 800;
        margin-bottom: 0.75rem;
        color: #fff;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        padding-bottom: 0.4rem;
      }
      
      &.period-card {
        background: rgba(212, 175, 55, 0.02);
        border-color: rgba(212, 175, 55, 0.1);
        h4 { color: var(--primary); }
      }
      
      &.overall-card {
        background: rgba(16, 185, 129, 0.02);
        border-color: rgba(16, 185, 129, 0.1);
        h4 { color: var(--accent); }
      }
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.6rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .highlight-val {
        font-size: 1rem;
        font-weight: 800;
        color: #fff;
      }
      .highlight-val-alert {
        font-size: 1rem;
        font-weight: 800;
        color: #ef4444;
      }
    }

    .table-container-modal {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 18px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      max-height: 250px;
      overflow-y: auto;
    }

    .modal-table {
      width: 100%;
      border-collapse: collapse;
      
      th {
        position: sticky;
        top: 0;
        background: #0f172a;
        color: var(--primary);
        font-size: 0.8rem;
        font-weight: 800;
        padding: 0.85rem;
        text-align: right;
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }
      
      td {
        padding: 0.85rem;
        font-size: 0.82rem;
        color: #fff;
        border-bottom: 1px solid rgba(255,255,255,0.03);
      }
    }

    .no-tx-box {
      background: rgba(255,255,255,0.01);
      border: 1px dashed rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 1.5rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .tx-num {
      background: rgba(255,255,255,0.06);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: monospace;
      color: var(--primary);
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
      
      .period-text {
        font-size: 0.75rem;
        opacity: 0.8;
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    /* Screen-specific: Hide the printable containers entirely */
    .statements-print-container, .accountant-print-container {
      display: none;
    }

    /* ----------------------------------------------------
       PRINTING MEDIA QUERIES
       ---------------------------------------------------- */
    @media print {
      @page {
        size: A4;
        margin: 2mm !important;
      }

      /* 1. Global Reset & Overflows to permit multi-page scroll */
      html, body {
        background: #fff !important;
        color: #000 !important;
        overflow: visible !important;
        height: auto !important;
        width: 100% !important;
        font-size: 10pt !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* 2. Hide all interactive screen elements completely */
      .no-print, app-navbar, app-sidebar, .sidebar, .sidebar-overlay, .navbar, .reports-page, .modal-backdrop {
        display: none !important;
      }
      
      /* 3. Strip layout structures of flex, fixed, and scroll restrictions */
      .layout-wrapper, .main-container, main, .content-area {
        display: block !important;
        position: static !important;
        overflow: visible !important;
        height: auto !important;
        min-height: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        background: #fff !important;
        box-shadow: none !important;
      }

      /* 4. Force Show the relevant Printable Container */
      .statements-print-container {
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        height: auto !important;
        width: 100% !important;
      }

      .accountant-print-container {
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        height: auto !important;
        width: 100% !important;
      }
      
      /* 5. Printable sheet styling (Standard A4 page specs) */
      .statement-sheet, .accountant-sheet {
        background: #fff !important;
        color: #000 !important;
        border: 2px solid #000 !important;
        border-radius: 0 !important;
        padding: 4mm 6mm !important;
        margin: 0 auto !important;
        box-shadow: none !important;
        display: block !important;
        overflow: visible !important;
        box-sizing: border-box !important;
        width: 100% !important;
      }

      .statement-sheet {
        page-break-after: always !important; /* Forces each shareholder statement onto a new page */
        min-height: 285mm !important; /* Adjusted safe height to fit on a single A4 page with default browser margins */
      }
      
      .statement-sheet:last-child {
        page-break-after: avoid !important;
      }

      /* Accountant specific sheet */
      .accountant-sheet {
        page-break-after: avoid !important;
        min-height: 285mm !important; /* Adjusted safe height */
      }

      .statement-print-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        
        .logo-and-name {
          display: flex !important;
          align-items: center !important;
          gap: 15px !important;
        }
        
        .gold-seal {
          color: #000 !important;
          filter: none !important;
          font-size: 24pt !important;
        }
        .society-details h2 {
          color: #000 !important;
          font-size: 18pt !important;
          margin: 0 !important;
        }
        .society-details p {
          color: #444 !important;
          margin: 2px 0 0 0 !important;
        }
        .statement-meta {
          text-align: left !important;
          font-size: 9pt !important;
          color: #333 !important;
          line-height: 1.4 !important;
          
          strong {
            color: #000 !important;
          }
        }
      }

      .divider {
        background: #000 !important;
        height: 1.5px !important;
        margin: 10px 0 !important;
      }

      .info-title {
        color: #000 !important;
        border-right: 3px solid #000 !important;
        font-size: 12pt !important;
        padding-right: 8px !important;
        margin-bottom: 8px !important;
      }

      .info-grid {
        background: transparent !important;
        border: 1px solid #000 !important;
        border-radius: 0 !important;
        padding: 8px !important;
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 8px !important;
      }

      .info-item {
        .label {
          color: #333 !important;
          font-size: 8pt !important;
        }
        .value {
          color: #000 !important;
          font-size: 9.5pt !important;
        }
      }

      .summary-cards {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 15px !important;
      }

      .summary-mini-card {
        border: 1px solid #000 !important;
        background: transparent !important;
        border-radius: 0 !important;
        padding: 10px !important;
        
        h4 {
          color: #000 !important;
          border-bottom: 1.5px solid #000 !important;
          font-size: 10pt !important;
          padding-bottom: 3px !important;
          margin-bottom: 8px !important;
        }
        
        .highlight-val {
          color: #000 !important;
          font-size: 10.5pt !important;
        }
      }

      .summary-row {
        font-size: 8.5pt !important;
        color: #333 !important;
        margin-bottom: 5px !important;
      }

      .summary-row.text-alert, .summary-row.text-alert .highlight-val {
        color: #000 !important;
      }

      .badge-type {
        border: none !important;
        background: transparent !important;
        color: #000 !important;
        padding: 0 !important;
        font-weight: bold !important;
      }

      .table-container-print {
        display: block !important;
        background: transparent !important;
        border: none !important;
        overflow: visible !important;
      }

      .print-table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin-top: 5px !important;
        
        th {
          border: 1px solid #000 !important;
          color: #000 !important;
          padding: 6px !important;
          font-size: 9pt !important;
          background: #e6e6e6 !important;
          text-align: right !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        tr td {
          background: transparent !important;
          border: 1px solid #ccc !important;
          padding: 6px !important;
          font-size: 9pt !important;
          color: #000 !important;
          border-radius: 0 !important;
          
          code {
            background: transparent !important;
            padding: 0 !important;
            color: #000 !important;
            font-family: monospace;
          }
        }
      }

      /* Accountant specific double border for totals row */
      .totals-row td {
        border-top: 2px double #000 !important;
        border-bottom: 2px solid #000 !important;
        font-weight: bold !important;
        background: #f0f0f0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .no-tx-box {
        background: transparent !important;
        border: 1px dashed #000 !important;
        border-radius: 0 !important;
        color: #000 !important;
        padding: 15px !important;
        font-size: 9pt !important;
      }

      /* 6. Signature block positioned at page bottom */
      .print-signatures-area {
        display: flex !important;
        justify-content: space-between !important;
        margin-top: 15mm !important;
        padding: 0 10mm !important;
        page-break-inside: avoid !important;
        
        .signature-box {
          text-align: center !important;
          width: 55mm !important;
          font-size: 9.5pt !important;
          
          p {
            font-weight: bold !important;
            margin: 0 0 12mm 0 !important;
          }
          
          .sig-line {
            border-top: 1px dashed #000 !important;
            width: 100% !important;
          }
        }
      }

      .accountant-sig {
        margin-top: 10mm !important;
        .signature-box {
          width: 48mm !important;
        }
      }
    }

    /* Mobile card list: hidden by default, visible only via 576px query */
    .mobile-cards-list { display: none; }

    /* =============================================
       TABLE CONTAINER (Screen)
    ============================================= */
    .table-container {
      width: 100%;
      overflow-x: auto;
      border-radius: 20px;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(212, 175, 55, 0.1);
      -webkit-overflow-scrolling: touch;

      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 860px;

        th {
          position: sticky;
          top: 0;
          background: rgba(10, 15, 30, 0.98);
          color: var(--primary);
          font-size: 0.82rem;
          font-weight: 800;
          padding: 1rem 0.85rem;
          text-align: right;
          white-space: nowrap;
          border-bottom: 1px solid rgba(212, 175, 55, 0.15);
          z-index: 2;
        }

        td {
          padding: 0.9rem 0.85rem;
          font-size: 0.85rem;
          color: #e2e8f0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          vertical-align: middle;
        }

        tbody tr {
          transition: background 0.15s ease;
          &:hover {
            background: rgba(212, 175, 55, 0.04);
          }
          &:last-child td {
            border-bottom: none;
          }
        }
      }
    }

    /* =============================================
       RESPONSIVE — 768px (Tablet)
    ============================================= */
    @media (max-width: 768px) {
      .reports-page { padding: 1rem 0; }

      .page-header { margin-bottom: 1.5rem; }
      .subtitle { font-size: 0.92rem; }

      .filter-panel { padding: 1.5rem; border-radius: 20px; }
      .filters-grid { grid-template-columns: 1fr; gap: 1rem; margin-bottom: 1.5rem; }

      .actions-container {
        justify-content: stretch;
        flex-direction: column;
        gap: 0.75rem;
      }
      .actions-container button {
        width: 100%;
        justify-content: center;
        font-size: 0.88rem;
        position: relative;
        z-index: 5;
      }

      .table-header-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      .section-title { font-size: 1.1rem; }

      .action-buttons-cell {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .btn-action { padding: 0.45rem 0.7rem; font-size: 0.78rem; }

      .modal-card {
        padding: 1.25rem !important;
        border-radius: 22px;
        max-height: 95vh;
      }
      .modal-header h2 { font-size: 1.15rem; }
      .scrollable-content { max-height: 60vh; }

      .statement-print-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.75rem;
        .statement-meta { text-align: center; margin-top: 0.5rem; }
      }

      .info-grid { grid-template-columns: 1fr 1fr; gap: 0.75rem; padding: 1rem; }
      .summary-cards { grid-template-columns: 1fr; gap: 1rem; }

      .table-container-modal {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        .modal-table { min-width: 550px; }
      }

      .advance-tracker { padding: 1.5rem; border-radius: 22px; }
      .tracker-lists { grid-template-columns: 1fr; gap: 1.5rem; }

      .pagination-container { gap: 0.75rem; flex-wrap: wrap; }
      .btn-page { padding: 0.45rem 0.85rem; font-size: 0.82rem; }
    }

    /* =============================================
       RESPONSIVE — 576px (Mobile)
    ============================================= */
    @media (max-width: 576px) {
      .filter-panel { padding: 1rem; border-radius: 16px; margin-bottom: 1.5rem; }

      .page-header h1 { font-size: 1.4rem !important; }
      .subtitle { font-size: 0.85rem; }

      /* Hide the standard table on mobile & show card layout */
      .table-container {
        border-radius: 0;
        background: transparent;
        border: none;
        overflow: visible;

        table { display: none; }
      }

      /* Show mobile card list */
      .mobile-cards-list {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .mobile-user-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(212, 175, 55, 0.12);
        border-radius: 20px;
        padding: 1.1rem 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        transition: all 0.2s ease;

        &:active { transform: scale(0.985); }

        .mc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;

          .mc-checkbox { width: 20px; height: 20px; accent-color: var(--primary); }

          .mc-user {
            flex: 1;
            .mc-name { font-size: 0.98rem; font-weight: 800; color: #fff; }
            .mc-email { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
          }
        }

        .mc-badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .mc-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;

          .mc-stat {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 10px;
            padding: 0.5rem 0.75rem;

            .mc-stat-label {
              font-size: 0.68rem;
              color: var(--text-muted);
              margin-bottom: 0.15rem;
            }
            .mc-stat-value {
              font-size: 0.88rem;
              font-weight: 800;
              color: #fff;
            }
          }
        }

        .mc-actions {
          display: flex;
          gap: 0.5rem;
          .btn-action { flex: 1; justify-content: center; padding: 0.6rem; font-size: 0.82rem; }
        }
      }

      /* Modal full-screen on mobile */
      .modal-backdrop { padding: 0; align-items: flex-end; }
      .modal-card {
        border-radius: 28px 28px 0 0 !important;
        max-height: 92vh;
        width: 100% !important;
        max-width: 100% !important;
        padding: 1.25rem !important;
      }
      .close-modal-btn { top: 1rem; right: 1rem; }
      .modal-header { padding-right: 2.5rem; }
      .modal-header h2 { font-size: 1rem; }
      .scrollable-content { max-height: 62vh; padding-right: 0; }

      .info-grid { grid-template-columns: 1fr; gap: 0.5rem; }
      .summary-mini-card { padding: 0.9rem; }

      .table-container-modal {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        border-radius: 12px;
        .modal-table {
          min-width: 520px;
          th, td { padding: 0.6rem 0.75rem; font-size: 0.75rem; }
        }
      }

      .modal-footer {
        flex-direction: column;
        button { width: 100%; justify-content: center; }
      }

      /* Advance tracker */
      .advance-tracker { padding: 1rem; border-radius: 16px; }
      .tracker-lists { grid-template-columns: 1fr !important; gap: 1rem; }
      .tracker-header { gap: 0.75rem; }
      .tracker-counter { padding: 0.4rem 0.9rem; }

      /* Pagination */
      .pagination-container { gap: 0.5rem; }
      .btn-page { padding: 0.4rem 0.75rem; font-size: 0.8rem; }
      .page-indicator { font-size: 0.82rem; }

      /* Empty state */
      .empty-state { padding: 2.5rem 1rem; }
      .empty-state h3 { font-size: 1.1rem; }
    }

    /* Advance Tracker Styles */
    .advance-tracker {
      margin-bottom: 2.5rem;
      padding: 2.5rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(212, 175, 55, 0.15);
      border-radius: 30px;
      position: relative;
      overflow: hidden;

      .tracker-header {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;

        .icon {
          font-size: 2.2rem;
          background: rgba(212, 175, 55, 0.1);
          width: 60px;
          height: 60px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(212, 175, 55, 0.2);
          box-shadow: 0 8px 20px rgba(212, 175, 55, 0.05);
        }

        .tracker-title-wrap {
          flex: 1;
          min-width: 200px;
          h2 {
            font-size: 1.4rem;
            font-weight: 800;
            color: #fff;
            margin: 0 0 0.25rem 0;
            font-family: 'Tajawal', sans-serif;
          }
          p {
            font-size: 0.88rem;
            color: var(--text-muted);
            margin: 0;
          }
        }

        .tracker-counter {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 0.5rem 1.25rem;
          border-radius: 100px;

          .numerator {
            font-size: 1.5rem;
            font-weight: 900;
            color: var(--accent);
          }
          .divider {
            color: var(--text-muted);
            opacity: 0.5;
            font-size: 1.1rem;
          }
          .denominator {
            font-size: 1.1rem;
            font-weight: 800;
            color: #fff;
          }
          .label {
            font-size: 0.78rem;
            color: var(--text-muted);
            margin-right: 0.5rem;
            font-weight: 700;
          }
        }
      }

      .tracker-progress {
        height: 6px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        margin-bottom: 2rem;
        overflow: hidden;

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), var(--accent));
          border-radius: 10px;
          transition: width 0.8s ease;
        }
      }

      .tracker-lists {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
      }

      .tracker-column {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        h3 {
          font-size: 0.95rem;
          font-weight: 800;
          margin: 0;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        &.unpaid h3 { color: #ff4d4d; }
        &.paid h3 { color: var(--accent); }

        .unpaid-users-scroll, .paid-users-scroll {
          max-height: 200px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-right: 0.25rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.1) transparent;

          &::-webkit-scrollbar { width: 4px; }
          &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        }

        .user-strip-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          padding: 0.6rem 1rem;
          border-radius: 12px;
          transition: all 0.2s ease;

          &:hover {
            background: rgba(255, 255, 255, 0.04);
          }

          .user-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            &.red { background: #ff4d4d; box-shadow: 0 0 8px #ff4d4d; }
            &.green { background: var(--accent); box-shadow: 0 0 8px var(--accent); }
          }

          .name {
            font-size: 0.88rem;
            font-weight: 700;
            color: #fff;
            flex: 1;
          }

          .badge-mini {
            font-size: 0.7rem;
            font-weight: 800;
            padding: 0.2rem 0.5rem;
            border-radius: 6px;
            
            &.gold { background: rgba(212, 175, 55, 0.1); color: var(--primary); border: 1px solid rgba(212, 175, 55, 0.2); }
            &.emerald { background: rgba(16, 185, 129, 0.1); color: var(--accent); border: 1px solid rgba(16, 185, 129, 0.2); }
          }
        }

        .empty-list-text {
          font-size: 0.88rem;
          color: var(--text-muted);
          text-align: center;
          padding: 1.5rem;
          border: 1px dashed rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          background: rgba(16, 185, 129, 0.02);
          color: var(--accent);
          font-weight: 700;
        }
      }
    }

    @media print {
      .print-association-summary {
        display: flex !important;
        justify-content: space-between !important;
        gap: 15px !important;
        margin: 15px 0 !important;
        page-break-inside: avoid !important;
      }
      
      .summary-box-item {
        flex: 1 !important;
        border: 1.5px solid #000 !important;
        padding: 10px !important;
        text-align: center !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 5px !important;
        
        .label {
          font-size: 8.5pt !important;
          font-weight: bold !important;
          color: #333 !important;
        }
        .value {
          font-size: 13pt !important;
          font-weight: 900 !important;
          color: #000 !important;
          
          small {
            font-size: 9.5pt !important;
          }
        }
      }
    }
  `]
})
export class ReportsComponent implements OnInit {
  dataService = inject(DataService);
  cdr = inject(ChangeDetectorRef);

  users: any[] = [];
  allTransactions: any[] = [];
  userStatements: UserStatement[] = [];

  // Association Gold stats variables
  associationTotalRequired = 0;
  associationTotalCollected = 0;
  associationTotalRemaining = 0;

  // Filter States
  selectedUserId: string = 'all';
  periodType: string = 'monthly';
  
  // Date Fields
  filterDate: string = '';
  filterMonth: number = 0;
  filterYear: number = 0;
  filterStartDate: string = '';
  filterEndDate: string = '';

  currentDate = new Date();
  availableYears: number[] = [];

  // Pagination states
  currentPage: number = 1;
  pageSize: number = 10;

  // Modal screen preview state
  previewStatement: UserStatement | null = null;

  // Print mode states
  printModeSingle: boolean = false;
  singlePrintStatement: UserStatement | null = null;
  printModeAccountant: boolean = false;

  monthsList = [
    { value: 0, label: 'يناير (01)' },
    { value: 1, label: 'فبراير (02)' },
    { value: 2, label: 'مارس (03)' },
    { value: 3, label: 'أبريل (04)' },
    { value: 4, label: 'مايو (05)' },
    { value: 5, label: 'يونيو (06)' },
    { value: 6, label: 'يوليو (07)' },
    { value: 7, label: 'أغسطس (08)' },
    { value: 8, label: 'سبتمبر (09)' },
    { value: 9, label: 'أكتوبر (10)' },
    { value: 10, label: 'نوفمبر (11)' },
    { value: 11, label: 'ديسمبر (12)' }
  ];

  async ngOnInit() {
    this.currentDate = getCairoDate();
    
    // Initialize default dates
    this.filterMonth = this.currentDate.getMonth();
    this.filterYear = this.currentDate.getFullYear();
    
    const monthStr = String(this.filterMonth + 1).padStart(2, '0');
    const dayStr = String(this.currentDate.getDate()).padStart(2, '0');
    this.filterDate = `${this.filterYear}-${monthStr}-${dayStr}`;
    this.filterStartDate = `${this.filterYear}-${monthStr}-01`;
    this.filterEndDate = `${this.filterYear}-${monthStr}-${dayStr}`;

    await this.loadInitialData();
  }

  async loadInitialData() {
    const [usersRes, txsRes, settingsRes] = await Promise.all([
      this.dataService.getUsers(),
      this.dataService.getApprovedTransactions(),
      this.dataService.getAssociationSettings()
    ]);

    this.users = (usersRes.data || []).filter(u => u.role === 'user');
    this.allTransactions = txsRes.data || [];

    const settings = settingsRes.data;
    const fullTotal = settings ? Number(settings.full_share_total) : 31.5;
    const halfTotal = fullTotal / 2.0;

    // Calculate general association gold targets
    this.associationTotalRequired = this.users.reduce((sum, u) => {
      if (u.share_type === 'full') {
        return sum + fullTotal;
      } else if (u.share_type === 'half') {
        return sum + halfTotal;
      } else {
        return sum + (Number(u.remaining || 0) + Number(u.paid || 0) + Number(u.advance || 0));
      }
    }, 0);

    this.associationTotalCollected = this.allTransactions.reduce((sum, tx) => {
      return sum + Number(tx.grams || 0);
    }, 0);

    const rem = this.associationTotalRequired - this.associationTotalCollected;
    this.associationTotalRemaining = rem > 0 ? rem : 0;

    const currentYear = this.currentDate.getFullYear();
    const years = this.allTransactions.map(tx => getCairoDate(tx.created_at).getFullYear());
    this.availableYears = [...new Set([currentYear, ...years])].sort((a, b) => b - a);

    this.applyFilters();
  }

  onFilterChange() {
    this.currentPage = 1; // Reset to page 1
    this.applyFilters();
  }

  applyFilters() {
    this.userStatements = [];
    
    let targetUsers = [...this.users];
    if (this.selectedUserId !== 'all') {
      targetUsers = targetUsers.filter(u => u.id === this.selectedUserId);
    }
    
    let matchesPeriod = (txDate: Date): boolean => true;
    
    if (this.periodType === 'daily' && this.filterDate) {
      const target = getCairoDate(this.filterDate);
      matchesPeriod = (txDate) => {
        return txDate.getFullYear() === target.getFullYear() &&
               txDate.getMonth() === target.getMonth() &&
               txDate.getDate() === target.getDate();
      };
    } else if (this.periodType === 'weekly' && this.filterDate) {
      const target = getCairoDate(this.filterDate);
      const dayOfWeek = target.getDay();
      
      const diffToSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
      const startOfWeek = new Date(target);
      startOfWeek.setDate(target.getDate() - diffToSaturday);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      matchesPeriod = (txDate) => {
        return txDate >= startOfWeek && txDate <= endOfWeek;
      };
    } else if (this.periodType === 'monthly') {
      const year = Number(this.filterYear);
      const month = Number(this.filterMonth);
      matchesPeriod = (txDate) => {
        return txDate.getFullYear() === year && txDate.getMonth() === month;
      };
    } else if (this.periodType === 'yearly') {
      const year = Number(this.filterYear);
      matchesPeriod = (txDate) => {
        return txDate.getFullYear() === year;
      };
    } else if (this.periodType === 'custom' && this.filterStartDate && this.filterEndDate) {
      const start = getCairoDate(this.filterStartDate);
      start.setHours(0, 0, 0, 0);
      const end = getCairoDate(this.filterEndDate);
      end.setHours(23, 59, 59, 999);
      matchesPeriod = (txDate) => {
        return txDate >= start && txDate <= end;
      };
    }

    for (const u of targetUsers) {
      const userTxs = this.allTransactions.filter(tx => tx.user_id === u.id);
      
      const periodTxs = userTxs.filter(tx => {
        const txDate = getCairoDate(tx.created_at);
        return matchesPeriod(txDate);
      });
      
      // Include all members even if they have no transactions in the selected period
      
      const totalGrams = periodTxs.reduce((sum, tx) => sum + Number(tx.grams || 0), 0);
      const totalAmount = periodTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      
      const overallGrams = userTxs.reduce((sum, tx) => sum + Number(tx.grams || 0), 0);
      const overallPaid = userTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      
      this.userStatements.push({
        user: u,
        transactions: periodTxs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), // Newest first
        totalGrams,
        totalAmount,
        overallGrams,
        overallPaid,
        overallRemaining: Number(u.remaining),
        selected: true // Checked by default for easy bulk actions
      });
    }
    
    this.cdr.markForCheck();
  }

  getPeriodLabel(): string {
    switch (this.periodType) {
      case 'daily':
        return `يومي - تاريخ ${this.filterDate}`;
      case 'weekly':
        return `أسبوعي - الأسبوع المحتوي على ${this.filterDate}`;
      case 'monthly':
        const mLabel = this.monthsList.find(m => m.value === Number(this.filterMonth))?.label || '';
        return `شهري - ${mLabel} لسنة ${this.filterYear}`;
      case 'yearly':
        return `سنوي - سنة ${this.filterYear}`;
      case 'custom':
        return `فترة مخصصة - من ${this.filterStartDate} إلى ${this.filterEndDate}`;
      case 'all':
      default:
        return 'كل الأوقات';
    }
  }

  // --- Pagination Logic ---
  get pagedStatements(): UserStatement[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.userStatements.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.userStatements.length / this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.markForCheck();
    }
  }

  // --- Selection Logic ---
  isAllSelected(): boolean {
    if (this.userStatements.length === 0) return false;
    return this.userStatements.every(s => s.selected);
  }

  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    this.userStatements.forEach(s => s.selected = checked);
    this.cdr.markForCheck();
  }

  getSelectedCount(): number {
    return this.userStatements.filter(s => s.selected).length;
  }

  // --- Totals Calculation for Accountant Ledger Sheet ---
  getSelectedTotalAmount(): number {
    return this.userStatements.filter(s => s.selected).reduce((sum, s) => sum + s.totalAmount, 0);
  }

  getSelectedTotalGrams(): number {
    return this.userStatements.filter(s => s.selected).reduce((sum, s) => sum + s.totalGrams, 0);
  }

  getSelectedOverallPaid(): number {
    return this.userStatements.filter(s => s.selected).reduce((sum, s) => sum + s.overallPaid, 0);
  }

  getSelectedOverallGrams(): number {
    return this.userStatements.filter(s => s.selected).reduce((sum, s) => sum + s.overallGrams, 0);
  }

  getSelectedOverallRemaining(): number {
    return this.userStatements.filter(s => s.selected).reduce((sum, s) => sum + s.overallRemaining, 0);
  }

  // --- Modal Preview Logic ---
  viewStatementDetails(statement: UserStatement) {
    this.previewStatement = statement;
    this.cdr.markForCheck();
  }

  closePreviewModal() {
    this.previewStatement = null;
    this.cdr.markForCheck();
  }

  // --- Printing Logic ---
  printSelected() {
    this.printModeSingle = false;
    this.singlePrintStatement = null;
    this.printModeAccountant = false;
    this.cdr.detectChanges(); // Ensure the DOM is fully rendered before printing
    setTimeout(() => {
      window.print();
    }, 150);
  }

  printSingle(statement: UserStatement) {
    this.printModeSingle = true;
    this.singlePrintStatement = statement;
    this.printModeAccountant = false;
    this.cdr.detectChanges(); // Ensure the DOM is fully rendered before printing
    setTimeout(() => {
      window.print();
    }, 150);
  }

  printAccountantSheet() {
    this.printModeSingle = false;
    this.singlePrintStatement = null;
    this.printModeAccountant = true;
    this.cdr.detectChanges(); // Ensure the DOM is fully rendered before printing
    setTimeout(() => {
      window.print();
    }, 150);
  }

  // --- Advance Payment Helpers ---
  getRemainingCashAdvance(u: any): number {
    const advance = Number(u.advance || 0);
    const initialAdvance = Number(u.initial_advance || 0);
    const gift = Number(u.gift || 0);
    const totalPaid = Number(u.paid || 0);

    // 1. If total paid is enough to cover the cash advance, they owe 0 remaining cash advance.
    const requiredCashAdvance = initialAdvance - gift;
    if (totalPaid >= requiredCashAdvance) {
      return 0;
    }

    // 2. Otherwise, check if advance is equal to initial_advance (meaning gift is not yet subtracted in the DB column)
    if (advance === initialAdvance && gift > 0) {
      return Math.max(0, advance - gift - totalPaid);
    }

    return Math.max(0, advance);
  }

  hasUserPaidAdvance(u: any): boolean {
    return this.getRemainingCashAdvance(u) <= 0;
  }

  getAdvancePaidCount(): number {
    return this.users.filter(u => this.hasUserPaidAdvance(u)).length;
  }

  getPaidAdvanceUsers(): any[] {
    return this.users.filter(u => this.hasUserPaidAdvance(u));
  }

  getUnpaidAdvanceUsers(): any[] {
    return this.users.filter(u => !this.hasUserPaidAdvance(u));
  }

  hasPaidAdvance(row: UserStatement): boolean {
    return this.hasUserPaidAdvance(row.user);
  }

  getSelectedTotalPaidGrams(): number {
    return this.userStatements.filter(s => s.selected).reduce((sum, s) => sum + Number(s.user.paid || 0), 0);
  }

  getSelectedTotalRemainingGrams(): number {
    return this.userStatements.filter(s => s.selected).reduce((sum, s) => sum + Number(s.user.remaining || 0), 0);
  }
}
