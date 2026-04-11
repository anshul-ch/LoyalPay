import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WalletService } from '../../../core/services/wallet.service';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { TransactionDto } from '../../../core/models/api.models';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, CurrencyInrPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-5 page-enter">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Transaction History</h1>
          <p class="text-sm text-gray-500 mt-1">All your wallet activity in one place</p>
        </div>
        @if (transactions.length > 0) {
          <span class="text-sm text-gray-500 font-medium">{{ transactions.length }} transactions</span>
        }
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        @if (loadError && transactions.length === 0) {
          <div class="p-4 text-sm text-red-700 bg-red-50 border-b border-red-100">{{ loadError }}</div>
        }
        @if (loading && transactions.length === 0) {
          <div class="divide-y divide-gray-50">
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <div class="flex items-center justify-between px-6 py-4 animate-pulse">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gray-100"></div>
                  <div class="space-y-1.5">
                    <div class="h-3 w-36 bg-gray-100 rounded"></div>
                    <div class="h-2.5 w-24 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div class="text-right space-y-1.5">
                  <div class="h-3 w-20 bg-gray-100 rounded"></div>
                  <div class="h-2.5 w-16 bg-gray-100 rounded ml-auto"></div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="divide-y divide-gray-50">
            @for (tx of transactions; track tx.entryId) {
              <div class="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    [class]="tx.entryType === 'Credit' ? 'bg-emerald-100' : 'bg-red-100'">
                    <svg class="w-4 h-4" [class]="tx.entryType === 'Credit' ? 'text-emerald-600' : 'text-red-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      @if (tx.entryType === 'Credit') {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                      } @else {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                      }
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ tx.description || tx.entryType }}</p>
                    <p class="text-xs text-gray-400">{{ tx.createdAt | date:'dd MMM yyyy, hh:mm a' }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold" [class]="tx.entryType === 'Credit' ? 'text-emerald-600' : 'text-red-500'">
                    {{ tx.entryType === 'Credit' ? '+' : '-' }}{{ tx.amount | currencyInr }}
                  </p>
                  <p class="text-xs text-gray-400 mt-0.5">Bal: {{ tx.balanceAfter | currencyInr }}</p>
                </div>
              </div>
            }
            @empty {
              <div class="flex flex-col items-center justify-center py-16 text-center">
                <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
                <p class="text-sm font-medium text-gray-500">No transactions found</p>
                <p class="text-xs text-gray-400 mt-1">Your transaction history will appear here</p>
              </div>
            }
          </div>

          @if (hasMore) {
            <div class="p-4 border-t border-gray-100 text-center">
              <button type="button" (click)="loadMore()" [disabled]="loading"
                class="px-6 py-2 text-sm font-semibold text-brand-orange border-2 border-brand-orange rounded-xl hover:bg-brand-orange-light transition disabled:opacity-50 inline-flex items-center gap-2">
                @if (loading) {
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Loading...
                } @else {
                  Load more
                }
              </button>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class TransactionsComponent implements OnInit {
  transactions: TransactionDto[] = [];
  page = 1;
  size = 20;
  hasMore = false;
  loading = false;
  loadError = '';
  private readonly destroyRef = inject(DestroyRef);

  constructor(private walletSvc: WalletService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(1); }

  load(page: number): void {
    this.loading = true;
    this.loadError = '';
    this.cdr.markForCheck();
    this.walletSvc.getTransactions(page, this.size).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        const items = res.data?.items ?? [];
        const existing = new Set(this.transactions.map(t => t.entryId));
        const newItems = items.filter(t => !existing.has(t.entryId));
        this.transactions = page === 1 ? items : [...this.transactions, ...newItems];
        this.hasMore = items.length === this.size;
        this.page = page;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.loadError = 'Unable to load transactions.';
        this.cdr.markForCheck();
      }
    });
  }

  loadMore(): void { this.load(this.page + 1); }
}
