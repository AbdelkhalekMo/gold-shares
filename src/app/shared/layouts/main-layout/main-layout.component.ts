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
    @media (max-width: 768px) {
      .content-area { padding: 1.5rem; }
    }
  `]
})
export class MainLayoutComponent {}
