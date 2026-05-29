import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthAttempt = req.url.includes('/login') || req.url.includes('/signup') || req.url.includes('/forgot-password') || req.url.includes('/logout');

      if (err.status === 401 && !isAuthAttempt) {
        // Token is invalid/expired — clear session silently (no extra HTTP call)
        authService.clearSession('Your session has expired. Please sign in again.');
      }

      return throwError(() => err);
    })
  );
};
