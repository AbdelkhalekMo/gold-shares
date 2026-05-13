import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { User } from '../interfaces/models.interface';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);

  currentUser = computed(() => this.currentUserSignal());
  isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  isAuthenticated = computed(() => !!this.currentUserSignal());

  constructor(
    private supabaseSvc: SupabaseService,
    private router: Router
  ) {
    this.loadSession();
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseSvc.client
        .from('users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('password', password)
        .maybeSingle();

      // Show real Supabase error if any (for debugging)
      if (error) {
        console.error('Supabase error:', error);
        Swal.fire({
          icon: 'error',
          title: 'خطأ في الاتصال',
          text: `كود الخطأ: ${error.code} - ${error.message}`,
          confirmButtonText: 'حسناً'
        });
        return false;
      }

      if (!data) {
        Swal.fire({
          icon: 'error',
          title: 'بيانات غير صحيحة',
          text: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#d4ff00'
        });
        return false;
      }

      const user = data as User;
      this.currentUserSignal.set(user);
      localStorage.setItem('gold_session', JSON.stringify(user));
      this.redirectUser(user);
      return true;

    } catch (err: any) {
      console.error('Unexpected error:', err);
      Swal.fire({
        icon: 'error',
        title: 'خطأ غير متوقع',
        text: err?.message || 'حدث خطأ، يرجى المحاولة مرة أخرى',
        confirmButtonText: 'حسناً'
      });
      return false;
    }
  }

  logout() {
    this.currentUserSignal.set(null);
    localStorage.removeItem('gold_session');
    this.router.navigate(['/login']);
  }

  private loadSession() {
    try {
      const session = localStorage.getItem('gold_session');
      if (session) {
        const user = JSON.parse(session) as User;
        this.currentUserSignal.set(user);
        this.refreshCurrentUser(); // Background refresh
      }
    } catch {
      localStorage.removeItem('gold_session');
    }
  }

  private redirectUser(user: User) {
    if (user.role === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/user']);
    }
  }

  updateUserState(partialUser: Partial<User>) {
    const current = this.currentUserSignal();
    if (current) {
      const updated = { ...current, ...partialUser };
      this.currentUserSignal.set(updated);
      localStorage.setItem('gold_session', JSON.stringify(updated));
    }
  }

  // Fetch fresh user data from Supabase and update session
  async refreshCurrentUser(): Promise<void> {
    const current = this.currentUserSignal();
    if (!current?.id) return;

    const { data, error } = await this.supabaseSvc.client
      .from('users')
      .select('id, email, username, share_type, advance, remaining, paid, totalAmount, isReceived, role, created_at')
      .eq('id', current.id)
      .single();

    if (error || !data) {
      console.error('Failed to refresh user data:', error);
      return;
    }

    this.currentUserSignal.set(data as User);
    localStorage.setItem('gold_session', JSON.stringify(data));
  }
}
