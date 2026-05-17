import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    <div class="layout-wrapper">
      <app-navbar></app-navbar>
      <div class="main-container">
        <app-sidebar></app-sidebar>
        <div class="sidebar-overlay" (click)="closeSidebar()"></div>
        <main class="content-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout-wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .main-container {
      display: flex;
      flex: 1;
    }
    .content-area {
      flex: 1;
      padding: 2.5rem;
      background: transparent;
      min-width: 0;
      position: relative;
    }
    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 850;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    @media (max-width: 768px) {
      .content-area { padding: 1.25rem; }
      .sidebar-overlay.active {
        display: block;
        opacity: 1;
      }
    }
  `]
})
export class MainLayoutComponent {
  closeSidebar() {
    document.querySelector('.sidebar')?.classList.remove('active');
    document.querySelector('.sidebar-overlay')?.classList.remove('active');
  }
}
