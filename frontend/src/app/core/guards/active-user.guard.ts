import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ProfileService } from '../services/profile.service';
import { firstValueFrom } from 'rxjs';

export const activeUserGuard: CanActivateFn = async (route, state) => {
  const profileService = inject(ProfileService);
  const router = inject(Router);

  try {
    const response = await firstValueFrom(profileService.getProfile());
    const profile = response.data;

    if (profile && !profile.isActive) {
      // User is deactivated - redirect to deactivation message page
      router.navigate(['/account-deactivated'], {
        queryParams: { reason: profile.inactiveReason }
      });
      return false;
    }

    return true;
  } catch (error) {
    // If profile fetch fails, let the component handle it
    return true;
  }
};
