import { Component, OnInit, HostListener } from '@angular/core';
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
          <a routerLink="/wallet" routerLinkActive="bg-brand-orange text-white"
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
              Verify now →
            </a>
          </div>
        }

      </aside>

      <!-- Main content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header class="bg-white border-b border-gray-100 px-4 lg:px-6 py-3.5 flex items-center gap-4 shadow-sm sticky top-0 z-10">
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
              <div class="fixed inset-0 z-40" (click)="dropdownOpen = false"></div>
            }
            <button type="button" (click)="toggleDropdown($event)"
              class="relative z-50 flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-100 transition select-none">
              <div class="w-8 h-8 rounded-full bg-gradient-to-tr flex items-center justify-center flex-shrink-0 ring-2 ring-offset-1"
                [class]="avatarBgClass">
                <span class="text-white font-bold text-xs">{{ initials }}</span>
              </div>
              <div class="hidden md:block text-left">
                <p class="text-sm font-semibold text-gray-800 leading-tight">{{ user?.fullName }}</p>
              </div>
              <svg class="w-4 h-4 text-gray-400 transition-transform duration-200"
                [style.transform]="dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            @if (kycStatus && kycStatus !== 'Approved') {
              <div class="mt-1 text-right">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide"
                  [class]="kycBadgeClass">
                  KYC {{ kycLabel }}
                </span>
              </div>
            }

            @if (dropdownOpen) {
              <div class="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                style="z-index: 60;">
                <div class="px-4 py-3 bg-gray-50 border-b border-gray-100 space-y-1.5">
                  <p class="text-sm font-semibold text-gray-900 truncate">{{ user?.fullName }}</p>
                  <p class="text-xs text-gray-500 truncate">{{ user?.email }}</p>
                  @if (kycStatus && kycStatus !== 'Approved') {
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide"
                      [class]="kycBadgeClass">
                      KYC {{ kycLabel }}
                    </span>
                  }
                </div>
                <div class="py-1">
                  <a routerLink="/profile" (click)="dropdownOpen = false"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    My Profile
                  </a>
                  <a routerLink="/wallet" (click)="dropdownOpen = false"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                    </svg>
                    Wallet
                  </a>
                  <a routerLink="/rewards" (click)="dropdownOpen = false"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                    Rewards
                  </a>
                  <a routerLink="/profile/kyc" (click)="dropdownOpen = false"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    KYC Verification
                  </a>
                </div>
                <div class="border-t border-gray-100 py-1">
                  <button type="button" (click)="logout()"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-brand-red hover:bg-red-50 transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                    Sign out
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

  get isMobile(): boolean {
    return window.innerWidth < 1024;
  }

  get initials(): string {
    const raw = (this.user?.fullName ?? '').trim();
    if (!raw) return 'U';

    const letters = raw
      .split(/\s+/)
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return letters || raw.slice(0, 1).toUpperCase();
  }

  get avatarBgClass(): string {
    const status = this.kycStatus ?? 'NotSubmitted';
    if (status === 'Approved') return 'from-emerald-500 to-green-600 ring-emerald-300';
    if (status === 'Pending') return 'from-amber-500 to-orange-600 ring-amber-300';
    if (status === 'Rejected') return 'from-red-500 to-rose-600 ring-red-300';
    return 'from-brand-orange to-red-500 ring-brand-orange';
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

  constructor(
    private auth: AuthService,
    private profileSvc: ProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(u => this.user = u);
    this.sidebarOpen = window.innerWidth >= 1024;
    this.profileSvc.getKycStatus().subscribe(r => {
      this.kycStatus = r.data?.status ?? null;
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 1024) this.sidebarOpen = true;
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
