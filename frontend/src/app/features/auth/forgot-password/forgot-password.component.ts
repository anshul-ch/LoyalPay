import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-brand-navy to-brand-navy-dark flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <!-- Logo -->
        <div class="flex items-center gap-2 mb-8">
          <div class="w-9 h-9 bg-brand-orange rounded-xl flex items-center justify-center">
            <span class="text-white font-bold">LP</span>
          </div>
          <span class="font-bold text-gray-900 text-lg">LoyalPay</span>
        </div>

        @if (!sent) {
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Reset your password</h1>
             <p class="text-gray-500 text-sm mt-1">Enter your email and we'll generate a temporary password</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input formControlName="email" type="email" placeholder="you@example.com"
                class="input" [class.input-error]="form.get('email')!.invalid && form.get('email')!.touched"
                autocomplete="email">
              @if (form.get('email')!.invalid && form.get('email')!.touched) {
                <p class="text-brand-red text-xs mt-1">Please enter a valid email address.</p>
              }
            </div>
            <button type="submit" [disabled]="form.invalid || loading"
              class="btn-primary w-full justify-center inline-flex items-center gap-2">
              @if (loading) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Sending...
              } @else {
                Generate temporary password
              }
            </button>
          </form>
        } @else {
          <div class="text-center py-4">
            <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-gray-900">Check your email</h2>
            <p class="text-gray-500 text-sm mt-2">
              A temporary password has been sent to<br/>
              <span class="font-medium text-gray-700">{{ form.value.email }}</span>
            </p>
            <p class="text-xs text-gray-400 mt-3">Use it to sign in, then change your password immediately.</p>
          </div>
        }

        <div class="mt-6 pt-6 border-t border-gray-100 text-center">
          <a routerLink="/login" class="text-sm text-brand-orange font-semibold hover:underline inline-flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  loading = false;
  sent = false;
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.forgotPassword(this.form.value as any).subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) {
          this.toast.error(res.message || 'Unable to send temporary password.');
          this.cdr.markForCheck();
          return;
        }
        this.sent = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}


