import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RewardsService } from '../../../core/services/rewards.service';
import { ToastService } from '../../../core/services/toast.service';
import { WalletService } from '../../../core/services/wallet.service';
import { CatalogItemDto, RewardSummaryDto } from '../../../core/models/api.models';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 page-enter">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Rewards Catalog</h1>
          <p class="text-sm text-gray-500 mt-1">Redeem your points for exclusive rewards</p>
        </div>
        <div class="flex items-center gap-3">
          @if (summary) {
            <div class="flex items-center gap-2 px-3 py-1.5 bg-brand-orange-light rounded-xl">
              <svg class="w-4 h-4 text-brand-orange" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span class="text-sm font-bold text-brand-orange">{{ summary.totalPoints | number }} pts</span>
            </div>
          }
          <a routerLink="/rewards" class="text-sm text-brand-orange hover:underline font-medium flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </a>
        </div>
      </div>

      @if (loading) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div class="h-4 w-3/4 bg-gray-100 rounded mb-2"></div>
              <div class="h-3 w-1/3 bg-gray-100 rounded mb-4"></div>
              <div class="h-3 w-full bg-gray-100 rounded mb-1"></div>
              <div class="h-3 w-2/3 bg-gray-100 rounded mb-5"></div>
              <div class="h-9 bg-gray-100 rounded-xl"></div>
            </div>
          }
        </div>
      } @else if (error) {
        <div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{{ error }}</div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (item of items; track item.itemId) {
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col hover:shadow-md hover:border-brand-orange/20 transition">
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1 min-w-0 pr-3">
                  <p class="font-semibold text-gray-900 truncate">{{ item.name }}</p>
                  <span class="inline-block text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-1">
                    {{ item.itemType }}
                  </span>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-lg font-bold text-brand-orange">{{ item.pointsCost | number }}</p>
                  <p class="text-xs text-gray-400">points</p>
                </div>
              </div>
              @if (item.description) {
                <p class="text-sm text-gray-500 flex-1 mb-4 leading-relaxed">{{ item.description }}</p>
              } @else {
                <div class="flex-1 mb-4"></div>
              }
              <p class="text-xs text-gray-600 mb-3">
                Expires on: {{ item.expiresAt ? (item.expiresAt | date:'dd MMM yyyy') : '-' }}
              </p>
              <button (click)="redeem(item)" [disabled]="redeeming === item.itemId || (summary && summary.totalPoints < item.pointsCost)"
                class="w-full py-2.5 text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                [class]="summary && summary.totalPoints >= item.pointsCost
                  ? 'bg-brand-orange text-white hover:bg-brand-orange-dark'
                  : 'bg-gray-100 text-gray-400'">
                @if (redeeming === item.itemId) {
                  <span class="inline-flex items-center gap-2 justify-center">
                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Redeeming...
                  </span>
                } @else if (summary && summary.totalPoints < item.pointsCost) {
                  Need {{ item.pointsCost - summary.totalPoints | number }} more pts
                } @else {
                  Redeem Now
                }
              </button>
            </div>
          }
          @empty {
            <div class="col-span-3 flex flex-col items-center justify-center py-16 text-center">
              <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 7H4l1-7z"/>
                </svg>
              </div>
              <p class="text-sm font-medium text-gray-500">No items available</p>
              <p class="text-xs text-gray-400 mt-1">Check back later for new rewards</p>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class CatalogComponent implements OnInit {
  items: CatalogItemDto[] = [];
  summary: RewardSummaryDto | null = null;
  redeeming: string | null = null;
  loading = true;
  error = '';

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private rewardsSvc: RewardsService,
    private walletSvc: WalletService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.rewardsSvc.getCatalog().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: r => {
        this.items = (r.data ?? []).filter(i => i.isActive);
        this.loading = false;
        this.error = '';
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to load rewards catalog.';
        this.cdr.markForCheck();
      }
    });
    this.rewardsSvc.getSummary().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      this.summary = r.data ?? null;
      this.cdr.markForCheck();
    });
  }

  redeem(item: CatalogItemDto): void {
    this.redeeming = item.itemId;
    this.rewardsSvc.redeem({ itemId: item.itemId }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.redeeming = null;

        if (!res.success) {
          this.toast.error(res.message || 'Unable to redeem this reward.');
          this.cdr.markForCheck();
          return;
        }

        this.toast.success(res.message || `Redeemed "${item.name}" successfully!`);
        // Refresh summary to update points
        this.rewardsSvc.getSummary().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
          this.summary = r.data ?? null;
          this.cdr.markForCheck();
        });

        // Refresh catalog to reflect stock/availability changes
        this.rewardsSvc.getCatalog().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
          this.items = (r.data ?? []).filter(i => i.isActive);
          this.cdr.markForCheck();
        });

        // Refresh wallet in case the redemption affects balance
        this.walletSvc.getBalance().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
        this.cdr.markForCheck();
      },
      error: () => {
        this.redeeming = null;
        this.toast.error('Reward redemption failed. Please try again.');
        this.cdr.markForCheck();
      }
    });
  }
}





