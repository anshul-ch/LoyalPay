import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const required = route.data['role'] as string;
  const current = auth.currentUser$.value?.role;

  if (current === required) {
    return true;
  }

  if (current === 'Admin') {
    return router.createUrlTree(['/admin/dashboard']);
  }

  return router.createUrlTree(['/dashboard']);
};
