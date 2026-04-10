import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WalletService } from '../../../core/services/wallet.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { LookupDto } from '../../../core/models/api.models';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmDialogComponent, CurrencyInrPipe],
  template: `
    <div class="max-w-lg mx-auto space-y-6 page-enter">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Transfer Money</h1>
        <p class="text-sm text-gray-500 mt-1">Send money to another LoyalPay user</p>
      </div>

      <!-- Step indicator -->
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            [class]="step >= 1 ? 'bg-brand-orange text-white' : 'bg-gray-200 text-gray-500'">1</div>
          <span class="text-sm font-medium" [class]="step >= 1 ? 'text-gray-900' : 'text-gray-400'">Find Recipient</span>
        </div>
        <div class="flex-1 h-px" [class]="step >= 2 ? 'bg-brand-orange' : 'bg-gray-200'"></div>
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            [class]="step >= 2 ? 'bg-brand-orange text-white' : 'bg-gray-200 text-gray-500'">2</div>
          <span class="text-sm font-medium" [class]="step >= 2 ? 'text-gray-900' : 'text-gray-400'">Enter Amount</span>
        </div>
      </div>

      <!-- Step 1: Lookup -->
      @if (step === 1) {
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 class="font-semibold text-gray-800 mb-4">Find Recipient</h2>
          <form [formGroup]="lookupForm" (ngSubmit)="lookup()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Recipient Email</label>
              <input formControlName="email" type="email" placeholder="recipient@example.com"
                class="input" [class.input-error]="lookupForm.get('email')!.invalid && lookupForm.get('email')!.touched">
              @if (lookupForm.get('email')!.invalid && lookupForm.get('email')!.touched) {
                <p class="text-brand-red text-xs mt-1">Please enter a valid email address.</p>
              }
            </div>
            @if (kycStatus !== 'Approved') {
              <div class="p-3 bg-red-50 text-red-700 text-sm rounded-xl font-medium">Please approve your KYC to transfer money.</div>
            }
            <button type="submit" [disabled]="lookupForm.invalid || lookupLoading || kycStatus !== 'Approved'"
              class="btn-primary w-full justify-center inline-flex items-center gap-2">
              @if (lookupLoading) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Looking up...
              } @else {
                Find Recipient
              }
            </button>
          </form>
        </div>
      }

      <!-- Step 2: Transfer -->
      @if (step === 2 && receiver) {
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div class="p-4 rounded-xl border bg-brand-navy text-white border-brand-navy shadow-sm">
            <p class="text-[11px] uppercase tracking-wide text-white/70 font-bold">Available Balance</p>
            <p class="text-2xl font-black mt-1">{{ currentBalance | currencyInr }}</p>
          </div>

          <!-- Recipient info -->
          <div class="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span class="text-emerald-700 font-bold text-sm">{{ receiver.fullName[0].toUpperCase() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-900 text-sm">{{ receiver.fullName }}</p>
              <p class="text-gray-500 text-xs truncate">{{ receiver.email }}</p>
            </div>
            <button type="button" (click)="step = 1; receiver = null"
              class="text-xs text-brand-orange hover:underline font-medium flex-shrink-0">
              Change
            </button>
          </div>

          <form [formGroup]="transferForm" (ngSubmit)="confirmTransfer()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹)</label>
              <input formControlName="amount" type="number" placeholder="1 – 25,000"
                class="input" [class.input-error]="tf['amount'].invalid && tf['amount'].touched">
              @if (tf['amount'].invalid && tf['amount'].touched) {
                <p class="text-brand-red text-xs mt-1">Amount must be between ₹1 and ₹25,000.</p>
              }
              @if (exceedsBalance) {
                <p class="text-brand-red text-xs mt-1">Insufficient balance for this transfer.</p>
              }
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Note (optional)</label>
              <input formControlName="note" type="text" placeholder="What's this for?"
                class="input">
            </div>
            <button type="submit" [disabled]="transferForm.invalid || exceedsBalance"
              class="btn-primary w-full justify-center">
              Review Transfer
            </button>
          </form>
        </div>
      }

      <app-confirm-dialog
        [visible]="showConfirm"
        title="Confirm Transfer"
        [message]="confirmMessage"
        confirmLabel="Transfer Now"
        (confirmed)="doTransfer()"
        (cancelled)="showConfirm = false">
      </app-confirm-dialog>
    </div>
  `
})
export class TransferComponent {
  step = 1;
  lookupLoading = false;
  receiver: LookupDto | null = null;
  showConfirm = false;
  kycStatus: string | null = null;
  currentBalance = 0;
  senderName = 'You';

  lookupForm = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  transferForm = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(1), Validators.max(25000)]],
    note: ['']
  });

  get tf() { return this.transferForm.controls; }

  get confirmMessage(): string {
    const amt = this.transferForm.value.amount ?? 0;
    return `Transfer ₹${amt.toLocaleString('en-IN')} to ${this.receiver?.fullName}?`;
  }

  get exceedsBalance(): boolean {
    const amt = this.transferForm.value.amount ?? 0;
    return amt > this.currentBalance;
  }

  constructor(
    private fb: FormBuilder,
    private walletSvc: WalletService,
    private profileSvc: ProfileService,
    private auth: AuthService,
    private toast: ToastService
  ) {
    this.profileSvc.getKycStatus().subscribe(r => this.kycStatus = r.data?.status ?? null);
    this.walletSvc.getBalance().subscribe(r => this.currentBalance = r.data?.balance ?? 0);
    this.auth.currentUser$.subscribe(u => this.senderName = u?.fullName || 'You');
  }

  lookup(): void {
    if (this.lookupForm.invalid) return;
    this.lookupLoading = true;
    this.walletSvc.lookupByEmail(this.lookupForm.value.email!).subscribe({
      next: res => {
        this.lookupLoading = false;
        if (res.data) { this.receiver = res.data; this.step = 2; }
        else this.toast.error('User not found.');
      },
      error: () => { this.lookupLoading = false; }
    });
  }

  confirmTransfer(): void {
    if (this.transferForm.invalid || this.exceedsBalance) return;
    this.showConfirm = true;
  }

  doTransfer(): void {
    this.showConfirm = false;
    this.walletSvc.transfer({
      receiverUserId: this.receiver!.userId,
      amount: this.transferForm.value.amount!,
      note: this.transferForm.value.note || undefined,
      receiverName: this.receiver?.fullName,
      senderName: this.senderName
    }).subscribe({
      next: (res) => {
        if (!res.success) {
          this.toast.error(res.message || 'Transfer failed.');
          return;
        }

        this.toast.success('Transfer successful!');
        this.currentBalance = Math.max(0, this.currentBalance - (this.transferForm.value.amount ?? 0));
        this.step = 1;
        this.receiver = null;
        this.transferForm.reset();
        this.lookupForm.reset();
      }
    });
  }
}
