import { Component, OnInit, HostListener, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { TokenDto } from '../../core/models/api.models';

@Component({
  selector: 'app-user-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  styles: [`
    .sidebar {
      transition: transform 0.3s ease;
    }
    @media (min-width: 1024px) {
      .sidebar {
        position: sticky !important;
        top: 0;
        height: 100vh;
        transform: translateX(0) !important;
        flex-shrink: 0;
      }
    }
  `],
  template: `
    <div class="min-h-screen bg-gray-50 flex">
      <!-- Mobile overlay -->
      @if (sidebarOpen && isMobile) {
        <div class="fixed inset-0 bg-black/50 z-20" (click)="sidebarOpen = false"></div>
      }      <!-- Sidebar -->
      <aside class="sidebar fixed lg:sticky top-0 inset-y-0 left-0 z-30 w-64 bg-brand-navy flex flex-col shadow-xl h-screen"
        [style.transform]="(!sidebarOpen && isMobile) ? 'translateX(-100%)' : 'translateX(0)'">

        <div class="p-5 border-b border-white/10 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-brand-orange rounded-xl flex items-center justify-center flex-shrink-0">
              <span class="text-white font-bold text-sm">LP</span>
            </div>
            <span class="font-bold text-white text-lg">LoyalPay</span>
          </div>
        </div>

        <nav class="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <a routerLink="/dashboard" routerLinkActive="bg-brand-orange text-white"
             [routerLinkActiveOptions]="{exact:true}"
             (click)="closeSidebarOnMobile()"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition text-sm font-medium">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Dashboard
          </a>
          <a [routerLink]="walletPrimaryLink" routerLinkActive="bg-brand-orange text-white"
             (click)="closeSidebarOnMobile()"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition text-sm font-medium">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
            Wallet
          </a>
          <a routerLink="/rewards" routerLinkActive="bg-brand-orange text-white"
             (click)="closeSidebarOnMobile()"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition text-sm font-medium">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
            Rewards
          </a>
          <a routerLink="/profile" routerLinkActive="bg-brand-orange text-white"
             (click)="closeSidebarOnMobile()"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition text-sm font-medium">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            Profile
          </a>
        </nav>

        <!-- KYC warning -->
        @if (kycStatus && kycStatus !== 'Approved') {
          <div class="mx-3 mb-3 p-3 bg-amber-300/20 border border-amber-300/40 rounded-xl flex-shrink-0">
            <p class="text-amber-100 text-xs font-black uppercase tracking-wide">KYC {{ kycLabel }}</p>
            <p class="text-amber-50 text-xs mt-0.5 font-semibold">Complete KYC to unlock all features</p>
            <a routerLink="/profile/kyc" (click)="closeSidebarOnMobile()"
              class="mt-1.5 text-xs text-white hover:text-amber-100 font-bold block">
              Verify now ->
            </a>
          </div>
        }

      </aside>

      <!-- Main content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header class="bg-white border-b border-gray-100 px-4 lg:px-6 py-3.5 flex items-center gap-4 shadow-sm sticky top-0 z-[100]">
          <button (click)="sidebarOpen = !sidebarOpen"
            class="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div class="flex-1"></div>

          <!-- KYC badge -->
          @if (kycStatus && kycStatus !== 'Approved') {
            <a routerLink="/profile/kyc"
              class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
              [class]="kycBadgeClass">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              KYC {{ kycLabel }}
            </a>
          }

          <!-- User dropdown -->
          <div class="relative z-50">
            @if (dropdownOpen) {
              <div class="fixed inset-0 z-[900]" (click)="dropdownOpen = false"></div>
            }
            <button type="button" (click)="toggleDropdown($event)"
              class="relative z-[1001] flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-100 transition select-none group">
              <!-- Avatar circle with initials -->
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-brand-orange to-brand-orange-dark flex items-center justify-center flex-shrink-0 shadow-sm">
                <span class="text-white text-xs font-bold leading-none">{{ initials }}</span>
              </div>
              <div class="hidden sm:flex flex-col items-start min-w-0">
                <span class="text-brand-navy text-sm font-semibold leading-tight truncate max-w-[140px]">{{ displayName }}</span>
                <span class="text-gray-400 text-[10px] leading-tight">My Account</span>
              </div>
              <svg class="w-3.5 h-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0"
                [style.transform]="dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            @if (dropdownOpen) {
              <div class="fixed right-4 top-[60px] sm:right-6 w-72 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-gray-100/80 overflow-hidden"
                style="z-index: 9999;">

                <!-- Header with gradient -->
                <div class="relative px-4 pt-4 pb-3 bg-gradient-to-br from-brand-navy to-brand-navy-dark overflow-hidden">
                  <div class="absolute -top-4 -right-4 w-24 h-24 bg-brand-orange/20 rounded-full blur-xl"></div>
                  <div class="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full blur-lg"></div>
                  <div class="relative flex items-center gap-3">
                    <div class="w-11 h-11 rounded-full bg-gradient-to-br from-brand-orange to-brand-orange-dark flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-white/20">
                      <span class="text-white text-sm font-bold">{{ initials }}</span>
                    </div>
                    <div class="min-w-0">
                      <p class="text-white text-sm font-semibold truncate">{{ user?.fullName || displayName }}</p>
                      <p class="text-white/60 text-xs truncate">{{ user?.email }}</p>
                    </div>
                  </div>
                  @if (kycStatus && kycStatus !== 'Approved') {
                    <div class="relative mt-2.5">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide"
                        [class]="kycBadgeClass">
                        KYC {{ kycLabel }}
                      </span>
                    </div>
                  }
                </div>

                <!-- Menu items -->
                <div class="py-1.5 px-1.5">
                  <a routerLink="/profile" (click)="dropdownOpen = false"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-brand-orange/5 hover:text-brand-orange transition-all group/item">
                    <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-blue-100 transition-colors">
                      <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                    </div>
                    <span class="font-medium">My Profile</span>
                  </a>
                  <a routerLink="/wallet" (click)="dropdownOpen = false"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-brand-orange/5 hover:text-brand-orange transition-all group/item">
                    <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-emerald-100 transition-colors">
                      <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                      </svg>
                    </div>
                    <span class="font-medium">Wallet</span>
                  </a>
                  <a routerLink="/rewards" (click)="dropdownOpen = false"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-brand-orange/5 hover:text-brand-orange transition-all group/item">
                    <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-amber-100 transition-colors">
                      <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                      </svg>
                    </div>
                    <span class="font-medium">Rewards</span>
                  </a>
                  <a routerLink="/profile/kyc" (click)="dropdownOpen = false"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-brand-orange/5 hover:text-brand-orange transition-all group/item">
                    <div class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-purple-100 transition-colors">
                      <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                      </svg>
                    </div>
                    <span class="font-medium">KYC Verification</span>
                  </a>
                </div>

                <div class="mx-3 border-t border-gray-100"></div>

                <div class="py-1.5 px-1.5">
                  <button type="button" (click)="logout()"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-brand-red hover:bg-red-50 transition-all group/item">
                    <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-red-100 transition-colors">
                      <svg class="w-4 h-4 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                    </div>
                    <span class="font-medium">Sign out</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </header>

        <main class="flex-1 p-4 lg:p-6 overflow-auto flex flex-col">
          <div class="page-enter flex-1 flex flex-col min-h-full">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `
})
export class UserShellComponent implements OnInit {
  user: TokenDto | null = null;
  sidebarOpen = true;
  dropdownOpen = false;
  kycStatus: string | null = null;

  get walletPrimaryLink(): string {
    return this.kycStatus === 'Approved' ? '/wallet' : '/profile/kyc';
  }

  get isMobile(): boolean {
    return window.innerWidth < 1024;
  }

  get displayName(): string {
    const name = this.user?.fullName?.trim();
    if (!name) return this.user?.email?.split('@')[0] || 'Account';
    const parts = name.split(' ').filter(p => p.length > 0);
    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
    const full = lastName ? `${firstName} ${lastName}` : firstName;
    return full.length <= 18 ? full : this.initials;
  }

  get initials(): string {
    const name = this.user?.fullName?.trim();
    if (!name) return (this.user?.email?.[0] ?? 'U').toUpperCase();
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  get kycBadgeClass(): string {
    const status = this.kycStatus ?? 'NotSubmitted';
    if (status === 'Approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Pending') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (status === 'Rejected') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  }

  get kycLabel(): string {
    return this.kycStatus ?? 'NotSubmitted';
  }

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private auth: AuthService,
    private profileSvc: ProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(u => this.user = u);
    this.sidebarOpen = window.innerWidth >= 1024;
    this.profileSvc.getKycStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      this.kycStatus = r.data?.status ?? null;
    });
  }

  private resizeTimer = 0;
  @HostListener('window:resize')
  onResize(): void {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      if (window.innerWidth >= 1024) this.sidebarOpen = true;
    }, 100);
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth < 1024) this.sidebarOpen = false;
  }

  logout(): void {
    this.dropdownOpen = false;
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => { this.auth.clearTokens(); this.router.navigate(['/login']); }
    });
  }
}

