import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="mesh-gradient"></div>
      <div class="pattern-overlay"></div>
      
      <div class="login-glass-card animate-spring">
        <div class="card-glow"></div>
        
        <div class="header">
          <div class="logo-container">
            <img src="logo-gold.png" alt="جمعية وااد زينب" class="login-logo">
          </div>
          <h1 class="islamic-header text-gradient">جمعية وااد زينب</h1>
          <p class="subtitle">نظام إدارة حصص الذهب والمدخرات</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
          <div class="form-group">
            <label>البريد الإلكتروني</label>
            <div class="input-modern">
              <span class="icon">📧</span>
              <input 
                type="email" 
                name="email" 
                [(ngModel)]="email" 
                required 
                placeholder="mail@example.com"
                dir="ltr"
              >
            </div>
          </div>

          <div class="form-group">
            <label>كلمة المرور</label>
            <div class="input-modern">
              <span class="icon">🔒</span>
              <input 
                type="password" 
                name="password" 
                [(ngModel)]="password" 
                required 
                placeholder="••••••••"
                dir="ltr"
              >
            </div>
          </div>

          <button type="submit" class="btn btn-primary login-btn" [disabled]="loading()">
            <span *ngIf="!loading()">دخول للنظام</span>
            <span *ngIf="loading()">جاري التحقق...</span>
          </button>
        </form>

        <div class="footer-text">
          <p>﷽</p>
          <span>نظام موثق وآمن بنسبة 100%</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      position: relative; padding: 2rem;
    }

    .login-glass-card {
      box-sizing: border-box;
      width: 100%; max-width: 480px; background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border); border-radius: 40px; padding: 3.5rem;
      backdrop-filter: blur(30px); position: relative; z-index: 10;
      box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(212, 175, 55, 0.2);
    }

    .card-glow {
      position: absolute; inset: 0; border-radius: 40px;
      background: radial-gradient(circle at top right, rgba(212, 175, 55, 0.15), transparent);
      pointer-events: none;
    }

    .header {
      text-align: center; margin-bottom: 3.5rem;
      .logo-container {
        width: 120px; height: 120px; background: rgba(255, 255, 255, 0.03);
        border: 2px solid var(--primary); border-radius: 35px;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 1.5rem; overflow: hidden;
        box-shadow: 0 0 40px rgba(212, 175, 55, 0.2);
        .login-logo { width: 100%; height: 100%; object-fit: contain; padding: 10px; }
      }
      h1 { font-size: 2.5rem; margin-bottom: 0.5rem; font-family: 'Amiri', serif; }
      .subtitle { color: var(--text-muted); font-weight: 600; font-size: 1.1rem; }
    }

    .login-form { display: flex; flex-direction: column; gap: 2rem; }
    
    .form-group {
      label { display: block; margin-bottom: 0.75rem; font-size: 0.95rem; font-weight: 800; color: var(--text-muted); }
    }

    .input-modern {
      position: relative;
      .icon { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); font-size: 1.3rem; opacity: 0.7; }
      input {
        box-sizing: border-box;
        width: 100%; padding: 1.25rem 1.25rem 1.25rem 3.75rem; background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--glass-border); border-radius: 20px; color: #fff; font-size: 1.1rem; transition: all 0.3s ease;
        &:focus { outline: none; border-color: var(--primary); background: rgba(255, 255, 255, 0.1); box-shadow: 0 0 25px rgba(212, 175, 55, 0.15); }
      }
    }

    .login-btn { 
      box-sizing: border-box;
      width: 100%; padding: 1.4rem; border-radius: 20px; font-size: 1.2rem; font-weight: 900; margin-top: 1.5rem;
      background: linear-gradient(135deg, var(--primary), #b8860b);
      color: #000;
      box-shadow: 0 15px 35px rgba(212, 175, 55, 0.3);
    }

    .footer-text {
      text-align: center; margin-top: 2.5rem;
      p { font-family: 'Amiri', serif; font-size: 1.8rem; color: var(--primary); opacity: 0.6; margin-bottom: 0.5rem; }
      span { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; opacity: 0.5; }
    }

    @media (max-width: 768px) {
      .login-page {
        padding: 1rem;
      }
      .login-glass-card {
        padding: 2.25rem 1.5rem;
        border-radius: 28px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
      }
      .header {
        margin-bottom: 2rem;
        .logo-container {
          width: 90px;
          height: 90px;
          border-radius: 24px;
          margin-bottom: 1rem;
          .login-logo { padding: 6px; }
        }
        h1 { font-size: 1.8rem !important; }
        .subtitle { font-size: 0.95rem; }
      }
      .login-form {
        gap: 1.25rem;
      }
      .form-group label {
        margin-bottom: 0.5rem;
        font-size: 0.85rem;
      }
      .input-modern {
        .icon { left: 1rem; font-size: 1.15rem; }
        input {
          padding: 1.1rem 1.1rem 1.1rem 3.25rem;
          font-size: 1rem;
          border-radius: 16px;
        }
      }
      .login-btn {
        padding: 1.1rem;
        font-size: 1.1rem;
        border-radius: 16px;
        margin-top: 0.75rem;
      }
      .footer-text {
        margin-top: 1.75rem;
        p { font-size: 1.5rem; }
      }
    }

    @media (max-width: 480px) {
      .login-glass-card {
        padding: 1.75rem 1.15rem;
        border-radius: 20px;
      }
      .header {
        margin-bottom: 1.5rem;
        .logo-container {
          width: 80px;
          height: 80px;
          border-radius: 18px;
          margin-bottom: 0.75rem;
          .login-logo { padding: 5px; }
        }
        h1 { font-size: 1.5rem !important; }
        .subtitle { font-size: 0.85rem; }
      }
      .input-modern {
        .icon { left: 0.85rem; font-size: 1rem; }
        input {
          padding: 0.95rem 0.95rem 0.95rem 2.75rem;
          font-size: 0.95rem;
          border-radius: 12px;
        }
      }
      .login-btn {
        padding: 0.95rem;
        font-size: 1rem;
        border-radius: 12px;
        margin-top: 0.5rem;
      }
      .footer-text {
        margin-top: 1.25rem;
        p { font-size: 1.25rem; margin-bottom: 0.25rem; }
      }
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  
  email = '';
  password = '';
  loading = signal(false);

  async onSubmit() {
    if (!this.email || !this.password) return;
    
    this.loading.set(true);
    await this.authService.login(this.email, this.password);
    this.loading.set(false);
  }
}
