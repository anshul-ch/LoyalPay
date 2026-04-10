import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./view-edit/view-edit.component').then(m => m.ViewEditComponent)
  },
  {
    path: 'change-password',
    loadComponent: () => import('./change-password/change-password.component').then(m => m.ChangePasswordComponent)
  },
  {
    path: 'kyc',
    loadComponent: () => import('./kyc/kyc.component').then(m => m.KycComponent)
  }
];
