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
        <p class="subtitle">مراقبة حية لأداء جمعية أولاد زينب</p>
      </div>

      <!-- Premium Unified Gold Ledger Board -->
      <div class="ledger-board-container animate-spring">
        <div class="ledger-board-header">
          <div class="title-with-pill">
            <span class="pulse-dot"></span>
            <h2>ميزان الذهب الكلي للجمعية</h2>
          </div>
          <span class="live-badge">تحديث مباشر</span>
        </div>
        <div class="ledger-board-row">
          <!-- Col 1: Total Required -->
          <div class="board-col required-glow">
            <div class="col-icon-wrap">
              <span class="icon">⚖️</span>
            </div>
            <div class="col-info">
              <span class="col-label">إجمالي الذهب المطلوب</span>
              <h3 class="col-value">
                {{ stats ? (stats.totalRequiredGrams | number:'1.0-3') : '-' }} <small>جم</small>
              </h3>
              <p class="col-desc">المستهدف العام من جميع الأعضاء</p>
            </div>
          </div>

          <div class="board-divider"></div>

          <!-- Col 2: Current Gold Balance -->
          <div class="board-col gold-glow">
            <div class="col-icon-wrap">
              <span class="icon">✨</span>
            </div>
            <div class="col-info">
              <span class="col-label">رصيد الذهب الحالي</span>
              <h3 class="col-value">
                {{ stats ? (stats.totalGrams | number:'1.0-3') : '-' }} <small>جم</small>
              </h3>
              <p class="col-desc">إجمالي المدفوع والمحصل فعلياً</p>
            </div>
          </div>

          <div class="board-divider"></div>

          <!-- Col 3: Remaining Gold -->
          <div class="board-col danger-glow">
            <div class="col-icon-wrap">
              <span class="icon">📉</span>
            </div>
            <div class="col-info">
              <span class="col-label">المتبقي المطلوب تحصيله</span>
              <h3 class="col-value">
                {{ stats ? (stats.remainingGrams | number:'1.0-3') : '-' }} <small>جم</small>
              </h3>
              <p class="col-desc">العجز المتبقي بالجرامات</p>
            </div>
          </div>

          <div class="board-divider"></div>

          <!-- Col 4: Received Members (Last in row) -->
          <div class="board-col success-glow">
            <div class="col-icon-wrap">
              <span class="icon">🤝</span>
            </div>
            <div class="col-info">
              <span class="col-label">المستلمون للذهب</span>
              <h3 class="col-value">
                {{ stats?.receivedCount ?? '-' }} <small>أعضاء</small>
              </h3>
              <p class="col-desc">الذين تسلموا نصيبهم حتى الآن</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bento Grid for Admin Operations -->
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

        <div class="card stat-box glass-glow">
          <div class="header">
            <span class="icon">💰</span>
          </div>
          <div class="main">
            <h3>{{ stats ? (stats.totalMoney | number) : '-' }} <small>ج.م</small></h3>
            <p>السيولة المحصلة</p>
          </div>
        </div>

        <div class="card stat-box glass-glow">
          <div class="header">
            <span class="icon">🎁</span>
          </div>
          <div class="main" style="margin-top: 1rem;">
            <h3 style="font-size: 2rem;">{{ stats ? (stats.totalGiftsGrams | number:'1.0-3') : '-' }} <small style="font-size: 0.8rem;">جم</small></h3>
            <p style="margin-bottom: 0.75rem;">إجمالي الهدايا المقدمة</p>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted); border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
              <span>المسدد: <strong style="color: var(--accent);">{{ stats ? (stats.paidGiftsGrams | number:'1.0-3') : '-' }} جم</strong></span>
              <span>المتبقي: <strong style="color: #ff4d4d;">{{ stats ? (stats.remainingGiftsGrams | number:'1.0-3') : '-' }} جم</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard { padding: 1rem 0; }
    .page-header { margin-bottom: 2.5rem; text-align: right; }
    .subtitle { color: var(--text-muted); font-size: 1.2rem; font-weight: 500; }
    
    /* Premium Unified Ledger Board */
    .ledger-board-container {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(2, 6, 23, 0.6) 100%);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(212, 175, 55, 0.15);
      border-radius: 32px;
      padding: 2rem 2.5rem;
      margin-bottom: 3rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.05);
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--primary), transparent);
      }

      .ledger-board-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding-bottom: 1rem;

        .title-with-pill {
          display: flex;
          align-items: center;
          gap: 0.75rem;

          .pulse-dot {
            width: 8px;
            height: 8px;
            background-color: var(--primary);
            border-radius: 50%;
            box-shadow: 0 0 10px var(--primary);
            animation: pulseDot 1.5s infinite alternate;
          }

          h2 {
            font-size: 1.5rem;
            font-weight: 800;
            color: #fff;
            font-family: 'Amiri', serif;
            margin: 0;
          }
        }

        .live-badge {
          background: rgba(16, 185, 129, 0.1);
          color: var(--accent);
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.35rem 0.85rem;
          border-radius: 100px;
          border: 1px solid rgba(16, 185, 129, 0.2);
          letter-spacing: 0.5px;
        }
      }

      .ledger-board-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1.5rem;
      }

      .board-col {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 1.25rem;
        padding: 0.75rem;
        border-radius: 20px;
        transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);

        &:hover {
          background: rgba(255, 255, 255, 0.02);
          transform: translateY(-2px);
        }

        .col-icon-wrap {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          transition: all 0.3s ease;
        }

        .col-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;

          .col-label {
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--text-muted);
          }

          .col-value {
            font-size: 2rem;
            font-weight: 900;
            margin: 0;
            line-height: 1.2;
            display: flex;
            align-items: baseline;
            gap: 0.25rem;

            small {
              font-size: 0.9rem;
              font-weight: 700;
              color: var(--text-muted);
            }
          }

          .col-desc {
            font-size: 0.7rem;
            color: var(--text-muted);
            opacity: 0.8;
            margin: 0;
          }
        }

        &.required-glow {
          .col-icon-wrap {
            background: rgba(212, 175, 55, 0.15);
            border: 1px solid rgba(212, 175, 55, 0.3);
            box-shadow: 0 8px 20px rgba(212, 175, 55, 0.05);
          }
          .col-value {
            color: var(--primary);
            text-shadow: 0 0 15px rgba(212, 175, 55, 0.15);
          }
          &:hover .col-icon-wrap {
            background: rgba(212, 175, 55, 0.25);
            box-shadow: 0 8px 25px rgba(212, 175, 55, 0.2);
          }
        }

        &.gold-glow {
          .col-icon-wrap {
            background: rgba(212, 175, 55, 0.1);
            border: 1px solid rgba(212, 175, 55, 0.2);
            box-shadow: 0 8px 20px rgba(212, 175, 55, 0.05);
          }
          .col-value {
            color: var(--primary);
            text-shadow: 0 0 15px rgba(212, 175, 55, 0.15);
          }
          &:hover .col-icon-wrap {
            background: rgba(212, 175, 55, 0.15);
            box-shadow: 0 8px 25px rgba(212, 175, 55, 0.2);
          }
        }

        &.success-glow {
          .col-icon-wrap {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.05);
          }
          .col-value {
            color: var(--accent);
            text-shadow: 0 0 15px rgba(16, 185, 129, 0.15);
          }
          &:hover .col-icon-wrap {
            background: rgba(16, 185, 129, 0.15);
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.2);
          }
        }

        &.danger-glow {
          .col-icon-wrap {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            box-shadow: 0 8px 20px rgba(239, 68, 68, 0.05);
          }
          .col-value {
            color: #ff4d4d;
            text-shadow: 0 0 15px rgba(239, 68, 68, 0.15);
          }
          &:hover .col-icon-wrap {
            background: rgba(239, 68, 68, 0.15);
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.2);
          }
        }
      }

      .board-divider {
        width: 1px;
        height: 70px;
        background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.08) 20%, rgba(255, 255, 255, 0.08) 80%, transparent);
      }
    }

    @keyframes pulseDot {
      from { opacity: 0.4; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1.1); }
    }

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

    @media (max-width: 1200px) {
      .ledger-board-container {
        padding: 1.5rem;
      }
      .ledger-board-row {
        gap: 1rem;
      }
      .board-col {
        gap: 0.75rem;
        padding: 0.5rem;
        .col-icon-wrap {
          width: 45px;
          height: 45px;
          font-size: 1.3rem;
        }
        .col-info {
          .col-label { font-size: 0.8rem; }
          .col-value { font-size: 1.6rem; }
          .col-desc { font-size: 0.7rem; }
        }
      }
    }

    @media (max-width: 992px) {
      .ledger-board-row {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem 1rem;
      }
      .board-divider {
        display: none;
      }
      .board-col {
        padding: 0.5rem;
        justify-content: flex-start;
        gap: 1rem;
      }
    }

    @media (max-width: 576px) {
      .ledger-board-container {
        padding: 1.25rem 1rem !important;
        border-radius: 24px !important;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(2, 6, 23, 0.8) 100%) !important;
      }
      .ledger-board-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
        margin-bottom: 1.25rem !important;
        padding-bottom: 0.75rem !important;
      }
      .ledger-board-header .title-with-pill h2 {
        font-size: 1.15rem !important;
        font-weight: 800;
      }
      .ledger-board-row {
        display: flex !important;
        flex-direction: column !important;
        gap: 0.85rem !important;
      }
      .board-divider {
        display: none !important;
      }
      .board-col {
        background: rgba(255, 255, 255, 0.02) !important;
        border: 1px solid rgba(255, 255, 255, 0.04) !important;
        border-radius: 20px !important;
        padding: 1rem 0.85rem !important;
        width: 100% !important;
        box-sizing: border-box !important;
        display: flex !important;
        align-items: center !important;
        gap: 0.85rem !important;
        transition: transform 0.2s ease, border-color 0.2s ease !important;

        &:active {
          transform: scale(0.98) !important;
        }

        &.required-glow {
          border-color: rgba(212, 175, 55, 0.08) !important;
          background: linear-gradient(90deg, rgba(212, 175, 55, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%) !important;
        }
        &.gold-glow {
          border-color: rgba(212, 175, 55, 0.08) !important;
          background: linear-gradient(90deg, rgba(212, 175, 55, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%) !important;
        }
        &.danger-glow {
          border-color: rgba(239, 68, 68, 0.08) !important;
          background: linear-gradient(90deg, rgba(239, 68, 68, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%) !important;
        }
        &.success-glow {
          border-color: rgba(16, 185, 129, 0.08) !important;
          background: linear-gradient(90deg, rgba(16, 185, 129, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%) !important;
        }

        .col-icon-wrap {
          width: 44px !important;
          height: 44px !important;
          border-radius: 12px !important;
          font-size: 1.25rem !important;
          flex-shrink: 0 !important;
        }

        .col-info {
          flex: 1 !important;
          gap: 0.1rem !important;

          .col-label {
            font-size: 0.78rem !important;
            color: rgba(255, 255, 255, 0.5) !important;
          }

          .col-value {
            font-size: 1.4rem !important;
            font-weight: 900 !important;
            color: #fff !important;
            display: flex !important;
            align-items: baseline !important;
            gap: 0.2rem !important;

            small {
              font-size: 0.8rem !important;
              color: rgba(255, 255, 255, 0.4) !important;
            }
          }

          .col-desc {
            font-size: 0.65rem !important;
            color: rgba(255, 255, 255, 0.35) !important;
          }
        }
      }
    }

    @media (max-width: 768px) {
      .page-header {
        margin-bottom: 2rem;
        .islamic-header { font-size: 1.8rem; }
        .subtitle { font-size: 0.95rem; }
      }
      .ledger-board-container {
        border-radius: 24px;
        margin-bottom: 2rem;
        padding: 1.5rem 1rem;
      }
      .stat-box {
        min-height: 160px;
        padding: 1.25rem;
        .main {
          margin-top: 1.5rem;
          h3 { font-size: 2rem; }
        }
      }
    }

    @media (max-width: 480px) {
      .page-header {
        margin-bottom: 1.5rem;
        .islamic-header { font-size: 1.6rem !important; }
        .subtitle { font-size: 0.85rem; }
      }
      .stat-box {
        min-height: 140px;
        padding: 1rem;
        .header {
          .icon { font-size: 1.6rem; }
        }
        .main {
          margin-top: 1rem;
          h3 { font-size: 1.6rem; }
          p { font-size: 0.8rem; }
        }
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
