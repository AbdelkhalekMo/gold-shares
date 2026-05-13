import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import { Stats } from '../../../core/interfaces/models.interface';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-dashboard animate-spring">
      <div class="page-header">
        <h1 class="islamic-header text-gradient">لوحة القيادة المركزية</h1>
        <p class="subtitle">مراقبة حية لأداء جمعية وااد زينب</p>
      </div>

      <!-- Bento Grid for Admin -->
      <div class="bento-grid">
        <div class="card stat-box glass-glow">
          <div class="header">
            <span class="icon">👥</span>
            <span class="trend up">↑ 12%</span>
          </div>
          <div class="main">
            <h3>{{ stats?.totalUsers ?? '-' }}</h3>
            <p>إجمالي الأعضاء</p>
          </div>
        </div>

        <div class="card stat-box glass-glow">
          <div class="header">
            <span class="icon">📜</span>
          </div>
          <div class="main">
            <h3>{{ stats?.totalTransactions ?? '-' }}</h3>
            <p>المعاملات النشطة</p>
          </div>
        </div>

        <div class="card stat-box highlight gold-glow">
          <div class="header">
            <span class="icon pulse">✨</span>
            <span class="badge-gold">ممتاز</span>
          </div>
          <div class="main">
            <h3 class="text-gradient">{{ stats ? (stats.totalGrams | number:'1.0-3') : '-' }}</h3>
            <p>رصيد الذهب (جم)</p>
          </div>
        </div>

        <div class="card stat-box glass-glow">
          <div class="header">
            <span class="icon">💰</span>
          </div>
          <div class="main">
            <h3>{{ stats ? (stats.totalMoney | number) : '-' }} <small>ج.م</small></h3>
            <p>السيولة المحصلة</p>
          </div>
        </div>
      </div>

      <!-- Admin Quick Insights -->
      <div class="insights-row">
        <div class="card glass-card welcome-card">
          <div class="orb"></div>
          <div class="content">
            <h2>مرحباً بك يا مدير النظام</h2>
            <p>النظام الآن يعمل بكفاءة 100%. جميع العمليات تحت المراقبة.</p>
            <div class="actions">
              <button class="btn btn-primary">تقارير اليوم</button>
              <button class="btn btn-glass">السجلات</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard { padding: 1rem 0; }
    .page-header { margin-bottom: 3.5rem; text-align: right; }
    .subtitle { color: var(--text-muted); font-size: 1.2rem; font-weight: 500; }
    
    .stat-box {
      display: flex; flex-direction: column; justify-content: space-between; min-height: 200px;
      padding: 2rem;
      .header { display: flex; justify-content: space-between; align-items: center; 
        .icon { font-size: 2rem; opacity: 0.8; }
        .trend { font-size: 0.8rem; font-weight: 800; color: var(--accent); background: rgba(16, 185, 129, 0.1); padding: 0.25rem 0.75rem; border-radius: 100px; }
        .badge-gold { background: var(--primary); color: #000; font-size: 0.7rem; font-weight: 900; padding: 0.25rem 0.75rem; border-radius: 100px; }
      }
      .main {
        margin-top: 2rem;
        h3 { font-size: 2.5rem; font-weight: 900; margin-bottom: 0.25rem; }
        p { color: var(--text-muted); font-weight: 700; font-size: 0.9rem; text-transform: uppercase; }
      }
      &.highlight { border: 2px solid var(--primary); }
    }

    .welcome-card {
      padding: 4rem; position: relative; overflow: hidden;
      .orb { position: absolute; width: 300px; height: 300px; background: var(--primary); filter: blur(150px); opacity: 0.1; top: -150px; left: -150px; }
      h2 { font-size: 2.5rem; font-weight: 900; margin-bottom: 1rem; font-family: 'Amiri', serif; }
      p { font-size: 1.2rem; color: var(--text-muted); margin-bottom: 2.5rem; max-width: 600px; }
      .actions { display: flex; gap: 1.5rem; }
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
