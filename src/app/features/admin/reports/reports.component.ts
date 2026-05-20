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
              <option *ngFor="let u of users" [value]="u.id">{{ u.username }} ({{ u.email }})</option>
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
                    <span class="user-name">{{ row.user.username }}</span>
                    <span class="user-email">{{ row.user.email }}</span>
                  </div>
                </td>
                <td><span class="share-badge">{{ row.user.share_type }}</span></td>
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
                  <span class="value font-bold">{{ previewStatement.user.username }}</span>
                </div>
                <div class="info-item">
                  <span class="label">البريد الإلكتروني:</span>
                  <span class="value">{{ previewStatement.user.email }}</span>
                </div>
                <div class="info-item">
                  <span class="label">نوع السهم / الاشتراك:</span>
                  <span class="value">{{ previewStatement.user.share_type }}</span>
                </div>
                <div class="info-item">
                  <span class="label">تاريخ الانضمام:</span>
                  <span class="value">{{ previewStatement.user.created_at | date:'yyyy-MM-dd':'Africa/Cairo' }}</span>
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
                      <th>التاريخ والوقت</th>
                      <th>سعر جرام عيار 21 اليومي</th>
                      <th>الوزن المشترى</th>
                      <th>المبلغ المدفوع</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let tx of previewStatement.transactions">
                      <td><code class="tx-num">{{ tx.transaction_number || 'N/A' }}</code></td>
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

        <!-- Ledger Table -->
        <div class="table-container-print">
          <table class="print-table accountant-table">
            <thead>
              <tr>
                <th>اسم المساهم</th>
                <th>نوع السهم</th>
                <th>مدفوعات الفترة</th>
                <th>وزن الذهب بالفترة</th>
                <th>المدفوع الكلي</th>
                <th>الرصيد الكلي بالذهب</th>
                <th>المتبقي المطلوب</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let row of userStatements">
                <tr *ngIf="row.selected">
                  <td class="font-bold">{{ row.user.username }}</td>
                  <td>{{ row.user.share_type }}</td>
                  <td class="font-bold">{{ row.totalAmount | number:'1.0-2' }} ج.م</td>
                  <td class="font-bold">{{ row.totalGrams | number:'1.0-3' }} جرام</td>
                  <td>{{ row.overallPaid | number:'1.0-2' }} ج.م</td>
                  <td>{{ row.overallGrams | number:'1.0-3' }} جرام</td>
                  <td class="font-bold text-danger">{{ row.overallRemaining | number:'1.0-2' }} ج.م</td>
                </tr>
              </ng-container>
              <!-- Totals Row -->
              <tr class="totals-row">
                <td colspan="2" class="font-bold">الإجمالي المجموع</td>
                <td class="font-bold">{{ getSelectedTotalAmount() | number:'1.0-2' }} ج.م</td>
                <td class="font-bold">{{ getSelectedTotalGrams() | number:'1.0-3' }} جرام</td>
                <td class="font-bold">{{ getSelectedOverallPaid() | number:'1.0-2' }} ج.م</td>
                <td class="font-bold">{{ getSelectedOverallGrams() | number:'1.0-3' }} جرام</td>
                <td class="font-bold text-danger">{{ getSelectedOverallRemaining() | number:'1.0-2' }} ج.م</td>
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
              <span class="value font-bold">{{ statement.user.username }}</span>
            </div>
            <div class="info-item">
              <span class="label">البريد الإلكتروني:</span>
              <span class="value">{{ statement.user.email }}</span>
            </div>
            <div class="info-item">
              <span class="label">نوع السهم / الاشتراك:</span>
              <span class="value">{{ statement.user.share_type }}</span>
            </div>
            <div class="info-item">
              <span class="label">تاريخ الانضمام:</span>
              <span class="value">{{ statement.user.created_at | date:'yyyy-MM-dd':'Africa/Cairo' }}</span>
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
                  <th>التاريخ والوقت</th>
                  <th>سعر جرام عيار 21 اليومي</th>
                  <th>الوزن المشترى</th>
                  <th>المبلغ المدفوع</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tx of statement.transactions">
                  <td><code>{{ tx.transaction_number || 'N/A' }}</code></td>
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
        grid-template-columns: repeat(4, 1fr) !important;
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

    @media (max-width: 768px) {
      .filters-grid {
        grid-template-columns: 1fr;
      }
      .actions-container {
        justify-content: center;
        flex-direction: column;
        width: 100%;
        
        button {
          width: 100%;
        }
      }
      .table-header-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
      .action-buttons-cell {
        flex-direction: column;
        gap: 0.25rem;
      }
      .modal-card {
        padding: 1.25rem !important;
        border-radius: 25px;
      }
      .statement-print-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
        
        .statement-meta {
          text-align: center;
          margin-top: 1rem;
        }
      }
      .summary-cards {
        grid-template-columns: 1fr;
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
    const [usersRes, txsRes] = await Promise.all([
      this.dataService.getUsers(),
      this.dataService.getApprovedTransactions()
    ]);

    this.users = (usersRes.data || []).filter(u => u.role === 'user');
    this.allTransactions = txsRes.data || [];

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
      
      // If listing all users, only include users who have transactions in that period
      if (this.selectedUserId === 'all' && periodTxs.length === 0) {
        continue;
      }
      
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
}
