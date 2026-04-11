import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { AdminDashboardDto } from '../../../core/models/api.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, CurrencyInrPipe],
  template: `
    <div class="space-y-6 page-enter">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-500 text-sm mt-1">Platform overview and key metrics</p>
      </div>

      @if (loading) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          @for (i of [1,2]; track i) {
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-gray-100 rounded-xl"></div>
                <div class="space-y-2">
                  <div class="h-3 w-24 bg-gray-100 rounded"></div>
                  <div class="h-7 w-16 bg-gray-100 rounded"></div>
                </div>
              </div>
            </div>
          }
        </div>
      } @else if (stats) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Total Users -->
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition"
            [class.border-amber-200]="stats.pendingKycCount > 0">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                [class]="stats.pendingKycCount > 0 ? 'bg-amber-100' : 'bg-gray-100'">
                <svg class="w-6 h-6" [class]="stats.pendingKycCount > 0 ? 'text-amber-600' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <div>
                <p class="text-gray-500 text-sm">Pending KYC</p>
                <p class="text-3xl font-bold mt-0.5"
                  [class]="stats.pendingKycCount > 0 ? 'text-amber-600' : 'text-gray-900'">
                  {{ stats.pendingKycCount }}
                </p>
              </div>
            </div>
            <a routerLink="/admin/kyc" class="mt-4 text-xs font-medium hover:underline flex items-center gap-1"
               [class]="stats.pendingKycCount > 0 ? 'text-amber-700' : 'text-gray-500'">
              Manage KYC requests
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Tier Distribution Graph UI -->
        <div class="mt-6 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-r from-gray-50 to-white -z-10 group-hover:opacity-50 transition"></div>
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                <svg class="w-6 h-6 text-brand-orange" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Loyalty Tier Distribution
              </h2>
              <p class="text-sm text-gray-500 mt-1 font-medium">Overview of user placement across reward brackets</p>
            </div>
            <div class="px-4 py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-600">
              Total Points Data
            </div>
          </div>
          
          <div class="space-y-5">
            <!-- Platinum -->
            <div>
              <div class="flex items-center justify-between text-sm font-bold mb-1.5">
                <span class="text-gray-800">Platinum</span>
                <span class="text-gray-900">{{ stats.platinumCount | number }} users</span>
              </div>
              <div class="w-full bg-gray-100 rounded-full h-2">
                <div class="bg-gradient-to-r from-gray-300 to-gray-500 h-2 rounded-full" [style.width]="calcPercentage(stats.platinumCount, stats.totalUsers)"></div>
              </div>
            </div>
            <!-- Gold -->
            <div>
              <div class="flex items-center justify-between text-sm font-bold mb-1.5">
                <span class="text-amber-600">Gold</span>
                <span class="text-amber-700">{{ stats.goldCount | number }} users</span>
              </div>
              <div class="w-full bg-gray-100 rounded-full h-2">
                <div class="bg-gradient-to-r from-amber-300 to-amber-500 h-2 rounded-full" [style.width]="calcPercentage(stats.goldCount, stats.totalUsers)"></div>
              </div>
            </div>
            <!-- Silver -->
            <div>
              <div class="flex items-center justify-between text-sm font-bold mb-1.5">
                <span class="text-slate-400">Silver</span>
                <span class="text-slate-500">{{ stats.silverCount | number }} users</span>
              </div>
              <div class="w-full bg-gray-100 rounded-full h-2">
                <div class="bg-gradient-to-r from-slate-200 to-slate-400 h-2 rounded-full" [style.width]="calcPercentage(stats.silverCount, stats.totalUsers)"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <a routerLink="/admin/kyc"
            class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-orange/20 transition flex items-center gap-4 group">
            <div class="w-12 h-12 bg-brand-yellow-light rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-yellow transition">
              <svg class="w-6 h-6 text-brand-yellow-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-900">KYC Review</p>
              <p class="text-sm text-gray-500 mt-0.5">
                @if (stats.pendingKycCount > 0) {
                  {{ stats.pendingKycCount }} submission{{ stats.pendingKycCount > 1 ? 's' : '' }} awaiting review
                } @else {
                  No pending submissions
                }
              </p>
            </div>
            <svg class="w-5 h-5 text-gray-300 ml-auto group-hover:text-brand-orange transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>

          <a routerLink="/admin/campaigns"
            class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-orange/20 transition flex items-center gap-4 group">
            <div class="w-12 h-12 bg-brand-orange-light rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-orange transition">
              <svg class="w-6 h-6 text-brand-orange group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-900">Campaigns</p>
              <p class="text-sm text-gray-500 mt-0.5">Create and manage reward campaigns</p>
            </div>
            <svg class="w-5 h-5 text-gray-300 ml-auto group-hover:text-brand-orange transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      }
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminDashboardDto | null = null;
  loading = true;

  private readonly destroyRef = inject(DestroyRef);

  constructor(private adminSvc: AdminService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.adminSvc.getDashboard().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: r => { this.stats = r.data ?? null; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  calcPercentage(count: number, total: number): string {
    if (!total || total === 0) return '0%';
    return Math.min((count / total) * 100, 100) + '%';
  }
}







