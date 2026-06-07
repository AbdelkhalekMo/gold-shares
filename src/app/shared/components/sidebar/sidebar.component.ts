import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar-inner glass">
        <button class="close-btn-mobile" (click)="closeSidebar()">×</button>
        <div class="menu-items">
          <ng-container *ngIf="authService.isStaff(); else userMenu">
            <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item" (click)="closeSidebar()">
               <span class="icon">🏠</span> <span class="label">الرئيسية</span>
            </a>
            <a *ngIf="authService.currentUser()?.role === 'admin'" routerLink="/admin/users" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
               <span class="icon">👥</span> <span class="label">المستخدمين</span>
            </a>
            <a routerLink="/admin/pending" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
               <span class="icon">💎</span> 
               <span class="label">الطلبات</span>
               <span class="badge-count animate-pulse-badge" *ngIf="dataService.pendingCount() > 0">
                 {{ dataService.pendingCount() }}
               </span>
            </a>
            <a routerLink="/admin/all-transactions" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
               <span class="icon">📜</span> <span class="label">سجل العمليات</span>
            </a>
            <a *ngIf="authService.isStaff()" routerLink="/admin/reports" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
               <span class="icon">🖨️</span> <span class="label">كشوف الحسابات</span>
            </a>
            <a routerLink="/admin/transactions" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item" (click)="closeSidebar()">
               <span class="icon">📦</span> <span class="label">المخزون</span>
            </a>
            <a routerLink="/admin/deliveries" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
               <span class="icon">🤝</span> <span class="label">المستلمون</span>
            </a>
            <a *ngIf="authService.currentUser()?.role === 'admin'" routerLink="/admin/profiles-list" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
               <span class="icon">📂</span> <span class="label">الأرشيف</span>
            </a>
          </ng-container>

          <ng-template #userMenu>
            <a routerLink="/user" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item" (click)="closeSidebar()">
               <span class="icon">📊</span> <span class="label">محفظتي</span>
            </a>
            <a routerLink="/user/new-transaction" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
               <span class="icon">⚡</span> <span class="label">طلب جديد</span>
            </a>
            <a routerLink="/user/profile" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
               <span class="icon">👤</span> <span class="label">الملف الشخصي</span>
            </a>
          </ng-template>
        </div>

        <div class="sidebar-footer">
          <div class="user-profile-summary">
            <div class="avatar-small">👤</div>
            <div class="details-small">
              <p class="username-small">
                {{ authService.currentUser()?.username }}
                <span *ngIf="authService.currentUser()?.member_code" style="font-size: 0.7rem; color: var(--primary); font-weight: 800; display: block; margin-top: 0.1rem;">
                  (كود: {{ authService.currentUser()?.member_code }})
                </span>
              </p>
              <p class="role-tag-small">
                {{ authService.currentUser()?.role === 'admin' ? 'مدير النظام' : 
                   (authService.currentUser()?.role === 'supervisor' ? 'مشرف مراقب' : 'عضو مساهم') }}
              </p>
            </div>
          </div>
          <button (click)="logout()" class="btn-logout-sidebar">
             <span class="icon">🚪</span> <span class="label-logout">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 280px;
      height: calc(100vh - 100px);
      position: fixed;
      top: 100px;
      right: 0;
      padding: 0 1.5rem 1.5rem;
      z-index: 900;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      box-sizing: border-box;
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
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(212, 175, 55, 0.25) transparent;
      
      &::-webkit-scrollbar {
        width: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background: rgba(212, 175, 55, 0.25);
        border-radius: 10px;
      }
    }
    .close-btn-mobile {
      display: none;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--primary);
      font-size: 1.5rem;
      width: 32px;
      height: 32px;
      border-radius: 10px;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      margin-right: auto; /* RTL alignment */
      transition: all 0.3s ease;
      line-height: 1;
      
      &:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
      }
    }
    
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

    .sidebar-footer {
      display: none;
      flex-direction: column;
      gap: 1rem;
      margin-top: auto;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .user-profile-summary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.04);
      padding: 0.75rem;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      .avatar-small {
        width: 36px;
        height: 36px;
        background: var(--primary);
        color: #000;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
      }
      .details-small {
        display: flex;
        flex-direction: column;
        .username-small {
          font-weight: 800;
          font-size: 0.85rem;
          color: #fff;
        }
        .role-tag-small {
          font-weight: 700;
          font-size: 0.7rem;
          color: var(--primary);
        }
      }
    }
    .btn-logout-sidebar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.85rem;
      border-radius: 16px;
      background: rgba(220, 38, 38, 0.1);
      border: 1px solid rgba(220, 38, 38, 0.2);
      color: #ff4d4d;
      font-weight: 800;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;
      .icon { font-size: 1.1rem; }
      &:hover {
        background: #dc2626;
        color: #fff;
        border-color: #dc2626;
      }
    }
    .badge-count {
      background: #ef4444;
      color: #fff;
      font-size: 0.75rem;
      font-weight: 900;
      padding: 0.25rem 0.55rem;
      border-radius: 50px;
      margin-right: auto; /* RTL alignment to push to the left side */
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      min-width: 18px;
    }
    
    @keyframes pulse-badge {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
      }
      50% {
        transform: scale(1.08);
        box-shadow: 0 0 18px rgba(239, 68, 68, 0.7);
      }
    }
    .animate-pulse-badge {
      animation: pulse-badge 2s infinite ease-in-out;
    }
    
    @media (max-width: 1024px) {
      .sidebar { width: 240px; }
    }

    @media (max-width: 768px) {
      .sidebar { 
        position: fixed; 
        right: -340px; 
        top: 0;
        height: 100vh;
        padding: 0.85rem;
        width: 300px;
        max-width: 85vw;
        z-index: 1100;
        box-sizing: border-box;
        
        &.active { 
          right: 0; 
        } 
      }
      .sidebar-inner { 
        border-radius: 24px; 
        box-sizing: border-box;
        padding: 1.5rem 1rem;
      }
      .close-btn-mobile {
        display: flex !important;
        margin-bottom: 1.5rem !important;
      }
      .nav-item {
        padding: 0.8rem 1rem !important;
        border-radius: 16px !important;
        gap: 1rem !important;
        .icon { font-size: 1.4rem !important; }
        .label { font-size: 0.95rem !important; }
      }
      .sidebar-footer { 
        display: flex; 
        padding-top: 1rem !important;
        margin-top: 1.5rem !important;
      }
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  dataService = inject(DataService);

  private pollInterval: any;

  ngOnInit() {
    if (this.authService.isStaff()) {
      this.dataService.refreshPendingCount();
      this.pollInterval = setInterval(() => {
        if (this.authService.isStaff()) {
          this.dataService.refreshPendingCount();
        }
      }, 30000);
    }
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  closeSidebar() {
    document.querySelector('.sidebar')?.classList.remove('active');
    document.querySelector('.sidebar-overlay')?.classList.remove('active');
  }

  logout() {
    this.closeSidebar();
    this.authService.logout();
  }
}
