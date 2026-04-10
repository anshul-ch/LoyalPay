import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ProfileService } from '../services/profile.service';
import { map, catchError, of } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const kycGuard: CanActivateFn = () => {
  const profileSvc = inject(ProfileService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return profileSvc.getKycStatus().pipe(
    map(r => {
      if (r.data?.status === 'Approved') return true;
      const status = r.data?.status ?? 'Not Submitted';
      toast.error(`KYC ${status}. Please complete identity verification to use this feature.`);
      return router.createUrlTree(['/profile/kyc']);
    }),
    catchError(() => of(router.createUrlTree(['/profile/kyc'])))
  );
};
