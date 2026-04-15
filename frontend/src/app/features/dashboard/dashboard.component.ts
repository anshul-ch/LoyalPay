import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WalletService } from '../../core/services/wallet.service';
import { RewardsService } from '../../core/services/rewards.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { BalanceDto, RewardSummaryDto, TransactionDto } from '../../core/models/api.models';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyInrPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col page-enter">
      
      <!-- Premium Hero Header Section -->
      <div class="bg-gradient-to-r from-brand-navy-dark via-brand-navy to-brand-orange text-white rounded-3xl p-8 mb-8 shadow-xl relative overflow-hidden">
        <div class="absolute -top-24 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -left-12 w-48 h-48 bg-brand-yellow/20 rounded-full blur-2xl pointer-events-none"></div>
        
        <div class="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 class="text-3xl font-extrabold tracking-tight">Welcome back!</h1>
            <p class="text-white/80 mt-1 font-medium">Your primary LoyalPay overview</p>

            <div class="mt-8">
              <p class="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">Available Balance</p>
              @if (loadingBalance) {
                <div class="h-10 w-48 bg-white/10 rounded-lg animate-pulse"></div>
              } @else {
                <div class="flex items-baseline gap-3">
                  <span class="text-5xl font-black drop-shadow-sm">{{ balance?.balance | currencyInr }}</span>
                </div>
              }
            </div>
          </div>
          
          <!-- Glassmorphic Quick Actions -->
          <div class="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
            <a [routerLink]="kycStatus === 'Approved' ? '/wallet/topup' : '/profile/kyc'"
               class="flex items-center gap-2 px-4 py-2.5 bg-white text-brand-navy rounded-xl text-sm font-bold hover:bg-gray-50 transition shadow-sm group">
              <svg class="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
              </svg>
              Top Up
            </a>
            <a [routerLink]="kycStatus === 'Approved' ? '/wallet/transfer' : '/profile/kyc'"
               class="flex items-center gap-2 px-5 py-3 bg-brand-orange text-white rounded-xl text-sm font-black hover:bg-brand-orange-dark transition shadow-lg shadow-brand-orange/30 group ring-2 ring-white/30">
              <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
              Pay Now
            </a>
            <a routerLink="/rewards/catalog"
               class="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition group">
              <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 7H4l1-7z"/>
              </svg>
              Redeem
            </a>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        
        <!-- Left Column: Transactions -->
        <div class="lg:col-span-2 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-900">Recent Activity</h2>
            <a routerLink="/wallet/transactions" class="text-sm font-semibold text-brand-orange hover:text-brand-orange-dark hover:underline transition pr-2">View all</a>
          </div>
          
          <div class="bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 overflow-hidden p-2">
            @if (loadingTx) {
              <div class="space-y-2 p-4">
                @for (i of [1,2,3]; track i) {
                  <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl animate-pulse">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-xl bg-gray-200"></div>
                      <div class="space-y-2">
                        <div class="h-4 w-32 bg-gray-200 rounded"></div>
                        <div class="h-3 w-20 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div class="h-4 w-16 bg-gray-200 rounded"></div>
                  </div>
                }
              </div>
            } @else {
              <div class="space-y-2">
                @for (tx of transactions; track tx.entryId) {
                  <div class="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition group cursor-pointer border border-transparent hover:border-gray-100">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                        [class]="tx.entryType === 'Credit' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-rose-50 text-rose-500 group-hover:bg-rose-100'">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          @if (tx.entryType === 'Credit') {
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                          } @else {
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                          }
                        </svg>
                      </div>
                      <div>
                        <p class="font-bold text-gray-900 group-hover:text-brand-navy transition text-[15px]">{{ tx.description || tx.entryType }}</p>
                        <p class="text-xs font-medium text-gray-400 mt-0.5">{{ tx.createdAt | date:'MMM dd, yyyy • hh:mm a' }}</p>
                      </div>
                    </div>
                    <span class="font-bold whitespace-nowrap"
                      [class]="tx.entryType === 'Credit' ? 'text-emerald-600' : 'text-gray-900'">
                      {{ tx.entryType === 'Credit' ? '+' : '-' }}{{ tx.amount | currencyInr }}
                    </span>
                  </div>
                }
                @empty {
                  <div class="flex flex-col items-center justify-center py-16 text-center px-4">
                    <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                      </svg>
                    </div>
                    <p class="font-bold text-gray-900">No recent activity</p>
                    <p class="text-sm font-medium text-gray-500 mt-1">Your ledger is completely empty right now.</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Right Column: Rewards -->
        <div class="flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-900">Loyalty Status</h2>
            <a routerLink="/rewards" class="text-sm font-semibold text-brand-orange hover:text-brand-orange-dark hover:underline transition">Explore Catalogs</a>
          </div>
          
          <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1 relative overflow-hidden group hover:shadow-md transition duration-300">
            <div class="absolute inset-0 bg-gradient-to-b from-brand-orange/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition duration-500"></div>
            
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 bg-brand-orange-light rounded-xl flex items-center justify-center shadow-inner">
                <svg class="w-5 h-5 text-brand-orange" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <p class="text-xs font-bold text-brand-orange uppercase tracking-wider">Current Tier</p>
                <p class="font-bold text-gray-900">{{ rewards?.tier }}</p>
              </div>
            </div>

            @if (loadingRewards) {
              <div class="space-y-4">
                <div class="h-10 w-32 bg-gray-100 rounded-lg animate-pulse"></div>
                <div class="h-2 w-full bg-gray-100 rounded-full animate-pulse"></div>
              </div>
            } @else if (rewardsError) {
              <div class="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {{ rewardsError }}
              </div>
            } @else if (rewards) {
              <div class="mt-4">
                <p class="text-[42px] font-black leading-none text-gray-900 tracking-tight">{{ rewards.totalPoints | number }}</p>
                <p class="text-sm font-medium text-gray-500 mt-1 mb-8">Lifetime accrued points</p>
                
                <div class="bg-gray-50 rounded-2xl p-5 border border-gray-100/80">
                  <div class="flex justify-between items-end mb-2">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Progress</span>
                    <span class="text-sm font-bold text-gray-900">{{ rewards.totalPoints | number }} / {{ getNextTierMax(rewards.totalPoints) | number }}</span>
                  </div>
                  
                  <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div class="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-1000 ease-out" 
                         [style.width]="calcProgress(rewards.totalPoints)"></div>
                  </div>
                  <p class="text-xs font-medium text-gray-500 mt-3 text-center">{{ rewards.tierProgress }}</p>
                </div>
              </div>
            } @else {
              <div class="mt-4 bg-gray-50 border border-gray-100 text-gray-600 text-sm rounded-xl px-4 py-3">
                Rewards summary is currently unavailable.
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  balance: BalanceDto | null = null;
  rewards: RewardSummaryDto | null = null;
  transactions: TransactionDto[] = [];
  loadingBalance = true;
  loadingRewards = true;
  loadingTx = true;
  kycStatus: string | null = null;
  rewardsError = '';

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private walletSvc: WalletService,
    private rewardsSvc: RewardsService,
    private profileSvc: ProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.profileSvc.getKycStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      this.kycStatus = (r.data as any)?.status ?? (r.data as any)?.Status ?? null;
      this.cdr.markForCheck();
    });
    this.walletSvc.getBalance().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: r => { this.balance = r.data ?? null; this.loadingBalance = false; this.cdr.markForCheck(); },
      error: () => { this.loadingBalance = false; this.cdr.markForCheck(); }
    });
    this.rewardsSvc.getSummary().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: r => {
        this.rewards = r.data ?? null;
        this.loadingRewards = false;
        this.rewardsError = '';
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingRewards = false;
        this.rewardsError = 'Unable to load rewards right now.';
        this.cdr.markForCheck();
      }
    });
    this.walletSvc.getTransactions(1, 5).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: r => { this.transactions = r.data?.items ?? []; this.loadingTx = false; this.cdr.markForCheck(); },
      error: () => { this.loadingTx = false; this.cdr.markForCheck(); }
    });
  }

  getNextTierMax(points: number): number {
    if (points >= 5000) return 5000;
    if (points >= 1000) return 5000;
    return 1000;
  }

  calcProgress(points: number): string {
    const max = this.getNextTierMax(points);
    if (max === 0) return '0%';
    return Math.min((points / max) * 100, 100) + '%';
  }
}





