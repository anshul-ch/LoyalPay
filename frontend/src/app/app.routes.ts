import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Landing page
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },

  // Public auth routes
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // User portal
  {
    path: '',
    loadComponent: () => import('./layouts/user-shell/user-shell.component').then(m => m.UserShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'wallet',
        loadChildren: () => import('./features/wallet/wallet.routes').then(m => m.WALLET_ROUTES)
      },
      {
        path: 'rewards',
        loadChildren: () => import('./features/rewards/rewards.routes').then(m => m.REWARDS_ROUTES)
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES)
      }
    ]
  },

  // Admin portal
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'Admin' },
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },

  { path: '**', redirectTo: '' }
];
