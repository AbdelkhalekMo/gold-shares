import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card animate-fade-in">
        <div class="header">
          <div class="logo"><span>G</span>old Shares</div>
          <h1>مرحباً بك</h1>
          <p>سجل الدخول لإدارة حسابك</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label>البريد الإلكتروني</label>
            <input 
              type="email" 
              name="email" 
              [(ngModel)]="email" 
              required 
              placeholder="example@mail.com"
              dir="ltr"
            >
          </div>

          <div class="form-group">
            <label>كلمة المرور</label>
            <input 
              type="password" 
              name="password" 
              [(ngModel)]="password" 
              required 
              placeholder="••••••••"
              dir="ltr"
            >
          </div>

          <button type="submit" class="btn btn-primary w-full" [disabled]="loading">
            {{ loading ? 'جاري التحميل...' : 'دخول' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f4f7f6 0%, #e2e8f0 100%);
      padding: 1.5rem;
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      background: #fff;
      padding: 2.5rem;
      border-radius: 24px;
      box-shadow: var(--shadow-lg);
      border: 1px solid rgba(255, 255, 255, 0.8);
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
      .logo {
        font-size: 2rem;
        font-weight: 900;
        margin-bottom: 1rem;
        span { color: var(--primary-dark); }
      }
      h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; }
      p { color: var(--text-muted); font-size: 0.875rem; }
    }
    .w-full { width: 100%; margin-top: 1rem; }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  
  email = '';
  password = '';
  loading = false;

  async onSubmit() {
    if (!this.email || !this.password) return;
    
    this.loading = true;
    await this.authService.login(this.email, this.password);
    this.loading = false;
  }
}
