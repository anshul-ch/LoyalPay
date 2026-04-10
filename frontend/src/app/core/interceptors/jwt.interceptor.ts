import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const tokens = auth.getStoredTokens();

  if (tokens?.accessToken && !req.url.includes('/refresh')) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${tokens.accessToken}` }
    });
  }

  return next(req);
};
