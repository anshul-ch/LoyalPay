﻿import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProfileService } from '../../../core/services/profile.service';
import { RewardsService } from '../../../core/services/rewards.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-view-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive],
  template: `
    <div class="h-full flex flex-col space-y-6 page-enter pb-8 max-w-6xl mx-auto w-full">
      <!-- Header -->
      <div class="flex items-end justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">My Profile</h1>
          <p class="text-sm text-gray-500 mt-1 font-medium">Manage your settings and track your account status.</p>
        </div>
      </div>

      <!-- Tab nav -->
      <div class="flex gap-2 bg-white border border-gray-100 shadow-sm p-1.5 rounded-xl w-fit">
        <a routerLink="/profile" routerLinkActive="bg-brand-navy shadow-md text-white border-transparent"
          [routerLinkActiveOptions]="{exact:true}"
          class="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-800 transition">
          Profile Settings
        </a>
        <a routerLink="/profile/change-password" routerLinkActive="bg-brand-navy shadow-md text-white border-transparent"
          class="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-800 transition">
          Security
        </a>
        <a routerLink="/profile/kyc" routerLinkActive="bg-brand-navy shadow-md text-white border-transparent"
          class="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-800 transition">
          KYC Verification
        </a>
      </div>

      @if (loading) {
        <div class="animate-pulse space-y-6">
          <div class="h-48 bg-gray-100 rounded-3xl w-full"></div>
          <div class="h-64 bg-gray-100 rounded-3xl w-full"></div>
        </div>
      } @else if (profileError) {
        <div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {{ profileError }}
        </div>
      } @else if (profile) {
        @if (!profile.isActive) {
          <div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">
            <p class="font-semibold">Account Status: Inactive / Blocked</p>
            @if (profile.inactiveReason) {
              <p class="mt-1">Reason: {{ profile.inactiveReason }}</p>
            }
          </div>
        }

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 relative mt-4">
          <!-- Identity Card Column -->
          <div class="lg:col-span-4 space-y-6">
            <div class="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group transition hover:shadow-xl">
              <!-- Banner Cover -->
              <div class="h-32 bg-gradient-to-tr from-brand-orange to-brand-red relative">
                <div class="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white to-transparent"></div>
              </div>
              
              <div class="px-6 pb-8 relative text-center">
                <!-- Overlapping Avatar -->
                <div class="w-24 h-24 bg-white p-1 rounded-full absolute -top-12 left-1/2 -translate-x-1/2 shadow-lg">
                  <div class="w-full h-full bg-brand-navy rounded-full flex items-center justify-center">
                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                </div>
                
                <div class="pt-16">
                  <h2 class="text-xl font-bold text-gray-900 group-hover:text-brand-navy transition">{{ profile.fullName }}</h2>
                  <p class="text-gray-500 text-sm font-medium mt-0.5">{{ profile.email }}</p>
                  
                  <div class="flex items-center justify-center gap-2 mt-4">
                    <span class="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-navy-light/40 text-brand-navy">
                      {{ profile.role }}
                    </span>
                    <span class="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider" [class]="profile.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                      {{ profile.isActive ? 'Active' : 'Inactive' }}
                    </span>
                    <span class="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider" [class]="kycBadgeClass">
                      KYC: {{ profile.kycStatus }}
                    </span>
                  </div>
                  
                  <div class="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3 text-left">
                    <div class="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                      <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                        <svg class="w-4 h-4 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                      </div>
                      <span class="font-medium">{{ profile.phone || 'No phone added' }}</span>
                    </div>
                    <div class="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                      <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                        <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                      </div>
                      <span class="font-medium">Joined {{ profile.createdAt | date:'MMM yyyy' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rewards Snapshot -->
            @if (rewards) {
              <div class="bg-brand-navy rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full group-hover:scale-110 transition duration-500 blur-2xl"></div>
                
                <div class="flex items-center gap-3 mb-2">
                  <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                    <svg class="w-5 h-5 text-brand-yellow" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <p class="text-white/70 text-xs font-bold uppercase tracking-wider">Loyalty Points</p>
                </div>
                
                <p class="text-4xl font-extrabold mt-3 tracking-tight">{{ rewards.totalPoints | number }}</p>
                
                <div class="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                  <span class="px-3 py-1.5 bg-gradient-to-r from-brand-orange to-brand-red rounded-lg text-xs font-black uppercase tracking-wider shadow-md">{{ rewards.tier }}</span>
                  <a routerLink="/rewards" class="text-xs text-white/70 hover:text-white font-bold transition flex items-center gap-1 group-hover:translate-x-1">
                    Explore rewards
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
                    </svg>
                  </a>
                </div>
              </div>
            } @else if (rewardsError) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl p-4">
                {{ rewardsError }}
              </div>
            }
          </div>

          <!-- Forms Column -->
          <div class="lg:col-span-8 space-y-6">
            <!-- Edit Profile -->
            <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-3xl">
              <div class="flex items-center gap-3 mb-8">
                <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-900">Edit Profile</h3>
              </div>
              
              <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div class="space-y-1.5 focus-within:text-brand-orange text-gray-700 transition">
                    <label class="block text-sm font-bold ml-1 transition-colors">Full Name</label>
                    <input formControlName="fullName" type="text" placeholder="Your full name"
                      class="input py-3.5 px-4 bg-gray-50/50 border-gray-200 focus:bg-white text-gray-900 rounded-xl" [class.border-red-300]="f['fullName'].invalid && f['fullName'].touched">
                    @if (f['fullName'].invalid && f['fullName'].touched) {
                      <p class="text-brand-red text-xs font-medium ml-1">At least 2 characters required.</p>
                    }
                  </div>
                  <div class="space-y-1.5 focus-within:text-brand-orange text-gray-700 transition">
                    <label class="block text-sm font-bold ml-1 transition-colors">Phone Number</label>
                    <input formControlName="phone" type="tel" placeholder="10-digit mobile number"
                      class="input py-3.5 px-4 bg-gray-50/50 border-gray-200 focus:bg-white text-gray-900 rounded-xl" [class.border-red-300]="f['phone'].invalid && f['phone'].touched">
                    @if (f['phone'].invalid && f['phone'].touched) {
                      <p class="text-brand-red text-xs font-medium ml-1">Must be exactly 10 digits.</p>
                    }
                  </div>
                </div>
                
                <div class="space-y-1.5 text-gray-700">
                  <label class="block text-sm font-bold ml-1">Email Address</label>
                  <input [value]="profile.email" type="email" disabled
                    class="input py-3.5 px-4 bg-gray-100 border-transparent text-gray-400 cursor-not-allowed rounded-xl font-medium">
                  <p class="text-xs text-gray-400 font-medium ml-1">Email address is permanently linked and cannot be changed.</p>
                </div>
                
                <div class="pt-4 border-t border-gray-50 flex items-center justify-end gap-4">
                  @if (saved) {
                    <span class="text-sm text-emerald-600 font-bold flex items-center gap-1.5 animate-[fadeIn_0.3s]">
                      <span class="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </span>
                      Changes Saved
                    </span>
                  }
                  <button type="submit" [disabled]="form.invalid || saving"
                    class="btn-primary py-3 px-8 rounded-xl shadow-md hover:shadow-lg inline-flex items-center gap-2">
                    @if (saving) {
                      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Saving...
                    } @else {
                      Save Changes
                    }
                  </button>
                </div>
              </form>
            </div>

            <!-- KYC Status Panel -->
            <div class="bg-gradient-to-r from-gray-900 to-brand-navy-dark rounded-3xl shadow-lg p-1 relative overflow-hidden">
              <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              
              <div class="bg-white/95 backdrop-blur-xl rounded-[22px] p-8 m-0.5 relative z-10 border border-white/20">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-xl font-bold text-gray-900">Identity Verification</h3>
                      <p class="text-sm text-gray-500 font-medium">Unlock full access to Wallet & Rewards</p>
                    </div>
                  </div>
                  <span class="px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider shadow-sm border border-black/5" [class]="kycBadgeClass">
                    {{ profile.kycStatus }}
                  </span>
                </div>
                
                @if (profile.kycStatus !== 'Approved') {
                  <div class="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p class="text-sm text-gray-600 font-medium max-w-sm">
                      @if (profile.kycStatus === 'Pending') {
                         Your documents are under active review. We'll notify you as soon as they are processed (1-2 business days).
                      } @else if (profile.kycStatus === 'Rejected') {
                         <span class="text-brand-red font-bold">Action Required:</span> Unfortunately, your KYC was rejected. Please resubmit clear, valid documents.
                      } @else {
                         Provide a valid government ID to comply with financial regulations and secure your account.
                      }
                    </p>
                    <a routerLink="/profile/kyc"
                      class="w-full sm:w-auto text-center px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl shadow-md hover:bg-black transition whitespace-nowrap hover:-translate-y-0.5">
                      {{ profile.kycStatus === 'Rejected' ? 'Resubmit Documents' : 'Complete Verification' }}
                    </a>
                  </div>
                } @else {
                  <div class="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center gap-3 py-4 bg-emerald-50 rounded-2xl border-emerald-100">
                    <span class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </span>
                    <p class="text-emerald-800 font-bold">Your identity is securely verified block-by-block.</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ViewEditComponent implements OnInit, OnDestroy {
  saving = false;
  saved = false;
  private savedTimer = 0;
  loading = true;
  profile: any = null;
  rewards: any = null;
  profileError = '';
  rewardsError = '';

  private readonly destroyRef = inject(DestroyRef);

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
  });

  get f() { return this.form.controls; }

  get kycBadgeClass(): string {
    const map: Record<string, string> = {
      Approved: 'bg-emerald-100 text-emerald-700',
      Pending: 'bg-amber-100 text-amber-700',
      Rejected: 'bg-red-100 text-red-700'
    };
    return map[this.profile?.kycStatus] ?? 'bg-gray-100 text-gray-600';
  }

  constructor(
    private fb: FormBuilder,
    private profileSvc: ProfileService,
    private rewardsSvc: RewardsService,
    private toast: ToastService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.profileSvc.getProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: r => {
        this.profile = r.data;
        this.form.patchValue({ fullName: r.data?.fullName, phone: r.data?.phone });
        this.loading = false;
        this.profileError = '';
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.profileError = 'Unable to load profile details.';
        this.cdr.markForCheck();
      }
    });

    this.rewardsSvc.getSummary().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: r => {
        this.rewards = r.data ?? null;
        this.rewardsError = '';
        this.cdr.markForCheck();
      },
      error: () => {
        this.rewards = null;
        this.rewardsError = 'Unable to load rewards snapshot.';
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.savedTimer);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.saved = false;
    this.profileSvc.updateProfile(this.form.value as any).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: r => {
        this.saving = false;
        this.saved = true;
        this.profile = { ...this.profile, ...r.data };
        this.auth.updateCurrentUserProfile({
          fullName: this.profile.fullName,
          phone: this.profile.phone,
          email: this.profile.email
        });
        this.toast.success('Profile updated successfully!');
        this.cdr.markForCheck();
        this.savedTimer = window.setTimeout(() => { this.saved = false; this.cdr.markForCheck(); }, 3000);
      },
      error: () => {
        this.saving = false;
        this.toast.error('Could not update profile right now.');
        this.cdr.markForCheck();
      }
    });
  }
}



