import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="navbar animate-fade-in">
      <div class="container">
        <div class="logo">
          <span class="gold-text">G</span>old Shares
        </div>
        
        <div class="user-info">
          <div class="details">
            <p class="name">{{ authService.currentUser()?.username }}</p>
            <p class="role">{{ authService.isAdmin() ? 'أدمن' : 'مستثمر' }}</p>
          </div>
          <button (click)="authService.logout()" class="logout-btn">
             تسجيل الخروج
          </button>
        </div>

        <button class="mobile-menu-toggle" (click)="toggleSidebar()">
          ☰
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      height: 70px;
      background: #fff;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .container {
      width: 100%;
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1a1a1a;
      .gold-text { color: var(--primary-dark); }
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .details {
      text-align: left;
      .name { font-weight: 700; font-size: 0.95rem; }
      .role { font-size: 0.75rem; color: var(--text-muted); }
    }
    .logout-btn {
      padding: 0.5rem 1rem;
      background: #fee2e2;
      color: #991b1b;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.85rem;
      &:hover { background: #fecaca; }
    }
    .mobile-menu-toggle {
      display: none;
      font-size: 1.5rem;
      background: none;
      border: none;
      cursor: pointer;
    }
    @media (max-width: 768px) {
      .user-info { display: none; }
      .mobile-menu-toggle { display: block; }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);

  toggleSidebar() {
    document.querySelector('.sidebar')?.classList.toggle('active');
  }
}
