import { Routes } from '@angular/router';
import { authGuard, adminGuard, userGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./shared/layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'pending',
        loadComponent: () => import('./features/admin/pending/pending.component').then(m => m.PendingComponent)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./features/admin/approved-list/approved-list.component').then(m => m.ApprovedListComponent)
      },
      {
        path: 'transactions/:userId',
        loadComponent: () => import('./features/admin/transactions/transactions.component').then(m => m.TransactionsComponent)
      },
      {
        path: 'deliveries',
        loadComponent: () => import('./features/admin/deliveries/deliveries.component').then(m => m.DeliveriesComponent)
      },
      {
        path: 'late-payments',
        loadComponent: () => import('./features/admin/late-payments/late-payments.component').then(m => m.LatePaymentsComponent)
      },
      {
        path: 'user-profile/:id',
        loadComponent: () => import('./features/admin/user-profile-view/user-profile-view.component').then(m => m.UserProfileViewComponent)
      },
      {
        path: 'profiles-list',
        loadComponent: () => import('./features/admin/user-profiles-list/user-profiles-list.component').then(m => m.UserProfilesListComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/user/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },
  {
    path: 'user',
    canActivate: [authGuard, userGuard],
    loadComponent: () => import('./shared/layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/user/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'new-transaction',
        loadComponent: () => import('./features/user/new-transaction/new-transaction.component').then(m => m.NewTransactionComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/user/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
