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
      <div class="menu-items">
        <ng-container *ngIf="authService.isAdmin(); else userMenu">
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="menu-link">
             الرئيسية
          </a>
          <a routerLink="/admin/users" routerLinkActive="active" class="menu-link">
             المستخدمين
          </a>
          <a routerLink="/admin/pending" routerLinkActive="active" class="menu-link">
             المعاملات المعلقة
          </a>
          <a routerLink="/admin/transactions" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="menu-link">
             المعاملات المؤكدة
          </a>
          <a routerLink="/admin/deliveries" routerLinkActive="active" class="menu-link">
             التسليمات
          </a>
          <a routerLink="/admin/late-payments" routerLinkActive="active" class="menu-link">
             المتأخرون
          </a>
        </ng-container>

        <ng-template #userMenu>
          <a routerLink="/user" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="menu-link">
             حسابي
          </a>
          <a routerLink="/user/new-transaction" routerLinkActive="active" class="menu-link">
             إضافة معاملة
          </a>
        </ng-template>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: calc(100vh - 70px);
      background: #fff;
      border-left: 1px solid var(--border-color);
      padding: 1.5rem;
      position: sticky;
      top: 70px;
      transition: all 0.3s ease;
    }
    .menu-items {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .menu-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      text-decoration: none;
      color: var(--text-muted);
      font-weight: 600;
      border-radius: 12px;
      transition: all 0.2s ease;
      
      &:hover {
        background: #f8fafc;
        color: var(--text-main);
      }
      
      &.active {
        background: var(--primary);
        color: #000;
      }
    }
    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        right: -260px;
        top: 70px;
        height: 100vh;
        z-index: 99;
        &.active { right: 0; }
      }
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);
}
