import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRole = route.data['role'];

  if (!authService.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  return authService.ensureActiveSession().pipe(
    map(active => {
      const userRole = authService.getRole();

      if (active && userRole === expectedRole) {
        return true;
      }

      if (userRole === 'Admin') return router.parseUrl('/admin');
      if (userRole === 'Support') return router.parseUrl('/support');
      if (userRole === 'User') return router.parseUrl('/user');
      return router.parseUrl('/login');
    })
  );
};
