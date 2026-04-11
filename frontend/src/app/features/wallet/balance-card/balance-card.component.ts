import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { BalanceDto } from '../../../core/models/api.models';

@Component({
  selector: 'app-balance-card',
  standalone: true,
  imports: [CommonModule, CurrencyInrPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full max-w-md mx-auto aspect-[1.586/1] rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden group">
      <!-- Glow & Ambient Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-gray-900 via-brand-navy-dark to-black"></div>
      <div class="absolute -top-24 -right-24 w-64 h-64 bg-brand-orange/40 rounded-full blur-3xl mix-blend-screen opacity-50 group-hover:opacity-80 transition duration-1000"></div>
      <div class="absolute -bottom-24 -left-20 w-56 h-56 bg-blue-500/30 rounded-full blur-3xl mix-blend-screen opacity-40 group-hover:opacity-70 transition duration-1000"></div>

      <!-- Glassmorphic Overlay -->
      <div class="absolute inset-0 border border-white/10 rounded-3xl backdrop-blur-sm pointer-events-none"></div>

      <!-- Content -->
      <div class="relative h-full flex flex-col justify-between z-10">
        <div class="flex items-center justify-between">
          <p class="text-white/60 text-sm font-semibold tracking-wider uppercase drop-shadow-sm">LoyalPay Card</p>
          <!-- Contactless icon -->
          <svg class="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5C9.5 7.5 9.5 16.5 8 19M11 4C13.5 7.5 13.5 16.5 11 20M14 3C17.5 7.5 17.5 16.5 14 21m3-20c4.5 5.5 4.5 16.5 0 22" />
          </svg>
        </div>

        <div>
          <!-- Fake CHIP -->
          <div class="w-12 h-9 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md mb-4 flex items-center justify-center opacity-90 shadow-md">
            <div class="w-full h-[1px] bg-black/10 absolute top-1/3"></div>
            <div class="w-full h-[1px] bg-black/10 absolute top-2/3"></div>
            <div class="h-full w-[1px] bg-black/10 absolute left-1/3"></div>
            <div class="h-full w-[1px] bg-black/10 absolute left-2/3"></div>
          </div>
          <p class="text-[40px] leading-none font-black tracking-tight drop-shadow-md">
            {{ balance?.balance | currencyInr }}
          </p>
          <div class="flex items-end justify-between mt-4">
            <div>
              <p class="text-xs text-white/50 uppercase font-medium tracking-widest mb-1">Available Funds</p>
              <div class="flex gap-2 text-white/80 font-mono text-sm">
                <span>****</span><span>****</span><span>****</span><span>1234</span>
              </div>
            </div>
            <!-- Circles (Mastercard-like) -->
            <div class="flex items-center -space-x-3 opacity-80">
              <div class="w-8 h-8 rounded-full bg-brand-orange mix-blend-screen"></div>
              <div class="w-8 h-8 rounded-full bg-brand-yellow mix-blend-screen"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BalanceCardComponent {
  @Input() balance: BalanceDto | null = null;
}
