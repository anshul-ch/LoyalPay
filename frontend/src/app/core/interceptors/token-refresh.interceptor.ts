import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, throwError, switchMap, filter, take, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status !== 401 ||
        req.url.includes('/refresh') ||
        req.url.includes('/login') ||
        req.url.includes('/signup') ||
        req.url.includes('/forgot-password')
      ) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        return refreshTokenSubject.pipe(
          filter(token => token !== null),
          take(1),
          switchMap(token => {
            if (!token) {
              auth.clearTokens();
              router.navigate(['/login']);
              return throwError(() => error);
            }

            return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
          })
        );
      }

      if (!auth.getStoredTokens()?.refreshToken) {
        auth.clearTokens();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      isRefreshing = true;
      refreshTokenSubject.next(null);

      return auth.refresh().pipe(
        switchMap(res => {
          if (!res.success || !res.data?.accessToken) {
            throw new Error('Refresh failed');
          }

          isRefreshing = false;
          const newToken = res.data.accessToken;
          refreshTokenSubject.next(newToken);
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
        }),
        catchError(err => {
          isRefreshing = false;
          refreshTokenSubject.next('');
          auth.clearTokens();
          router.navigate(['/login']);
          return throwError(() => err);
        })
      );
    })
  );
};
