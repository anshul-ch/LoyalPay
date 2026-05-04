import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { UserLayoutComponent } from './layout/user-layout/user-layout.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { SupportLayoutComponent } from './layout/support-layout/support-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/public/home/home.component').then(m => m.HomeComponent) },
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'signup', loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent) }
    ]
  },
  {
    path: 'user',
    component: UserLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'User' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/user/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'transactions', loadComponent: () => import('./features/user/transactions/transactions.component').then(m => m.TransactionsComponent) },
      { path: 'rewards', loadComponent: () => import('./features/user/rewards/rewards.component').then(m => m.RewardsComponent) },
      { path: 'profile', loadComponent: () => import('./features/user/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'kyc', loadComponent: () => import('./features/user/kyc/kyc.component').then(m => m.KycComponent) },
      { path: 'support', loadComponent: () => import('./features/user/support/support.component').then(m => m.SupportComponent) }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'Admin' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/users/admin-users.component').then(m => m.AdminUsersComponent) },
      { path: 'kyc', loadComponent: () => import('./features/admin/kyc/admin-kyc.component').then(m => m.AdminKycComponent) },
      { path: 'campaigns', loadComponent: () => import('./features/admin/campaigns/admin-campaigns.component').then(m => m.AdminCampaignsComponent) },
      { path: 'tickets', loadComponent: () => import('./features/support/tickets/support-tickets.component').then(m => m.SupportTicketsComponent) },
      { path: 'staff', loadComponent: () => import('./features/admin/staff/admin-staff.component').then(m => m.AdminStaffComponent) }
    ]
  },
  {
    path: 'support',
    component: SupportLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'Support' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/support/dashboard/support-dashboard.component').then(m => m.SupportDashboardComponent) },
      { path: 'tickets', loadComponent: () => import('./features/support/tickets/support-tickets.component').then(m => m.SupportTicketsComponent) },
      { path: 'tools', redirectTo: 'tickets' },
      { path: 'users', redirectTo: 'tickets' }
    ]
  },
  { path: '**', redirectTo: '' }
];
