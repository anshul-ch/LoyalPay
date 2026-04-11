import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

function passwordValidator(c: AbstractControl) {
  const v = c.value ?? '';
  const errors: Record<string, boolean> = {};
  if (v.length < 8) errors['minLength'] = true;
  if (!/[A-Z]/.test(v)) errors['uppercase'] = true;
  if (!/\d/.test(v)) errors['digit'] = true;
  if (!/[@$!%*?&]/.test(v)) errors['special'] = true;
  return Object.keys(errors).length ? errors : null;
}

@Component({
  selector: 'app-force-password-change',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-brand-navy to-brand-navy-dark flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <div class="flex items-center gap-2 mb-6">
          <div class="w-9 h-9 bg-brand-orange rounded-xl flex items-center justify-center">
            <span class="text-white font-bold">LP</span>
          </div>
          <span class="font-bold text-gray-900 text-lg">LoyalPay</span>
        </div>

        <h1 class="text-2xl font-bold text-gray-900">Change Temporary Password</h1>
        <p class="text-gray-500 text-sm mt-1 mb-6">
          For your security, you must set a new password before continuing.
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Current Password (Temporary)</label>
            <input formControlName="currentPassword" [type]="showCurrent ? 'text' : 'password'" class="input" autocomplete="current-password">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input formControlName="newPassword" [type]="showNew ? 'text' : 'password'" class="input" autocomplete="new-password">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <input formControlName="confirmPassword" [type]="showConfirm ? 'text' : 'password'" class="input" autocomplete="new-password">
            @if (form.errors?.['mismatch'] && form.get('confirmPassword')?.touched) {
              <p class="text-brand-red text-xs mt-1">New password and confirm password must match.</p>
            }
          </div>

          <div class="flex gap-2 text-xs text-gray-500">
            <button type="button" class="underline" (click)="showCurrent = !showCurrent">Toggle current</button>
            <button type="button" class="underline" (click)="showNew = !showNew">Toggle new</button>
            <button type="button" class="underline" (click)="showConfirm = !showConfirm">Toggle confirm</button>
          </div>

          <button type="submit" [disabled]="form.invalid || loading" class="btn-primary w-full justify-center inline-flex items-center gap-2">
            @if (loading) {
              Updating...
            } @else {
              Update Password
            }
          </button>
        </form>

        <div class="mt-6 text-center">
          <a routerLink="/login" class="text-sm text-brand-orange font-semibold hover:underline">Back to sign in</a>
        </div>
      </div>
    </div>
  `
})
export class ForcePasswordChangeComponent {
  loading = false;
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  form = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, passwordValidator]],
    confirmPassword: ['', Validators.required]
  }, { validators: (group: AbstractControl) => {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }});

  constructor(
    private fb: FormBuilder,
    private profileSvc: ProfileService,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn() || !this.auth.requiresPasswordChange()) {
      this.router.navigate(['/login']);
    }
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.profileSvc.changePassword({
      currentPassword: this.form.value.currentPassword!,
      newPassword: this.form.value.newPassword!
    }).subscribe({
      next: res => {
        this.loading = false;
        if (!res.success) {
          this.toast.error(res.message || 'Unable to change password.');
          return;
        }

        this.auth.clearTokens();
        this.toast.success('Password changed. Please log in again.');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
