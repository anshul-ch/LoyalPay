import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex">

      <!-- Left branding panel -->
      <div class="hidden lg:flex flex-col justify-between w-5/12 p-12 bg-brand-navy relative overflow-hidden">
        <!-- Decorative blobs -->
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
            <span class="text-white/80 text-xs font-medium">10,000+ active users</span>
          </div>
          <h2 class="text-4xl font-extrabold text-white leading-tight mb-4">
            Manage money.<br/>
            <span class="text-brand-yellow">Earn rewards.</span>
          </h2>
          <p class="text-gray-300 text-base mb-8">India's smartest loyalty wallet platform.</p>

          <div class="space-y-3">
            @for (feat of features; track feat.label) {
              <div class="flex items-center gap-3 group">
                <div class="w-9 h-9 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/15 transition-colors">
                  <span class="text-base">{{ feat.icon }}</span>
                </div>
                <span class="text-gray-300 text-sm">{{ feat.label }}</span>
              </div>
            }
          </div>

          <!-- Testimonial card -->
          <div class="mt-8 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <div class="flex items-center gap-1 mb-2">
              @for (s of [1,2,3,4,5]; track s) {
                <svg class="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              }
              <span class="text-white/60 text-xs ml-1">4.9/5</span>
            </div>
            <p class="text-white/70 text-xs leading-relaxed">"LoyalPay made managing my money so easy. The rewards are a great bonus!"</p>
            <p class="text-white/40 text-xs mt-2">— Priya S., Mumbai</p>
          </div>
        </div>

        <p class="relative text-gray-500 text-sm">&copy; 2026 LoyalPay. All rights reserved.</p>
      </div>

      <!-- Right form panel -->
      <div class="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        <!-- Subtle background pattern -->
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle, #003049 1px, transparent 1px); background-size: 24px 24px;"></div>
        <div class="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative w-full max-w-md">
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
              <h1 class="text-2xl font-bold text-gray-900">Welcome back</h1>
              <p class="text-gray-500 text-sm mt-1">Sign in to your LoyalPay account</p>
            </div>

            <!-- Error banner -->
            @if (loginError) {
              <div class="mb-5 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                <svg class="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-brand-red text-sm font-medium">{{ loginError }}</p>
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5" autocomplete="on">

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
                    placeholder="••••••••" name="password" autocomplete="current-password"
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
                @if (f['password'].invalid && f['password'].touched) {
                  <p class="text-brand-red text-xs mt-1.5 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                    Password is required.
                  </p>
                }
                <!-- Forgot password — below the field -->
                <div class="mt-2 text-right">
                  <a routerLink="/forgot-password" class="text-xs text-brand-orange hover:text-brand-orange-dark font-medium hover:underline transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>

              <button type="submit" [disabled]="form.invalid || loading"
                class="btn-primary w-full justify-center inline-flex items-center gap-2 py-3 text-base mt-1 shadow-lg shadow-brand-orange/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                @if (loading) {
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Signing in...
                } @else {
                  Sign in
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                }
              </button>
            </form>

            <div class="relative my-6">
              <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-100"></div></div>
              <div class="relative flex justify-center"><span class="bg-white px-3 text-xs text-gray-400">New to LoyalPay?</span></div>
            </div>

            <a routerLink="/signup"
              class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-brand-orange hover:text-brand-orange transition-all duration-150">
              Create a free account
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
export class LoginComponent {
  loading = false;
  showPassword = false;
  loginError: string | null = null;

  features = [
    { icon: '💳', label: 'Instant wallet top-up & transfers' },
    { icon: '⭐', label: 'Earn loyalty points on every transaction' },
    { icon: '🔒', label: 'Bank-grade security with KYC verification' }
  ];

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
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
    this.loginError = null;
    this.auth.login(this.form.value as any).subscribe({
      next: res => {
        this.loading = false;
        if (!res.success || !res.data) {
          this.loginError = res.message || 'Incorrect email or password. Please try again.';
          this.form.get('password')?.reset();
          return;
        }
        if (res.data.requiresPasswordChange) {
          this.router.navigate(['/force-password-change']);
          return;
        }
        this.router.navigate([res.data.role === 'Admin' ? '/admin/dashboard' : '/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        if (err?.name === 'TimeoutError') {
          this.loginError = 'Login timed out. Please try again.';
        } else {
          this.loginError = err?.error?.message || 'Incorrect email or password. Please try again.';
        }
        this.form.get('password')?.reset();
      }
    });
  }
}
