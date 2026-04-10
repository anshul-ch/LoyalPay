import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RewardsService } from '../../../core/services/rewards.service';
import { RewardSummaryDto } from '../../../core/models/api.models';

interface TierInfo {
  name: string;
  icon: string;
  minPoints: number;
  color: string;
  bg: string;
  border: string;
}

const TIERS: TierInfo[] = [
  { name: 'Bronze',   icon: '🥉', minPoints: 0,     color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  { name: 'Silver',   icon: '🥈', minPoints: 1000,  color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200' },
  { name: 'Gold',     icon: '🥇', minPoints: 5000,  color: 'text-yellow-600',  bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  { name: 'Platinum', icon: '💎', minPoints: 15000, color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200' },
];

@Component({
  selector: 'app-rewards-summary',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 page-enter">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Rewards</h1>
          <p class="text-sm text-gray-500 mt-1">Your loyalty points and tier status</p>
        </div>
        <a routerLink="/rewards/catalog" class="btn-primary inline-flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 7H4l1-7z"/>
          </svg>
          Browse Catalog
        </a>
      </div>

      @if (loading) {
        <div class="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse space-y-4">
          <div class="h-6 w-32 bg-gray-100 rounded"></div>
          <div class="h-14 w-48 bg-gray-100 rounded"></div>
          <div class="h-3 bg-gray-100 rounded-full"></div>
        </div>
      } @else if (summary) {
        <!-- Main points card -->
        <div class="bg-gradient-to-br from-brand-navy via-brand-navy to-brand-navy-dark rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div class="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div class="absolute bottom-0 left-0 w-48 h-48 bg-brand-red/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
          <div class="relative">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-blue-200 text-sm font-medium">Total Points</p>
                <p class="text-6xl font-extrabold mt-1 tracking-tight">{{ summary.totalPoints | number }}</p>
                <p class="text-blue-300 text-sm mt-1">pts</p>
              </div>
              <div class="text-right">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                  <span class="text-2xl">{{ currentTier?.icon }}</span>
                  <div>
                    <p class="text-white font-bold text-sm">{{ summary.tier }}</p>
                    <p class="text-blue-300 text-xs">Current Tier</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Progress to next tier -->
            @if (nextTier) {
              <div class="mt-6">
                <div class="flex items-center justify-between text-xs mb-2">
                  <span class="text-blue-200 font-medium">{{ summary.tier }} → {{ nextTier.name }}</span>
                  <span class="text-blue-200">{{ pointsToNext | number }} pts to go</span>
                </div>
                <div class="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-1000"
                    style="background: linear-gradient(90deg, #F77F00, #FCBF49)"
                    [style.width]="progressPercent + '%'"></div>
                </div>
                <div class="flex justify-between text-xs text-blue-300/60 mt-1">
                  <span>{{ currentTier?.minPoints | number }}</span>
                  <span>{{ nextTier.minPoints | number }}</span>
                </div>
              </div>
            } @else {
              <div class="mt-6 flex items-center gap-2 px-4 py-2.5 bg-white/10 rounded-xl w-fit">
                <span class="text-lg">💎</span>
                <span class="text-sm text-amber-200 font-semibold">Maximum tier reached!</span>
              </div>
            }
          </div>
        </div>

        <!-- Tier journey -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Tier Journey</h3>
          <div class="relative">
            <!-- Progress line -->
            <div class="absolute top-6 left-6 right-6 h-0.5 bg-gray-100 hidden sm:block"></div>
            <div class="absolute top-6 left-6 h-0.5 bg-brand-orange hidden sm:block transition-all duration-700"
              [style.width]="tierLineWidth"></div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              @for (tier of tiers; track tier.name) {
                <div class="relative flex flex-col items-center text-center">
                  <!-- Circle -->
                  <div class="w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl mb-2 relative z-10 transition-all"
                    [class]="isTierReached(tier)
                      ? 'border-brand-orange bg-brand-orange-light shadow-md shadow-brand-orange/20'
                      : 'border-gray-200 bg-white'"
                    [class.ring-4]="summary.tier === tier.name"
                    [class.ring-brand-orange]="summary.tier === tier.name"
                    [class.ring-offset-2]="summary.tier === tier.name">
                    {{ tier.icon }}
                  </div>
                  <p class="text-sm font-semibold"
                    [class]="summary.tier === tier.name ? 'text-brand-orange' : isTierReached(tier) ? 'text-gray-700' : 'text-gray-400'">
                    {{ tier.name }}
                  </p>
                  <p class="text-xs mt-0.5"
                    [class]="isTierReached(tier) ? 'text-gray-500' : 'text-gray-300'">
                    {{ tier.minPoints | number }} pts
                  </p>
                  @if (summary.tier === tier.name) {
                    <span class="mt-1 px-2 py-0.5 bg-brand-orange text-white text-[10px] font-bold rounded-full">Current</span>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Quick links -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a routerLink="/rewards/catalog"
            class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-orange/30 transition group flex items-center gap-4">
            <div class="w-12 h-12 bg-brand-orange-light rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-orange transition">
              <svg class="w-6 h-6 text-brand-orange group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 7H4l1-7z"/>
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-900">Redeem Rewards</p>
              <p class="text-gray-500 text-xs mt-0.5">Browse and redeem catalog items</p>
            </div>
            <svg class="w-5 h-5 text-gray-300 ml-auto group-hover:text-brand-orange transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
          <a routerLink="/rewards/history"
            class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-orange/30 transition group flex items-center gap-4">
            <div class="w-12 h-12 bg-brand-navy-light rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-navy transition">
              <svg class="w-6 h-6 text-brand-navy group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-900">Points History</p>
              <p class="text-gray-500 text-xs mt-0.5">View all earned and redeemed points</p>
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
export class SummaryComponent implements OnInit {
  summary: RewardSummaryDto | null = null;
  loading = true;
  tiers = TIERS;

  get currentTier(): TierInfo | undefined {
    return TIERS.find(t => t.name === this.summary?.tier);
  }

  get nextTier(): TierInfo | undefined {
    const idx = TIERS.findIndex(t => t.name === this.summary?.tier);
    return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : undefined;
  }

  get progressPercent(): number {
    if (!this.summary || !this.currentTier || !this.nextTier) return 100;
    const pts = this.summary.totalPoints;
    const from = this.currentTier.minPoints;
    const to = this.nextTier.minPoints;
    return Math.min(100, Math.round(((pts - from) / (to - from)) * 100));
  }

  get pointsToNext(): number {
    if (!this.summary || !this.nextTier) return 0;
    return Math.max(0, this.nextTier.minPoints - this.summary.totalPoints);
  }

  get tierLineWidth(): string {
    const idx = TIERS.findIndex(t => t.name === this.summary?.tier);
    const pct = idx <= 0 ? 0 : idx >= TIERS.length - 1 ? 100 : (idx / (TIERS.length - 1)) * 100;
    return `calc(${pct}% - 3rem)`;
  }

  isTierReached(tier: TierInfo): boolean {
    if (!this.summary) return false;
    const pts = this.summary.totalPoints;
    return pts >= tier.minPoints;
  }

  constructor(private rewardsSvc: RewardsService) {}

  ngOnInit(): void {
    this.rewardsSvc.getSummary().subscribe({
      next: r => { this.summary = r.data ?? null; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
