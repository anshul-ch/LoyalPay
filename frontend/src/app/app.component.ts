import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import { AccountLockedOverlayComponent } from './shared/components/account-locked-overlay/account-locked-overlay.component';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from './core/services/auth.service';
import { ProfileService } from './core/services/profile.service';
import { AccountLockService } from './core/services/account-lock.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, SpinnerComponent, AccountLockedOverlayComponent],
  template: `
    <router-outlet></router-outlet>
    <app-toast></app-toast>
    <app-spinner></app-spinner>
    <app-account-locked-overlay></app-account-locked-overlay>
  `
})
export class AppComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly profileService: ProfileService,
    private readonly accountLock: AccountLockService
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.probeAccountStatus();
      });

    this.auth.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        if (!user) {
          this.accountLock.unlock();
          return;
        }

        this.probeAccountStatus();
      });
  }

  private probeAccountStatus(): void {
    if (!this.auth.isLoggedIn()) {
      this.accountLock.unlock();
      return;
    }

    this.profileService.getProfile().subscribe({
      next: res => {
        const profile = res.data as { isActive?: boolean; inactiveReason?: string } | undefined;
        if (res.success && profile?.isActive === false) {
          const reason = profile.inactiveReason?.trim();
          const message = reason
            ? `Your account has been deactivated. Reason: ${reason}. Please contact support for account reactivation.`
            : 'Your account has been deactivated. Please contact support for account reactivation.';
          this.accountLock.lock(message);
        }
      },
      error: () => {
        // Deactivation errors are handled globally in the error interceptor.
      }
    });
  }
}
