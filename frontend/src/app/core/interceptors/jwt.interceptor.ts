import { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();
  const isAuthRequest = req.url.includes('/login') || req.url.includes('/signup') || req.url.includes('/forgot-password');
  const isSessionCheck = req.headers.has('X-Session-Check');

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  if (!token || isAuthRequest || isSessionCheck) {
    return next(req);
  }

  return authService.ensureActiveSession().pipe(
    switchMap(active => {
      if (!active) {
        return throwError(() => new HttpErrorResponse({
          status: 403,
          statusText: 'Forbidden',
          error: { message: 'Your account has been deactivated. Please sign in again.' }
        }));
      }

      return next(req);
    })
  );
};
