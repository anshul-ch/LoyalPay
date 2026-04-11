import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProfileService } from '../../../core/services/profile.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

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
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive],
  template: `
    <div class="max-w-2xl mx-auto space-y-6 page-enter">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">My Profile</h1>
        <p class="text-sm text-gray-500 mt-1">Manage your personal information</p>
      </div>

      <!-- Profile nav tabs -->
      <div class="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <a routerLink="/profile" routerLinkActive="bg-white shadow-sm text-gray-900"
          [routerLinkActiveOptions]="{exact:true}"
          class="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 transition">
          Profile
        </a>
        <a routerLink="/profile/change-password" routerLinkActive="bg-white shadow-sm text-gray-900"
          class="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 transition">
          Password
        </a>
        <a routerLink="/profile/kyc" routerLinkActive="bg-white shadow-sm text-gray-900"
          class="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 transition">
          KYC
        </a>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 class="font-semibold text-gray-900 mb-5">Change Password</h2>
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
            <div class="relative">
              <input formControlName="currentPassword" [type]="showCurrent ? 'text' : 'password'"
                placeholder="Enter current password" class="input pr-10">
              <button type="button" (click)="showCurrent = !showCurrent"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  @if (showCurrent) {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  } @else {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  }
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <div class="relative">
              <input formControlName="newPassword" [type]="showNew ? 'text' : 'password'"
                placeholder="Enter new password" class="input pr-10"
                [class.input-error]="f['newPassword'].invalid && f['newPassword'].touched">
              <button type="button" (click)="showNew = !showNew"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  @if (showNew) {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  } @else {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  }
                </svg>
              </button>
            </div>

            @if (f['newPassword'].touched) {
              <ul class="mt-2 space-y-1">
                @for (rule of passwordRules; track rule.key) {
                  <li class="text-xs flex items-center gap-1.5"
                    [class]="!f['newPassword'].errors?.[rule.key] ? 'text-emerald-600' : 'text-gray-400'">
                    <span class="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] flex-shrink-0"
                      [class]="!f['newPassword'].errors?.[rule.key]
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-gray-300'">
                      @if (!f['newPassword'].errors?.[rule.key]) { ✓ }
                    </span>
                    {{ rule.label }}
                  </li>
                }
              </ul>
            }
          </div>

          <div class="pt-2">
            <button type="submit" [disabled]="form.invalid || loading"
              class="btn-primary inline-flex items-center gap-2">
              @if (loading) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Updating...
              } @else {
                Update Password
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ChangePasswordComponent {
  loading = false;
  showCurrent = false;
  showNew = false;

  passwordRules = [
    { key: 'minLength', label: 'At least 8 characters' },
    { key: 'uppercase', label: 'One uppercase letter' },
    { key: 'digit', label: 'One number' },
    { key: 'special', label: 'One special character (@$!%*?&)' }
  ];

  form = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, passwordValidator]]
  });

  get f() { return this.form.controls; }

  constructor(
    private fb: FormBuilder,
    private profileSvc: ProfileService,
    private toast: ToastService,
    private auth: AuthService,
    private router: Router
  ) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.profileSvc.changePassword(this.form.value as any).subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) {
          this.toast.error(res.message || 'Unable to update password.');
          return;
        }

        this.auth.clearTokens();
        this.toast.success('Password updated successfully. Please log in again.');
        this.form.reset();
        this.router.navigate(['/login']);
      },
      error: () => { this.loading = false; }
    });
  }
}
