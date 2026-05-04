import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err) => {
      const isAuthAttempt = req.url.includes('/login') || req.url.includes('/signup') || req.url.includes('/forgot-password');
      const message = err?.error?.message || '';
      const isInactiveMessage = /deactivated|inactive/i.test(message);
      if ((err.status === 401 || (err.status === 403 && isInactiveMessage)) && !isAuthAttempt) {
        authService.logout();
      }
      return throwError(() => err);
    })
  );
};
