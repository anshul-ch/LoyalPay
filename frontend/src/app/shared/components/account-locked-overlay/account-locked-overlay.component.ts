import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AccountLockService } from '../../../core/services/account-lock.service';

@Component({
  selector: 'app-account-locked-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (locked) {
      <div class="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-2xl rounded-3xl bg-white border border-red-100 shadow-2xl overflow-hidden">
          <div class="px-6 py-5 sm:px-8 sm:py-6 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
            <p class="text-xs font-bold tracking-[0.12em] uppercase text-brand-red">Account Restricted</p>
            <h2 class="mt-1 text-2xl sm:text-3xl font-black text-gray-900">Your account has been deactivated</h2>
          </div>
          <div class="px-6 py-6 sm:px-8 sm:py-7">
            <p class="text-base sm:text-lg leading-relaxed text-gray-700 font-medium">{{ message }}</p>
            <div class="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
              <p class="text-sm sm:text-base text-red-800 font-semibold">
                For reactivation support, please contact the LoyalPay support team.
              </p>
            </div>
            <p class="mt-5 text-sm text-gray-500">
              This screen blocks all actions until the account status is changed by support.
            </p>
          </div>
        </div>
      </div>
    }
  `
})
export class AccountLockedOverlayComponent {
  locked = false;
  message = 'Your account has been deactivated. Please contact support for reactivation.';

  private readonly destroyRef = inject(DestroyRef);

  constructor(private readonly accountLock: AccountLockService) {
    this.accountLock.locked$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.locked = value;
      });

    this.accountLock.message$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.message = value || this.message;
      });
  }
}
