import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="navbar animate-spring">
      <div class="container glass-nav">
        <div class="logo">
          <img src="logo-gold.png" alt="جمعية وااد زينب" class="logo-img">
          <div class="logo-text">
            <span class="text-gradient">جمعية وااد زينب</span>
          </div>
        </div>
        
        <div class="user-actions">
          <div class="user-badge">
            <div class="avatar">👤</div>
            <div class="details">
              <p class="username">{{ authService.currentUser()?.username }}</p>
              <p class="role-tag">{{ authService.isAdmin() ? 'مدير النظام' : 'عضو مساهم' }}</p>
            </div>
          </div>
          <button (click)="authService.logout()" class="btn-logout">
             <span class="icon">🚪</span>
          </button>
        </div>

        <button class="menu-toggle" (click)="toggleSidebar()">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: sticky;
      top: 0;
      z-index: 1000;
      padding: 0 2rem;
    }
    .glass-nav {
      width: 100%;
      max-width: 1400px;
      height: 70px;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      .logo-img {
        height: 50px;
        width: auto;
        filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.3));
      }
      .logo-text {
        font-family: 'Amiri', serif;
        font-size: 1.8rem;
        font-weight: 800;
      }
    }
    .user-actions {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .user-badge {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.5rem 1rem;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      .avatar { font-size: 1.2rem; background: var(--primary); color: #000; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 10px; }
      .username { font-weight: 800; font-size: 0.9rem; }
      .role-tag { font-size: 0.7rem; color: var(--primary); font-weight: 700; text-transform: uppercase; }
    }
    .btn-logout {
      background: rgba(220, 38, 38, 0.1);
      border: 1px solid rgba(220, 38, 38, 0.2);
      color: #ff4d4d;
      width: 40px; height: 40px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      &:hover { background: #dc2626; color: #fff; transform: rotate(15deg); }
    }
    .menu-toggle {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none; border: none; cursor: pointer;
      span { width: 25px; height: 2px; background: var(--primary); border-radius: 2px; }
    }
    @media (max-width: 768px) {
      .user-actions { display: none; }
      .menu-toggle { display: flex; }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);

  toggleSidebar() {
    document.querySelector('.sidebar')?.classList.toggle('active');
  }
}
