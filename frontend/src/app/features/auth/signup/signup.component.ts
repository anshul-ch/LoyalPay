import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
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
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex">
      <!-- Left branding panel -->
      <div class="hidden lg:flex flex-col justify-between w-5/12 p-12 bg-brand-navy relative overflow-hidden">
        <div class="absolute -top-20 -right-20 w-64 h-64 bg-brand-orange/10 rounded-full pointer-events-none"></div>
        <div class="absolute -bottom-16 -left-16 w-56 h-56 bg-brand-red/10 rounded-full pointer-events-none"></div>
        <div class="relative flex items-center gap-3">
          <div class="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center">
            <span class="text-white font-bold text-lg">LP</span>
          </div>
          <span class="font-bold text-white text-xl">LoyalPay</span>
        </div>
        <div class="relative">
          <h2 class="text-4xl font-extrabold text-white leading-tight mb-4">
            Join thousands<br/>
            <span class="text-brand-yellow">earning rewards</span><br/>
            every day.
          </h2>
          <p class="text-gray-300">Create your account in under 2 minutes.</p>
          <div class="mt-8 grid grid-cols-2 gap-3">
            @for (stat of stats; track stat.label) {
              <div class="bg-white/5 border border-white/10 rounded-xl p-3">
                <p class="text-brand-yellow font-bold text-xl">{{ stat.value }}</p>
                <p class="text-gray-400 text-xs mt-0.5">{{ stat.label }}</p>
              </div>
            }
          </div>
        </div>
        <p class="relative text-gray-500 text-sm">&copy; 2026 LoyalPay</p>
      </div>

      <!-- Right form panel -->
      <div class="flex-1 flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div class="w-full max-w-md py-8">
          <!-- Mobile logo -->
          <div class="flex items-center gap-2 mb-8 lg:hidden">
            <div class="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">LP</span>
            </div>
            <span class="font-bold text-gray-900 text-lg">LoyalPay</span>
          </div>

          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Create account</h1>
            <p class="text-gray-500 text-sm mt-1">Join LoyalPay today — it's free</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input formControlName="fullName" type="text" placeholder="John Doe"
                class="input" [class.input-error]="f['fullName'].invalid && f['fullName'].touched"
                autocomplete="name">
              @if (f['fullName'].invalid && f['fullName'].touched) {
                <p class="text-brand-red text-xs mt-1">Full name must be at least 2 characters.</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input formControlName="email" type="email" placeholder="you@example.com"
                class="input" [class.input-error]="f['email'].invalid && f['email'].touched"
                autocomplete="email">
              @if (f['email'].invalid && f['email'].touched) {
                <p class="text-brand-red text-xs mt-1">Please enter a valid email address.</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
              <input formControlName="phone" type="tel" placeholder="10-digit mobile number"
                class="input" [class.input-error]="f['phone'].invalid && f['phone'].touched"
                autocomplete="tel">
              @if (f['phone'].invalid && f['phone'].touched) {
                <p class="text-brand-red text-xs mt-1">Phone must be exactly 10 digits.</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div class="relative">
                <input formControlName="password" [type]="showPassword ? 'text' : 'password'"
                  placeholder="••••••••" class="input pr-10"
                  [class.input-error]="f['password'].invalid && f['password'].touched"
                  autocomplete="new-password">
                <button type="button" (click)="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    @if (showPassword) {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    } @else {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    }
                  </svg>
                </button>
              </div>
              @if (f['password'].touched) {
                <ul class="mt-2 space-y-1">
                  @for (rule of passwordRules; track rule.key) {
                    <li class="text-xs flex items-center gap-1.5"
                      [class]="!f['password'].errors?.[rule.key] ? 'text-emerald-600' : 'text-gray-400'">
                      <span class="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] flex-shrink-0"
                        [class]="!f['password'].errors?.[rule.key]
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-300'">
                        @if (!f['password'].errors?.[rule.key]) { ✓ }
                      </span>
                      {{ rule.label }}
                    </li>
                  }
                </ul>
              }
            </div>

            <button type="submit" [disabled]="form.invalid || loading"
              class="btn-primary w-full justify-center inline-flex items-center gap-2 mt-2">
              @if (loading) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Creating account...
              } @else {
                Create account
              }
            </button>
          </form>

          <p class="text-center text-sm text-gray-500 mt-6">
            Already have an account?
            <a routerLink="/login" class="text-brand-orange font-semibold hover:underline">Sign in</a>
          </p>
          <p class="text-center text-sm text-gray-400 mt-3">
            <a routerLink="/" class="hover:text-brand-navy transition inline-flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Back to home
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class SignupComponent {
  loading = false;
  showPassword = false;

  stats = [
    { value: '10K+', label: 'Active users' },
    { value: '₹5Cr+', label: 'Transactions' },
    { value: '4.9★', label: 'User rating' },
    { value: '100%', label: 'Secure' }
  ];

  passwordRules = [
    { key: 'minLength', label: 'At least 8 characters' },
    { key: 'uppercase', label: 'One uppercase letter' },
    { key: 'digit', label: 'One number' },
    { key: 'special', label: 'One special character (@$!%*?&)' }
  ];

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    password: ['', [Validators.required, passwordValidator]]
  });

  get f() { return this.form.controls; }

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.signup(this.form.value as any).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success('Account created! Please sign in.');
        this.router.navigate(['/login']);
      },
      error: () => { this.loading = false; }
    });
  }
}
