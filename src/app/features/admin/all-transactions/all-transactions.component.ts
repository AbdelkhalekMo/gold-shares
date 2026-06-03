import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';
import { getCairoDate } from '../../../core/utils/date-utils';

@Component({
  selector: 'app-all-transactions',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="all-tx-page animate-spring">
      <div class="page-header">
        <div class="title">
          <h1 class="islamic-header text-gradient">سجل العمليات الشامل</h1>
          <p class="subtitle">المراقبة، الفرز المحاسبي السنوي والشهري، والتدقيق المالي لأعضاء الجمعية</p>
        </div>
      </div>

      <!-- Advanced Glassmorphic Filtering Control Center -->
      <div class="filter-panel card glass-glow">
        <div class="filter-grid">
          <!-- Filter 1: Search Query -->
          <div class="filter-group">
            <label>🔍 بحث سريع</label>
            <div class="input-modern-wrapper">
              <input type="text" [(ngModel)]="searchQuery" (input)="applyFilters()" placeholder="رقم العملية أو اسم المشترك...">
            </div>
          </div>

          <!-- Filter 2: Select User -->
          <div class="filter-group">
            <label>👤 تصفية بالعضو</label>
            <div class="select-modern-wrapper">
              <select [(ngModel)]="selectedUserId" (change)="applyFilters()">
                <option value="all">كل الأعضاء المساهمين</option>
                <option *ngFor="let u of users" [value]="u.id">{{ u.username }}</option>
              </select>
            </div>
          </div>

          <!-- Filter 3: Select Fiscal Year -->
          <div class="filter-group">
            <label>📅 السنة المالية</label>
            <div class="select-modern-wrapper">
              <select [(ngModel)]="selectedYear" (change)="onYearChange()">
                <option value="all">كل السنوات</option>
                <option *ngFor="let yr of availableYears" [value]="yr">{{ yr }}م</option>
              </select>
            </div>
          </div>

          <!-- Filter 4: Select Fiscal Month -->
          <div class="filter-group">
            <label>🌙 الشهر المالي</label>
            <div class="select-modern-wrapper" [class.disabled-select]="selectedYear === 'all'">
              <select [(ngModel)]="selectedMonth" (change)="applyFilters()" [disabled]="selectedYear === 'all'">
                <option value="all">كل شهور السنة</option>
                <option *ngFor="let m of monthsList" [value]="m.value">{{ m.label }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="modern-loading">
        <div class="loader-orb"></div>
        <p>جاري استحضار وتحليل الفهارس المالية والعمليات...</p>
      </div>

      <!-- Main Ledger -->
      <ng-container *ngIf="!loading">
        <div *ngIf="paginatedTransactions.length > 0; else empty">
          <!-- Desktop Table (Visible on computer screens) -->
          <div class="table-container animate-spring">
            <table>
              <thead>
                <tr>
                  <th>رقم العملية</th>
                  <th>المشترك المساهم</th>
                  <th>نوع الدفع</th>
                  <th>سعر الجرام اليوم</th>
                  <th>الوزن المطلوب</th>
                  <th>القيمة الإجمالية</th>
                  <th>تاريخ وتوقيت التوثيق</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tx of paginatedTransactions">
                  <td class="tx-number">#{{ tx.transaction_number }}</td>
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar">{{ tx.user?.username?.charAt(0) || '?' }}</div>
                      <div style="display: flex; flex-direction: column; gap: 0.1rem;">
                        <span class="username">{{ tx.user?.username || 'غير معروف' }}</span>
                        <span class="user-sub-info" style="font-size: 0.75rem; color: var(--primary);" *ngIf="tx.user">
                          المقدم: {{ tx.user.advance }} جم | الهدية: {{ tx.user.gift || 0 }} جم
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge-type" [class.advance]="tx.payment_type === 'advance'" [class.normal]="tx.payment_type !== 'advance'">
                      {{ tx.payment_type === 'advance' ? '💎 مقدم' : (tx.payment_period === '3_months' ? '📈 3 شهور' : '📈 دفع شهر') }}
                    </span>
                  </td>
                  <td>{{ tx.gram_price | number }} ج.م</td>
                  <td class="text-gold font-bold">{{ tx.grams | number:'1.0-3' }} جم</td>
                  <td class="text-accent font-bold">{{ tx.amount | number }} ج.م</td>
                  <td class="date-cell">{{ tx.created_at | date:'yyyy-MM-dd HH:mm':'Africa/Cairo' }} (بتوقيت القاهرة)</td>
                  <td>
                    <a [routerLink]="['/admin/transactions', tx.user_id]" class="view-link-btn">👤 كشف حساب</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Card List (Visible on smartphone screens) -->
          <div class="mobile-tx-list animate-spring">
            <div class="tx-card card glass-glow" *ngFor="let tx of paginatedTransactions">
              <div class="card-header-tx">
                <div class="user-cell">
                  <div class="user-avatar">{{ tx.user?.username?.charAt(0) || '?' }}</div>
                  <div class="user-meta">
                    <span class="username">{{ tx.user?.username || 'غير معروف' }}</span>
                    <span class="user-sub-info" style="font-size: 0.75rem; color: var(--primary);" *ngIf="tx.user">
                      المقدم: {{ tx.user.advance }} جم | الهدية: {{ tx.user.gift || 0 }} جم
                    </span>
                    <span class="date">{{ tx.created_at | date:'yyyy-MM-dd HH:mm':'Africa/Cairo' }} (بتوقيت القاهرة)</span>
                  </div>
                </div>
                <span class="tx-number">#{{ tx.transaction_number }}</span>
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
                  <span class="label">الوزن الموثق:</span>
                  <span class="value text-gold font-bold">{{ tx.grams | number:'1.0-3' }} جم</span>
                </div>
                <div class="stat-item full-width">
                  <span class="label">القيمة الكلية:</span>
                  <span class="value text-accent font-bold">{{ tx.amount | number }} ج.م</span>
                </div>
              </div>

              <div class="card-actions-tx">
                <a [routerLink]="['/admin/transactions', tx.user_id]" class="btn-action-mobile-view">
                  <span>👤 استعراض كشف الحساب الكامل</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Professional Pagination Footer -->
          <div class="pagination-footer card glass-glow">
            <div class="pagination-info">
              عرض من <strong>{{ getStartRecord() }}</strong> إلى <strong>{{ getEndRecord() }}</strong> من إجمالي <strong>{{ filteredTransactions.length }}</strong> معاملة موثقة
            </div>
            
            <div class="pagination-controls">
              <button class="page-btn prev" [disabled]="currentPage === 1" (click)="setPage(currentPage - 1)">السابق</button>
              
              <div class="page-numbers">
                <button 
                  *ngFor="let p of getPagesArray()" 
                  class="page-btn num" 
                  [class.active]="currentPage === p"
                  (click)="setPage(p)">
                  {{ p }}
                </button>
              </div>

              <button class="page-btn next" [disabled]="currentPage === totalPages" (click)="setPage(currentPage + 1)">التالي</button>
            </div>
            
            <div class="page-size-selector">
              <label>حجم الصفحة:</label>
              <select [(ngModel)]="pageSize" (change)="applyFilters()">
                <option [value]="5">5 صفوف</option>
                <option [value]="10">10 صفوف</option>
                <option [value]="20">20 صفاً</option>
                <option [value]="50">50 صفاً</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Empty Filter Results -->
        <ng-template #empty>
          <div class="modern-empty card glass-glow">
            <div class="empty-icon">🕊️</div>
            <h3>لا توجد نتائج مطابقة للفلترة</h3>
            <p>لم يتم العثور على أي معاملات مسجلة تطابق محددات البحث والفترة الزمنية المحددة.</p>
            <button class="btn btn-primary" (click)="resetFilters()">🔄 إعادة ضبط الفلاتر</button>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
  styles: [`
    .all-tx-page { padding: 1rem 0; }
    .page-header { margin-bottom: 2.5rem; text-align: right; }
    .subtitle { color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem; }

    /* Filter Control Center */
    .filter-panel {
      padding: 2rem;
      margin-bottom: 2.5rem;
      background: linear-gradient(135deg, rgba(4, 47, 36, 0.15) 0%, rgba(2, 6, 23, 0.4) 100%);
      border: 1px solid var(--glass-border);
      border-radius: 28px;
    }
    .filter-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 1.5rem;
      align-items: flex-end;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      label {
        font-size: 0.85rem;
        font-weight: 800;
        color: var(--primary);
        margin-right: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        &::before { content: '✦'; font-size: 0.7rem; color: var(--primary); opacity: 0.8; }
      }
    }
    
    .input-modern-wrapper input, .select-modern-wrapper select {
      width: 100%;
      background: rgba(4, 47, 36, 0.25);
      border: 1px solid rgba(212, 175, 55, 0.15);
      border-radius: 16px;
      padding: 0.9rem 1.2rem;
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

    .select-modern-wrapper {
      position: relative;
      select {
        appearance: none;
        -webkit-appearance: none;
        cursor: pointer;
        padding-left: 2.2rem;
        option { background: #042f24; color: #fff; }
      }
      &::after {
        content: '▼'; font-size: 0.6rem; color: var(--primary); position: absolute; left: 1.2rem; top: 50%; transform: translateY(-50%); pointer-events: none;
      }
      
      &.disabled-select {
        opacity: 0.4;
        select {
          cursor: not-allowed;
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(255, 255, 255, 0.05);
        }
        &::after {
          color: rgba(255,255,255,0.2);
        }
      }
    }

    /* Table styles */
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

    .tx-number { font-family: 'Plus Jakarta Sans', sans-serif; color: var(--primary); font-weight: 800; }
    .user-cell {
      display: flex; align-items: center; gap: 0.75rem;
      .user-avatar { width: 34px; height: 34px; background: rgba(255, 255, 255, 0.1); color: #fff; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 1px solid var(--glass-border); }
      .username { font-weight: 800; }
    }
    .date-cell { color: var(--text-muted); font-size: 0.85rem; }
    .text-gold { color: var(--primary) !important; }
    .text-accent { color: var(--accent) !important; }
    
    .view-link-btn {
      display: inline-block;
      padding: 0.4rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.85rem;
      border-radius: 10px;
      transition: all 0.3s ease;
      
      &:hover {
        background: var(--primary);
        border-color: var(--primary);
        color: #000;
        transform: translateY(-2px);
      }
    }

    /* Mobile view styling */
    .mobile-tx-list { display: none; flex-direction: column; gap: 1.25rem; margin-bottom: 2rem; }
    .tx-card {
      padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 24px;
      .card-header-tx {
        display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 0.75rem;
        .tx-number { font-weight: 800; font-size: 0.95rem; color: var(--primary); }
        
        .user-cell {
          display: flex; align-items: center; gap: 0.75rem;
          .user-avatar { width: 38px; height: 38px; background: rgba(255, 255, 255, 0.1); color: #fff; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 1px solid var(--glass-border); }
          .user-meta { display: flex; flex-direction: column; gap: 0.2/rem;
            .username { font-weight: 800; font-size: 0.95rem; color: #fff; }
            .date { font-size: 0.75rem; color: var(--text-muted); font-family: 'Plus Jakarta Sans', sans-serif; }
          }
        }
      }
      .card-body-tx {
        display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: rgba(255, 255, 255, 0.02); padding: 0.75rem 1rem; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.03);
        .stat-item {
          display: flex; flex-direction: column; gap: 0.25rem;
          .label { font-size: 0.75rem; color: var(--text-muted); font-weight: 800; }
          .value { font-size: 0.95rem; }
          &.full-width { grid-column: span 2; border-top: 1px solid rgba(255, 255, 255, 0.03); padding-top: 0.5rem; margin-top: 0.25rem; flex-direction: row; justify-content: space-between; align-items: center; }
        }
      }
      .card-actions-tx {
        .btn-action-mobile-view {
          display: flex; align-items: center; justify-content: center; width: 100%; padding: 0.85rem; border-radius: 12px; font-size: 0.9rem; font-weight: 800; text-decoration: none; color: #fff; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); cursor: pointer; transition: all 0.3s ease;
          &:hover { border-color: var(--primary); color: var(--primary); background: rgba(212, 175, 55, 0.05); }
        }
      }
    }

    /* Pagination Footer styling */
    .pagination-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      margin-top: 2rem;
      background: linear-gradient(135deg, rgba(4, 47, 36, 0.1) 0%, rgba(2, 6, 23, 0.3) 100%);
      border: 1px solid var(--glass-border);
      border-radius: 24px;
    }
    .pagination-info { font-size: 0.9rem; color: var(--text-muted); strong { color: #fff; } }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .page-numbers { display: flex; gap: 0.35rem; }
    
    .page-btn {
      padding: 0.55rem 0.95rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.03);
      color: #fff;
      font-weight: 800;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover:not([disabled]) {
        border-color: var(--primary);
        color: var(--primary);
        background: rgba(212, 175, 55, 0.05);
      }
      
      &[disabled] {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      &.active {
        background: var(--primary);
        color: #000;
        border-color: var(--primary);
        font-weight: 900;
      }
    }
    
    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      
      select {
        background: rgba(4, 47, 36, 0.4);
        border: 1px solid rgba(212, 175, 55, 0.15);
        color: #fff;
        border-radius: 8px;
        padding: 0.4rem 0.8rem;
        font-weight: 700;
        outline: none;
        cursor: pointer;
        option { background: #042f24; }
      }
    }

    .modern-loading { text-align: center; padding: 5rem; .loader-orb { width: 40px; height: 40px; border: 3px solid transparent; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; } }
    @keyframes spin { to { transform: rotate(360deg); } }

    .modern-empty {
      text-align: center; padding: 5rem 2rem;
      .empty-icon { font-size: 4.5rem; opacity: 0.3; margin-bottom: 1rem; }
      h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
      p { color: var(--text-muted); margin-bottom: 1.5rem; }
    }

    @media (max-width: 1024px) {
      .filter-grid { grid-template-columns: 1fr 1fr; }
    }

    @media (max-width: 768px) {
      .table-container { display: none !important; }
      .mobile-tx-list { display: flex !important; }
      .filter-grid { grid-template-columns: 1fr !important; gap: 1.25rem !important; }
      .filter-panel { padding: 1.5rem; border-radius: 20px; }
      
      .pagination-footer {
        flex-direction: column;
        gap: 1.25rem;
        padding: 1.5rem;
        text-align: center;
      }
      .pagination-controls {
        width: 100%;
        justify-content: space-between;
        .page-numbers { display: none; } /* Hide numbers, use prev/next on mobile */
        .page-btn { flex: 1; text-align: center; }
      }
      .page-size-selector { width: 100%; justify-content: center; }
    }
  `]
})
export class AllTransactionsComponent implements OnInit {
  dataService = inject(DataService);
  cdr = inject(ChangeDetectorRef);

  allTransactions: any[] = [];
  filteredTransactions: any[] = [];
  paginatedTransactions: any[] = [];
  users: any[] = [];
  loading = true;

  // Active filter values
  selectedUserId = 'all';
  searchQuery = '';
  selectedYear = 'all';
  selectedMonth = 'all';

  // Dynamic values
  availableYears: number[] = [];
  monthsList = [
    { value: '0', label: 'يناير (01)' },
    { value: '1', label: 'فبراير (02)' },
    { value: '2', label: 'مارس (03)' },
    { value: '3', label: 'أبريل (04)' },
    { value: '4', label: 'مايو (05)' },
    { value: '5', label: 'يونيو (06)' },
    { value: '6', label: 'يوليو (07)' },
    { value: '7', label: 'أغسطس (08)' },
    { value: '8', label: 'سبتمبر (09)' },
    { value: '9', label: 'أكتوبر (10)' },
    { value: '10', label: 'نوفمبر (11)' },
    { value: '11', label: 'ديسمبر (12)' }
  ];

  // Pagination values
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.cdr.detectChanges();

    // 1. Fetch all users to populate the user filter dropdown
    const usersRes = await this.dataService.getUsers();
    if (usersRes.data) {
      this.users = (usersRes.data || []).filter((u: any) => u.role === 'user');
    }

    // 2. Fetch all approved transactions (with user joining)
    const txsRes = await this.dataService.getApprovedTransactions();
    if (txsRes.error) {
      console.error('Error fetching all transactions:', txsRes.error);
    }
    this.allTransactions = txsRes.data || [];
    
    // 3. Extract unique years active in database dynamically
    const years = this.allTransactions.map(tx => getCairoDate(tx.created_at).getFullYear());
    this.availableYears = [...new Set(years)].sort((a, b) => b - a);

    // Default: Add current year if not present
    const currentYear = getCairoDate().getFullYear();
    if (!this.availableYears.includes(currentYear)) {
      this.availableYears.unshift(currentYear);
    }

    // 4. Process default filters
    this.applyFilters();
    
    this.loading = false;
    this.cdr.detectChanges();
  }

  onYearChange() {
    if (this.selectedYear === 'all') {
      this.selectedMonth = 'all';
    }
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.allTransactions];

    // 1. User Filter
    if (this.selectedUserId !== 'all') {
      result = result.filter(tx => tx.user_id === this.selectedUserId);
    }

    // 2. Year & Month Accounting Filter
    if (this.selectedYear !== 'all') {
      const targetYear = Number(this.selectedYear);
      result = result.filter(tx => {
        const txDate = getCairoDate(tx.created_at);
        const matchesYear = txDate.getFullYear() === targetYear;

        if (this.selectedMonth !== 'all') {
          const targetMonth = Number(this.selectedMonth);
          return matchesYear && txDate.getMonth() === targetMonth;
        }

        return matchesYear;
      });
    } else {
      this.selectedMonth = 'all';
    }

    // 3. Search query filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(tx => 
        (tx.user?.username?.toLowerCase().includes(query)) ||
        (tx.transaction_number?.toString().includes(query))
      );
    }

    this.filteredTransactions = result;
    this.currentPage = 1;
    this.calculatePagination();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredTransactions.length / this.pageSize) || 1;
    
    // Safety checks
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedTransactions = this.filteredTransactions.slice(startIndex, endIndex);
  }

  setPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.calculatePagination();
  }

  getPagesArray(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  getStartRecord(): number {
    if (this.filteredTransactions.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndRecord(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.filteredTransactions.length ? this.filteredTransactions.length : end;
  }

  resetFilters() {
    this.selectedUserId = 'all';
    this.searchQuery = '';
    this.selectedYear = 'all';
    this.selectedMonth = 'all';
    this.applyFilters();
  }
}
