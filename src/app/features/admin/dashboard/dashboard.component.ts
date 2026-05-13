import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import { Stats } from '../../../core/interfaces/models.interface';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard animate-fade-in">
      <div class="page-header">
        <h1>لوحة التحكم</h1>
        <p>نظرة عامة على أداء الجمعية</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="icon users">👥</div>
          <div class="info">
            <p class="label">إجمالي المشتركين</p>
            <h3>{{ stats?.totalUsers ?? '-' }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="icon txs">📜</div>
          <div class="info">
            <p class="label">إجمالي المعاملات المؤكدة</p>
            <h3>{{ stats?.totalTransactions ?? '-' }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="icon gold">✨</div>
          <div class="info">
            <p class="label">إجمالي الجرامات المسددة</p>
            <h3>{{ stats ? (stats.totalGrams | number:'1.0-3') : '-' }} <small>جم</small></h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="icon money">💰</div>
          <div class="info">
            <p class="label">إجمالي الأموال المحصلة</p>
            <h3>{{ stats ? (stats.totalMoney | number) : '-' }} <small>ج.م</small></h3>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 2rem; h1 { font-size: 1.75rem; font-weight: 800; } p { color: var(--text-muted); } }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
    .stat-card {
      background: #fff; padding: 1.5rem; border-radius: 20px;
      display: flex; align-items: center; gap: 1.25rem;
      border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);
      .icon {
        width: 60px; height: 60px; border-radius: 15px;
        display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
        &.users { background: #eff6ff; }
        &.txs { background: #fdf2f8; }
        &.gold { background: #fefce8; }
        &.money { background: #f0fdf4; }
      }
      .info {
        .label { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.25rem; }
        h3 { font-size: 1.5rem; font-weight: 800; }
        small { font-size: 0.75rem; color: var(--text-muted); }
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  dataService = inject(DataService);
  cdr = inject(ChangeDetectorRef);
  stats: Stats | null = null;

  ngOnInit() {
    this.loadStats();
  }

  async loadStats() {
    this.stats = await this.dataService.getAdminStats();
    this.cdr.detectChanges();
  }
}
