import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { LoadingService } from '../services/loading.service';
import { AccountLockService } from '../services/account-lock.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const loading = inject(LoadingService);
  const accountLock = inject(AccountLockService);

  const getMessage = (error: HttpErrorResponse): string => {
    return (
      error.error?.message ||
      error.error?.errors?.[0] ||
      error.error?.title ||
      'An error occurred.'
    );
  };

  const isInactiveOrDeactivated = (message: string): boolean => {
    const lower = message.toLowerCase();
    return lower.includes('inactive') || lower.includes('deactivated') || lower.includes('not active');
  };

  // Skip loading indicator for background/silent requests
  const silent = req.headers.has('X-Silent');
  if (!silent) loading.show();

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401s are handled by token-refresh interceptor — don't show toast here
      if (error.status === 401) {
        return throwError(() => error);
      }

      if (error.status === 404 && req.url.includes('/document')) {
        toast.error('Document not found.');
        return throwError(() => error);
      }

      const msg = getMessage(error);
      if (error.status >= 400 && error.status < 500 && isInactiveOrDeactivated(msg)) {
        const lockMessage = `${msg} Please contact support for account reactivation.`;
        accountLock.lock(lockMessage);
        toast.error(lockMessage);

        // Keep the user on the shell and block all actions with a global overlay.
        // Do not force logout so they can still read the deactivation reason.

        return throwError(() => error);
      }

      if (error.status >= 400 && error.status < 500) {
        toast.error(msg);
      } else if (error.status === 0) {
        toast.error('Cannot reach backend services. Start Gateway/Auth services and try again.');
      } else if (error.status >= 500) {
        toast.error('Something went wrong. Please try again.');
      }

      return throwError(() => error);
    }),
    finalize(() => { if (!silent) loading.hide(); })
  );
};
