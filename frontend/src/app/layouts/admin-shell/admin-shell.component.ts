import { Component, OnInit, HostListener, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { TokenDto } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-shell',
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
      @if (sidebarOpen && isMobile) {
        <div class="fixed inset-0 bg-black/50 z-20" (click)="sidebarOpen = false"></div>
      }

      <aside class="sidebar fixed lg:sticky top-0 inset-y-0 left-0 z-30 w-64 bg-brand-navy-dark flex flex-col shadow-xl h-screen"
        [style.transform]="(!sidebarOpen && isMobile) ? 'translateX(-100%)' : 'translateX(0)'">

        <div class="p-5 border-b border-white/10 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-brand-red rounded-xl flex items-center justify-center flex-shrink-0">
              <span class="text-white font-bold text-sm">LP</span>
            </div>
            <div>
              <span class="font-bold text-white text-lg">LoyalPay</span>
              <p class="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav class="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <a routerLink="/admin/dashboard" routerLinkActive="bg-brand-orange text-white"
             (click)="closeSidebarOnMobile()"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition text-sm font-medium">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            Dashboard
          </a>
          <a routerLink="/admin/users" routerLinkActive="bg-brand-orange text-white"
             (click)="closeSidebarOnMobile()"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition text-sm font-medium">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            Users
          </a>
          <a routerLink="/admin/kyc" routerLinkActive="bg-brand-orange text-white"
             (click)="closeSidebarOnMobile()"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition text-sm font-medium">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            KYC Review
          </a>
          <a routerLink="/admin/campaigns" routerLinkActive="bg-brand-orange text-white"
             (click)="closeSidebarOnMobile()"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition text-sm font-medium">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
            </svg>
            Campaigns
          </a>
          <a routerLink="/admin/rewards" routerLinkActive="bg-brand-orange text-white"
             (click)="closeSidebarOnMobile()"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition text-sm font-medium">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.5 0-3 .8-3 2.2 0 1.4 1.2 2 3 2.4 1.8.4 3 .9 3 2.4 0 1.4-1.5 2.2-3 2.2m0-9.2V6m0 12v-1.2M6 12a6 6 0 1012 0 6 6 0 00-12 0z"/>
            </svg>
            Rewards
          </a>
        </nav>

      </aside>

      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header class="bg-white border-b border-gray-100 px-4 lg:px-6 py-3.5 flex items-center gap-4 shadow-sm sticky top-0 z-[100]">
          <button (click)="sidebarOpen = !sidebarOpen"
            class="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div class="flex-1"></div>

          <!-- Admin dropdown -->
          <div class="relative z-50">
            @if (dropdownOpen) {
              <div class="fixed inset-0 z-[900]" (click)="dropdownOpen = false"></div>
            }
            <button type="button" (click)="toggleDropdown($event)"
              class="relative z-[1001] flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-100 transition select-none">
              <!-- Avatar circle with initials -->
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-brand-navy to-brand-navy-dark flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-brand-navy/20">
                <span class="text-white text-xs font-bold leading-none">{{ initials }}</span>
              </div>
              <div class="hidden sm:flex flex-col items-start min-w-0">
                <span class="text-brand-navy text-sm font-semibold leading-tight truncate max-w-[140px]">{{ displayName }}</span>
                <span class="text-gray-400 text-[10px] leading-tight">Admin</span>
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
                <div class="relative px-4 pt-4 pb-3 bg-gradient-to-br from-brand-navy-dark to-[#001020] overflow-hidden">
                  <div class="absolute -top-4 -right-4 w-24 h-24 bg-brand-orange/15 rounded-full blur-xl"></div>
                  <div class="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full blur-lg"></div>
                  <div class="relative flex items-center gap-3">
                    <div class="w-11 h-11 rounded-full bg-gradient-to-br from-brand-navy to-brand-navy-dark flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-white/20">
                      <span class="text-white text-sm font-bold">{{ initials }}</span>
                    </div>
                    <div class="min-w-0">
                      <p class="text-white text-sm font-semibold truncate">{{ user?.fullName || displayName }}</p>
                      <p class="text-white/60 text-xs truncate">{{ user?.email }}</p>
                    </div>
                  </div>
                  <div class="relative mt-2.5">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-orange/20 border border-brand-orange/30 text-brand-orange text-[10px] font-bold uppercase tracking-wide">
                      Administrator
                    </span>
                  </div>
                </div>

                <!-- Menu items -->
                <div class="py-1.5 px-1.5">
                  <a routerLink="/admin/dashboard" (click)="dropdownOpen = false"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-brand-navy/5 hover:text-brand-navy transition-all group/item">
                    <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-blue-100 transition-colors">
                      <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                    </div>
                    <span class="font-medium">Dashboard</span>
                  </a>
                  <a routerLink="/admin/users" (click)="dropdownOpen = false"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-brand-navy/5 hover:text-brand-navy transition-all group/item">
                    <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-emerald-100 transition-colors">
                      <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                      </svg>
                    </div>
                    <span class="font-medium">Manage Users</span>
                  </a>
                  <a routerLink="/admin/kyc" (click)="dropdownOpen = false"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-brand-navy/5 hover:text-brand-navy transition-all group/item">
                    <div class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-purple-100 transition-colors">
                      <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                      </svg>
                    </div>
                    <span class="font-medium">KYC Review</span>
                  </a>
                  <a routerLink="/admin/campaigns" (click)="dropdownOpen = false"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-brand-navy/5 hover:text-brand-navy transition-all group/item">
                    <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-amber-100 transition-colors">
                      <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
                      </svg>
                    </div>
                    <span class="font-medium">Campaigns</span>
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
export class AdminShellComponent implements OnInit {
  user: TokenDto | null = null;
  sidebarOpen = true;
  dropdownOpen = false;

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
    if (!name) return (this.user?.email?.[0] ?? 'A').toUpperCase();
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  private readonly destroyRef = inject(DestroyRef);

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.auth.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(u => this.user = u);
    this.sidebarOpen = window.innerWidth >= 1024;
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

