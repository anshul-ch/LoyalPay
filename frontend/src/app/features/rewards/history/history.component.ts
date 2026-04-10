import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RewardsService } from '../../../core/services/rewards.service';
import { RewardTransactionDto } from '../../../core/models/api.models';

@Component({
  selector: 'app-rewards-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-5 page-enter">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Points History</h1>
          <p class="text-sm text-gray-500 mt-1">All your reward point activity</p>
        </div>
        <a routerLink="/rewards" class="text-sm text-brand-orange hover:underline font-medium flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Rewards
        </a>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        @if (loading) {
          <div class="divide-y divide-gray-50">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="flex items-center justify-between px-6 py-4 animate-pulse">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-gray-100"></div>
                  <div class="space-y-1.5">
                    <div class="h-3 w-32 bg-gray-100 rounded"></div>
                    <div class="h-2.5 w-20 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div class="h-3 w-16 bg-gray-100 rounded"></div>
              </div>
            }
          </div>
        } @else {
          <div class="divide-y divide-gray-50">
            @for (tx of history; track tx.transactionId) {
              <div class="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    [class]="tx.transactionType === 'Earned' ? 'bg-amber-100' : 'bg-purple-100'">
                    <svg class="w-4 h-4" [class]="tx.transactionType === 'Earned' ? 'text-amber-600' : 'text-purple-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      @if (tx.transactionType === 'Earned') {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                      } @else {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 7H4l1-7z"/>
                      }
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ tx.description }}</p>
                    <p class="text-xs text-gray-400">{{ tx.createdAt | date:'dd MMM yyyy, hh:mm a' }}</p>
                  </div>
                </div>
                <span class="text-sm font-bold"
                  [class]="tx.transactionType === 'Earned' ? 'text-amber-600' : 'text-purple-600'">
                  {{ tx.transactionType === 'Earned' ? '+' : '-' }}{{ tx.points }} pts
                </span>
              </div>
            }
            @empty {
              <div class="flex flex-col items-center justify-center py-16 text-center">
                <div class="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                  <svg class="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                </div>
                <p class="text-sm font-medium text-gray-500">No reward history yet</p>
                <p class="text-xs text-gray-400 mt-1">Start earning points by using your wallet</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class HistoryComponent implements OnInit {
  history: RewardTransactionDto[] = [];
  loading = true;

  constructor(private rewardsSvc: RewardsService) {}

  ngOnInit(): void {
    this.rewardsSvc.getHistory().subscribe({
      next: r => { this.history = r.data ?? []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
