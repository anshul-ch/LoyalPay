import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WalletService } from '../../../core/services/wallet.service';
import { BalanceCardComponent } from '../balance-card/balance-card.component';
import { BalanceDto, TransactionDto } from '../../../core/models/api.models';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';

@Component({
  selector: 'app-wallet-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, BalanceCardComponent, CurrencyInrPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col page-enter overflow-hidden relative">
      <!-- Ambient Background glow for entirely different aesthetic -->
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-3xl pointer-events-none"></div>

      <div class="mb-6 z-10 relative">
        <h1 class="text-[32px] font-black text-gray-900 tracking-tight leading-none">Wallet</h1>
        <p class="text-sm font-medium text-gray-500 mt-1.5 uppercase tracking-wide">Financial Management</p>
      </div>

      <div class="flex-1 flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
        
        <!-- Left Side: Interactive Digital Card & Actions -->
        <div class="lg:w-1/2 xl:w-5/12 flex flex-col space-y-8">
          
          <div class="transform transition hover:scale-[1.02] duration-300">
            @if (loadingBalance) {
               <div class="w-full max-w-md mx-auto aspect-[1.586/1] bg-gray-200 rounded-3xl animate-pulse"></div>
            } @else {
               <app-balance-card [balance]="balance"></app-balance-card>
            }
          </div>

          <!-- Glass Floating Action Bar (Different from Dashboard's cards) -->
          <div class="bg-white/60 backdrop-blur-xl border border-gray-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 pl-1">Transact</h3>
            
            <div class="grid grid-cols-2 gap-4">
              <a routerLink="/wallet/topup"
                class="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-brand-orange to-red-500 text-white shadow-lg shadow-brand-orange/20 hover:scale-[1.03] transition-transform group">
                <svg class="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                </svg>
                <span class="text-sm font-bold">Top Up</span>
              </a>
              
              <a routerLink="/wallet/transfer"
                class="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 text-gray-700 hover:bg-gray-50 hover:shadow-sm hover:border-gray-200 hover:scale-[1.03] transition-all group">
                <svg class="w-6 h-6 text-brand-navy group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                </svg>
                <span class="text-sm font-bold text-gray-900">Transfer</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Right Side: Vertical Ledger Timeline -->
        <div class="lg:w-1/2 xl:w-7/12 flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-full">
          <div class="px-6 py-5 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10">
            <h2 class="text-lg font-black text-gray-900 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></span>
              Ledger
            </h2>
            <a routerLink="/wallet/transactions" class="text-xs font-bold text-gray-400 hover:text-brand-orange uppercase tracking-wider transition">View all</a>
          </div>

          <div class="p-4 flex-1 overflow-y-auto">
            @if (loading) {
              <div class="space-y-4">
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="flex items-center gap-4 animate-pulse p-2">
                    <div class="w-12 h-12 bg-gray-100 rounded-2xl"></div>
                    <div class="flex-1 space-y-2">
                      <div class="h-3 w-32 bg-gray-100 rounded"></div>
                      <div class="h-2 w-24 bg-gray-50 rounded"></div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="space-y-2">
                @for (tx of transactions; track tx.entryId) {
                  <div class="group flex items-center justify-between p-3 sm:p-4 rounded-2xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                    <div class="flex items-center gap-4">
                      <!-- Icon -->
                      <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-sm"
                        [class]="tx.entryType === 'Credit' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-rose-400 to-rose-600'">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          @if (tx.entryType === 'Credit') {
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                          } @else {
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                          }
                        </svg>
                      </div>
                      <div>
                        <p class="text-[15px] font-bold text-gray-900 group-hover:text-brand-navy transition">{{ tx.description || tx.entryType }}</p>
                        <p class="text-xs font-medium text-gray-400 mt-0.5">{{ tx.createdAt | date:'MMM dd, yyyy • hh:mm a' }}</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-base font-black tracking-tight" [class]="tx.entryType === 'Credit' ? 'text-emerald-600' : 'text-gray-900'">
                        {{ tx.entryType === 'Credit' ? '+' : '-' }}{{ tx.amount | currencyInr }}
                      </p>
                    </div>
                  </div>
                }
                @empty {
                  <div class="flex flex-col items-center justify-center py-20 text-center">
                    <div class="w-16 h-16 bg-gray-50 border border-gray-100 rounded-3xl flex items-center justify-center mb-4 transform rotate-12">
                      <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                      </svg>
                    </div>
                    <p class="text-base font-bold text-gray-900">Your ledger is clean</p>
                    <p class="text-sm font-medium text-gray-500 mt-1 max-w-xs">You have no active transactions. Top up your new digital card to begin.</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `
})
export class WalletOverviewComponent implements OnInit {
  balance: BalanceDto | null = null;
  transactions: TransactionDto[] = [];
  loading = false;
  loadingBalance = true;

  constructor(private walletSvc: WalletService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loading = true;

    this.walletSvc.getBalance().subscribe({
      next: r => { this.balance = r.data ?? null; this.loadingBalance = false; this.cdr.markForCheck(); },
      error: () => { this.loadingBalance = false; this.cdr.markForCheck(); }
    });

    this.walletSvc.getTransactions(1, 6).subscribe({
      next: r => { this.transactions = r.data?.items ?? []; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }
}
