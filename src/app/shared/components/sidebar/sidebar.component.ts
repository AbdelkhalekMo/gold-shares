import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar-inner glass">
        <div class="header">
          <div class="glow-orb"></div>
          <span class="label">القائمة الرئيسية</span>
        </div>
        <div class="menu-items">
          <ng-container *ngIf="authService.isAdmin(); else userMenu">
            <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
               <span class="icon">🏠</span> <span class="label">الرئيسية</span>
            </a>
            <a routerLink="/admin/users" routerLinkActive="active" class="nav-item">
               <span class="icon">👥</span> <span class="label">المستخدمين</span>
            </a>
            <a routerLink="/admin/pending" routerLinkActive="active" class="nav-item">
               <span class="icon">💎</span> <span class="label">الطلبات</span>
            </a>
            <a routerLink="/admin/transactions" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
               <span class="icon">📦</span> <span class="label">المخزون</span>
            </a>
            <a routerLink="/admin/profiles-list" routerLinkActive="active" class="nav-item">
               <span class="icon">📂</span> <span class="label">الأرشيف</span>
            </a>
          </ng-container>

          <ng-template #userMenu>
            <a routerLink="/user" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
               <span class="icon">📊</span> <span class="label">محفظتي</span>
            </a>
            <a routerLink="/user/new-transaction" routerLinkActive="active" class="nav-item">
               <span class="icon">⚡</span> <span class="label">طلب جديد</span>
            </a>
            <a routerLink="/user/profile" routerLinkActive="active" class="nav-item">
               <span class="icon">👤</span> <span class="label">الملف الشخصي</span>
            </a>
          </ng-template>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 280px;
      height: calc(100vh - 100px);
      position: sticky;
      top: 100px;
      padding: 0 1.5rem 1.5rem;
      z-index: 900;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .sidebar-inner {
      height: 100%;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(25px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 35px;
      padding: 2rem 1.25rem;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    }
    .header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 3.5rem;
      padding: 0 1rem;
      .label { font-weight: 900; font-size: 1.2rem; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.1); }
    }
    .glow-orb { width: 14px; height: 14px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 20px var(--primary); }
    
    .menu-items { display: flex; flex-direction: column; gap: 1rem; }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1rem 1.25rem;
      text-decoration: none;
      color: var(--text-muted);
      border-radius: 22px;
      transition: all 0.3s ease;
      
      .icon { font-size: 1.6rem; min-width: 35px; display: flex; align-items: center; justify-content: center; }
      .label { font-weight: 800; font-size: 1.05rem; }

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
        transform: translateX(-8px);
      }
      
      &.active {
        background: var(--primary);
        color: #000;
        box-shadow: 0 15px 30px rgba(212, 175, 55, 0.25);
        .icon { filter: drop-shadow(0 0 5px rgba(0,0,0,0.3)); }
        .label { font-weight: 900; }
        &:hover { transform: none; }
      }
    }
    
    @media (max-width: 1024px) {
      .sidebar { width: 240px; }
    }

    @media (max-width: 768px) {
      .sidebar { 
        position: fixed; 
        right: -300px; 
        top: 0;
        height: 100vh;
        padding: 1.5rem;
        &.active { right: 0; width: 300px; } 
      }
      .sidebar-inner { border-radius: 0 40px 40px 0; }
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);
}
