import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex">

      <!-- Left branding panel -->
      <div class="hidden lg:flex flex-col justify-between w-5/12 p-12 bg-brand-navy relative overflow-hidden">
        <div class="absolute -top-24 -right-24 w-80 h-80 bg-brand-orange/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-20 -left-20 w-72 h-72 bg-brand-red/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-yellow/5 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Logo -->
        <div class="relative flex items-center gap-3">
          <div class="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-lg shadow-brand-orange/30">
            <span class="text-white font-bold text-lg">LP</span>
          </div>
          <span class="font-bold text-white text-xl tracking-tight">LoyalPay</span>
        </div>

        <!-- Hero text -->
        <div class="relative">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 mb-6">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-white/80 text-xs font-medium">Join 10,000+ users today</span>
          </div>
          <h2 class="text-4xl font-extrabold text-white leading-tight mb-4">
            Join thousands<br/>
            <span class="text-brand-yellow">earning rewards</span><br/>
            every day.
          </h2>
          <p class="text-gray-300 mb-8">Create your account in under 2 minutes.</p>

          <div class="grid grid-cols-2 gap-3">
            @for (stat of stats; track stat.label) {
              <div class="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition-colors">
                <p class="text-brand-yellow font-bold text-2xl">{{ stat.value }}</p>
                <p class="text-gray-400 text-xs mt-0.5">{{ stat.label }}</p>
              </div>
            }
          </div>

          <!-- Steps -->
          <div class="mt-8 space-y-3">
            @for (step of steps; track step.title; let i = $index) {
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-full bg-brand-orange/20 border border-brand-orange/40 flex items-center justify-center flex-shrink-0">
                  <span class="text-brand-orange text-xs font-bold">{{ i + 1 }}</span>
                </div>
                <div>
                  <p class="text-white text-sm font-medium">{{ step.title }}</p>
                  <p class="text-gray-400 text-xs">{{ step.desc }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <p class="relative text-gray-500 text-sm">&copy; 2026 LoyalPay. All rights reserved.</p>
      </div>

      <!-- Right form panel -->
      <div class="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden overflow-y-auto">
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle, #003049 1px, transparent 1px); background-size: 24px 24px;"></div>
        <div class="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative w-full max-w-md py-8">
          <!-- Mobile logo -->
          <div class="flex items-center gap-2 mb-8 lg:hidden">
            <div class="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center shadow-md shadow-brand-orange/30">
              <span class="text-white font-bold text-sm">LP</span>
            </div>
            <span class="font-bold text-gray-900 text-lg">LoyalPay</span>
          </div>

          <!-- Card -->
          <div class="bg-white rounded-3xl shadow-xl shadow-gray-200/80 border border-gray-100 p-8">
            <div class="mb-7">
              <h1 class="text-2xl font-bold text-gray-900">Create account</h1>
              <p class="text-gray-500 text-sm mt-1">Join LoyalPay today — it's free</p>
            </div>

            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" autocomplete="on">

              <!-- Full Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div class="relative">
                  <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <input formControlName="fullName" type="text" placeholder="Anshul Kumar"
                    name="name" autocomplete="name"
                    class="input pl-10" [class.input-error]="f['fullName'].invalid && f['fullName'].touched">
                </div>
                @if (f['fullName'].invalid && f['fullName'].touched) {
                  <p class="text-brand-red text-xs mt-1.5 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                    Full name must be at least 2 characters.
                  </p>
                }
              </div>

              <!-- Email -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <div class="relative">
                  <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                    </svg>
                  </div>
                  <input formControlName="email" type="email" placeholder="you@example.com"
                    name="email" autocomplete="email"
                    class="input pl-10" [class.input-error]="f['email'].invalid && f['email'].touched">
                </div>
                @if (f['email'].invalid && f['email'].touched) {
                  <p class="text-brand-red text-xs mt-1.5 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                    Please enter a valid email address.
                  </p>
                }
              </div>

              <!-- Phone -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
                <div class="relative">
                  <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                  </div>
                  <input formControlName="phone" type="tel" placeholder="10-digit mobile number"
                    name="tel" autocomplete="tel"
                    class="input pl-10" [class.input-error]="f['phone'].invalid && f['phone'].touched">
                </div>
                @if (f['phone'].invalid && f['phone'].touched) {
                  <p class="text-brand-red text-xs mt-1.5 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                    Phone must be exactly 10 digits.
                  </p>
                }
              </div>

              <!-- Password -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div class="relative">
                  <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <input formControlName="password" [type]="showPassword ? 'text' : 'password'"
                    placeholder="••••••••" name="new-password" autocomplete="new-password"
                    class="input pl-10 pr-10" [class.input-error]="f['password'].invalid && f['password'].touched">
                  <button type="button" (click)="showPassword = !showPassword"
                    class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
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

                <!-- Password strength bar -->
                @if (f['password'].value) {
                  <div class="mt-2">
                    <div class="flex gap-1 mb-1.5">
                      @for (s of [1,2,3,4]; track s) {
                        <div class="h-1 flex-1 rounded-full transition-all duration-300"
                          [class]="s <= passwordStrength ? strengthBarColor : 'bg-gray-100'"></div>
                      }
                    </div>
                    <p class="text-xs" [class]="strengthTextColor">{{ strengthLabel }}</p>
                  </div>
                }

                @if (f['password'].dirty || f['password'].value) {
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

              <!-- Confirm Password -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div class="relative">
                  <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <input formControlName="confirmPassword" [type]="showConfirmPassword ? 'text' : 'password'"
                    placeholder="••••••••" autocomplete="new-password"
                    class="input pl-10 pr-10" [class.input-error]="(f['confirmPassword'].dirty || f['confirmPassword'].value) && !!form.errors?.['mismatch']">
                  <button type="button" (click)="showConfirmPassword = !showConfirmPassword"
                    class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      @if (showConfirmPassword) {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      } @else {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      }
                    </svg>
                  </button>
                </div>
                @if ((f['confirmPassword'].dirty || f['confirmPassword'].value) && form.errors?.['mismatch']) {
                  <p class="text-brand-red text-xs mt-1.5">Password and confirm password must match.</p>
                }
              </div>

              <button type="submit" [disabled]="form.invalid || loading"
                class="btn-primary w-full justify-center inline-flex items-center gap-2 py-3 text-base mt-2 shadow-lg shadow-brand-orange/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                @if (loading) {
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Creating account...
                } @else {
                  Create account
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                }
              </button>
            </form>

            <div class="relative my-5">
              <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-100"></div></div>
              <div class="relative flex justify-center"><span class="bg-white px-3 text-xs text-gray-400">Already have an account?</span></div>
            </div>

            <a routerLink="/login"
              class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-brand-orange hover:text-brand-orange transition-all duration-150">
              Sign in instead
            </a>
          </div>

          <p class="text-center text-sm text-gray-400 mt-5">
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
  showConfirmPassword = false;

  stats = [
    { value: '10K+', label: 'Active users' },
    { value: '₹5Cr+', label: 'Transactions' },
    { value: '4.9★', label: 'User rating' },
    { value: '100%', label: 'Secure' }
  ];

  steps = [
    { title: 'Create your account', desc: 'Fill in your details below' },
    { title: 'Complete KYC', desc: 'Verify your identity securely' },
    { title: 'Start earning', desc: 'Earn rewards on every transaction' }
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
    password: ['', [Validators.required, passwordValidator]],
    confirmPassword: ['', Validators.required]
  }, {
    validators: (group: AbstractControl) => {
      const password = group.get('password')?.value;
      const confirmPassword = group.get('confirmPassword')?.value;
      return password === confirmPassword ? null : { mismatch: true };
    }
  });

  get f() { return this.form.controls; }

  get passwordStrength(): number {
    const errors = this.f['password'].errors;
    if (!this.f['password'].value) return 0;
    const failCount = errors ? Object.keys(errors).length : 0;
    return Math.max(1, 4 - failCount);
  }

  get strengthBarColor(): string {
    const s = this.passwordStrength;
    if (s <= 1) return 'bg-brand-red';
    if (s === 2) return 'bg-brand-orange';
    if (s === 3) return 'bg-brand-yellow';
    return 'bg-emerald-500';
  }

  get strengthLabel(): string {
    const s = this.passwordStrength;
    if (s <= 1) return 'Weak';
    if (s === 2) return 'Fair';
    if (s === 3) return 'Good';
    return 'Strong';
  }

  get strengthTextColor(): string {
    const s = this.passwordStrength;
    if (s <= 1) return 'text-brand-red';
    if (s === 2) return 'text-brand-orange';
    if (s === 3) return 'text-amber-600';
    return 'text-emerald-600';
  }

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const v = this.form.value;
    this.auth.signup({
      fullName: v.fullName!,
      email: v.email!,
      phone: v.phone!,
      password: v.password!
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) {
          this.toast.error(res.message || 'Unable to create account. Please verify your details.');
          this.cdr.markForCheck();
          return;
        }

        this.toast.success('Account created! Please sign in.');
        this.router.navigate(['/login']);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Unable to create account. Email or phone may already exist.');
        this.cdr.markForCheck();
      }
    });
  }
}
