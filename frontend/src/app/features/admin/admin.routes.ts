import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./users/users-list.component').then(m => m.UsersListComponent)
  },
  {
    path: 'kyc',
    loadComponent: () => import('./kyc-management/kyc-management.component').then(m => m.KycManagementComponent)
  },
  {
    path: 'campaigns',
    loadComponent: () => import('./campaigns/campaigns.component').then(m => m.CampaignsComponent)
  }
];
