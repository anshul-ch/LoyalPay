import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WalletService } from '../../../core/services/wallet.service';
import { ToastService } from '../../../core/services/toast.service';
import { BalanceCardComponent } from '../balance-card/balance-card.component';
import { BalanceDto } from '../../../core/models/api.models';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-topup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BalanceCardComponent],
  template: `
    <div class="max-w-lg mx-auto space-y-6 page-enter">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Top Up Wallet</h1>
        <p class="text-sm text-gray-500 mt-1">Add money to your wallet instantly</p>
      </div>

      <app-balance-card [balance]="balance"></app-balance-card>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
          <!-- Quick amounts -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Quick Select</label>
            <div class="grid grid-cols-4 gap-2">
              @for (amt of quickAmounts; track amt) {
                <button type="button" (click)="setAmount(amt)"
                  class="py-2 text-sm font-semibold rounded-xl border-2 transition"
                  [class]="f['amount'].value === amt
                    ? 'border-brand-orange bg-brand-orange-light text-brand-orange'
                    : 'border-gray-200 text-gray-600 hover:border-brand-orange hover:text-brand-orange'">
                  ₹{{ amt | number }}
                </button>
              }
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Custom Amount (₹)</label>
            <input formControlName="amount" type="number" placeholder="Enter amount (1 – 50,000)"
              class="input" [class.input-error]="f['amount'].invalid && f['amount'].touched">
            @if (f['amount'].invalid && f['amount'].touched) {
              <p class="text-brand-red text-xs mt-1">Amount must be between ₹1 and ₹50,000.</p>
            }
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div class="grid grid-cols-3 gap-3">
              @for (method of methods; track method.value) {
                <label class="cursor-pointer">
                  <input type="radio" formControlName="paymentMethod" [value]="method.value" class="sr-only">
                  <div class="border-2 rounded-xl p-3 text-center transition"
                    [class]="f['paymentMethod'].value === method.value
                      ? 'border-brand-orange bg-brand-orange-light'
                      : 'border-gray-200 hover:border-gray-300'">
                    <span class="text-xl block mb-1">{{ method.icon }}</span>
                    <span class="text-xs font-semibold"
                      [class]="f['paymentMethod'].value === method.value ? 'text-brand-orange' : 'text-gray-600'">
                      {{ method.label }}
                    </span>
                  </div>
                </label>
              }
            </div>
          </div>
          @if (kycStatus !== 'Approved') {
            <div class="p-3 bg-red-50 text-red-700 text-sm rounded-xl font-medium">Please approve your KYC to add money.</div>
          }
          @if (topUpWarning) {
            <div class="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl font-semibold">
              {{ topUpWarning }}
            </div>
          }
          <button type="submit" [disabled]="form.invalid || loading || kycStatus !== 'Approved'"
            class="btn-primary w-full justify-center inline-flex items-center gap-2">
            @if (loading) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Processing...
            } @else {
              Proceed to Pay
            }
          </button>
        </form>
      </div>
    </div>
  `
})
export class TopUpComponent implements OnInit {
  loading = false;
  balance: BalanceDto | null = null;
  kycStatus: string | null = null;
  topUpWarning = '';
  quickAmounts = [500, 1000, 2000, 5000];
  methods = [
    { value: 'UPI', label: 'UPI', icon: '📱' },
    { value: 'Card', label: 'Card', icon: '💳' },
    { value: 'NetBanking', label: 'Net Banking', icon: '🏦' }
  ];

  form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(1), Validators.max(50000)]],
    paymentMethod: ['UPI', Validators.required]
  });

  get f() { return this.form.controls; }

  constructor(
    private fb: FormBuilder,
    private walletSvc: WalletService,
    private profileSvc: ProfileService,
    private toast: ToastService
  ) {
    this.profileSvc.getKycStatus().subscribe(r => this.kycStatus = r.data?.status ?? null);
  }

  ngOnInit(): void {
    this.walletSvc.getBalance().subscribe(r => this.balance = r.data ?? null);
  }

  setAmount(amt: number): void {
    this.form.patchValue({ amount: amt });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.topUpWarning = '';

    this.walletSvc.startTopUp(this.form.value as any).subscribe({
      next: res => {
        if (!res.success || !res.data?.topUpId) {
          this.loading = false;
          this.topUpWarning = res.message || 'Top-up could not be started.';
          this.toast.error(this.topUpWarning);
          return;
        }

        const topUpId = res.data.topUpId;
        this.walletSvc.finishTopUp(topUpId, true).subscribe({
          next: finishRes => {
            this.loading = false;
            if (!finishRes.success) {
              this.topUpWarning = finishRes.message || 'Top-up failed to complete.';
              this.toast.error(this.topUpWarning);
              return;
            }

            this.toast.success('Top-up successful!');
            this.walletSvc.getBalance().subscribe(r => this.balance = r.data ?? null);
            this.form.reset({ paymentMethod: 'UPI' });
          },
          error: () => {
            this.loading = false;
            this.topUpWarning = 'Top-up verification failed.';
            this.toast.error(this.topUpWarning);
          }
        });
      },
      error: () => {
        this.loading = false;
        this.topUpWarning = 'Unable to start payment request.';
        this.toast.error(this.topUpWarning);
      }
    });
  }
}
