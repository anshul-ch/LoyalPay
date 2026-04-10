import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { LoadingService } from '../services/loading.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const loading = inject(LoadingService);

  loading.show();

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return throwError(() => error);
      }

      if (error.status === 404 && req.url.includes('/document')) {
        toast.error('Document not found.');
        return throwError(() => error);
      }

      if (error.status >= 400 && error.status < 500) {
        const msg =
          error.error?.message ||
          error.error?.errors?.[0] ||
          error.error?.title ||
          'An error occurred.';
        toast.error(msg);
      } else if (error.status === 0) {
        toast.error('Cannot reach backend services. Start Gateway/Auth services and try again.');
      } else if (error.status >= 500) {
        toast.error('Something went wrong. Please try again.');
      }

      return throwError(() => error);
    }),
    finalize(() => loading.hide())
  );
};
