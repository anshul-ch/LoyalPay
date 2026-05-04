import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { WalletService } from '../../../core/services/wallet.service';
import { ProfileService } from '../../../core/services/profile.service';
import { PinService } from '../../../core/services/pin.service';
import { PinPadComponent } from '../../../shared/pin-pad/pin-pad.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, PinPadComponent],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.css'
})
export class TransactionsComponent implements OnInit {
  private walletService = inject(WalletService);
  private profileService = inject(ProfileService);
  private pinService = inject(PinService);
  private route = inject(ActivatedRoute);

  transactions: any[] = [];
  isLoading = true;
  kycStatus = '';
  currentUserName = '';
  page = 1;
  total = 0;
  activeTab: 'history' | 'topup' | 'transfer' | 'statement' = 'topup';

  transferEmail = '';
  transferAmount: number | null = null;
  transferNote = '';
  transferMessage = '';
  transferError = '';
  isTransferring = false;

  topupAmount: number | null = null;
  paymentMethod = 'UPI';
  topupMessage = '';
  topupError = '';
  isToppingUp = false;

  statementFrom = '';
  statementTo = '';

  // PIN pad state
  showPinPad = false;
  pinAction: 'transfer' | 'topup' | null = null;
  pinPadTitle = 'Confirm Transfer';
  pinPadSubtitle = 'Enter your 5-digit transaction PIN to authorise';

  ngOnInit() {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'topup' || tab === 'transfer' || tab === 'statement' || tab === 'history') {
      this.activeTab = tab;
    }
    this.profileService.getProfile().subscribe({
      next: p => {
        this.kycStatus = p.data?.kycStatus || '';
        this.currentUserName = p.data?.fullName || '';
      },
      error: () => {
        this.kycStatus = '';
        this.currentUserName = '';
      }
    });
    this.loadTransactions();
  }

  loadTransactions() {
    this.isLoading = true;
    this.walletService.getTransactions(this.page, 15).subscribe({
      next: res => {
        this.transactions = res.data?.items || [];
        this.total = res.data?.total || 0;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  initiateTopUp() {
    this.topupMessage = '';
    this.topupError = '';
    if (!this.kycStatus || this.kycStatus.toLowerCase() !== 'approved') {
      this.topupError = 'KYC not approved. Please complete KYC to top-up.';
      return;
    }
    const amount = this.topupAmount ?? 0;
    if (amount < 1 || amount > 50000) {
      this.topupError = 'Top-up amount must be between INR 1 and INR 50,000.';
      return;
    }
    if (this.isToppingUp) return;
    this.pinAction = 'topup';
    this.pinPadTitle = 'Confirm Top Up';
    this.pinPadSubtitle = 'Enter your 5-digit transaction PIN to continue';
    this.showPinPad = true;
  }

  private doTopUp() {
    const amount = this.topupAmount ?? 0;
    this.walletService.startTopUp({ amount, paymentMethod: this.paymentMethod }).subscribe({
      next: res => {
        const topupId = res.data?.topUpId;
        if (!topupId) {
          this.topupError = 'Failed to initiate top-up. Please try again.';
          this.isToppingUp = false;
          return;
        }
        this.walletService.finishTopUp(topupId, { success: true }).subscribe({
          next: () => {
            this.topupMessage = 'Top-up successful.';
            this.topupAmount = null;
            this.isToppingUp = false;
            this.loadTransactions();
          },
          error: err => {
            this.topupError = err.error?.message || 'Top-up completion failed';
            this.isToppingUp = false;
          }
        });
      },
      error: err => {
        this.topupError = err.error?.message || 'Top-up initialization failed';
        this.isToppingUp = false;
      }
    });
  }

  /** Called when user clicks "Send Money" — validates fields then opens PIN pad */
  initiateTransfer() {
    this.transferMessage = '';
    this.transferError = '';
    if (!this.kycStatus || this.kycStatus.toLowerCase() !== 'approved') {
      this.transferError = 'KYC not approved. Please complete KYC to send money.';
      return;
    }
    const amount = this.transferAmount ?? 0;
    if (!this.transferEmail || !this.transferEmail.includes('@')) {
      this.transferError = 'Please enter a valid recipient email address.';
      return;
    }
    if (amount < 1 || amount > 25000) {
      this.transferError = 'Transfer amount must be between INR 1 and INR 25,000.';
      return;
    }
    this.pinAction = 'transfer';
    this.pinPadTitle = 'Confirm Transfer';
    this.pinPadSubtitle = 'Enter your 5-digit transaction PIN to authorise';
    this.showPinPad = true;
  }

  /** Called by PinPadComponent when user confirms their PIN */
  onPinConfirmed(pin: string) {
    this.showPinPad = false;
    const pendingAction = this.pinAction;
    this.pinAction = null;
    if (!pendingAction) return;

    if (pendingAction === 'transfer') {
      if (this.isTransferring) return;
      this.isTransferring = true;
      this.transferError = '';
    } else {
      if (this.isToppingUp) return;
      this.isToppingUp = true;
      this.topupError = '';
    }

    this.pinService.verifyPin({ pin }).subscribe({
      next: pinRes => {
        if (!pinRes.data) {
          const message = pinRes.message || 'Incorrect PIN. Please try again.';
          if (pendingAction === 'transfer') {
            this.transferError = message;
            this.isTransferring = false;
          } else {
            this.topupError = message;
            this.isToppingUp = false;
          }
          return;
        }
        if (pendingAction === 'transfer') {
          this.lookupAndTransfer();
        } else {
          this.doTopUp();
        }
      },
      error: err => {
        const message = err.error?.message || 'PIN verification failed. Please try again.';
        if (pendingAction === 'transfer') {
          this.transferError = message;
          this.isTransferring = false;
        } else {
          this.topupError = message;
          this.isToppingUp = false;
        }
      }
    });
  }

  onPinCancelled() {
    this.showPinPad = false;
    this.pinAction = null;
  }

  private lookupAndTransfer() {
    this.profileService.lookupUser(this.transferEmail).subscribe({
      next: lookup => {
        const receiver = lookup.data;
        if (!receiver) {
          this.transferError = 'No active user found with that email address.';
          this.isTransferring = false;
          return;
        }
        this.walletService.transfer({
          receiverUserId: receiver.userId,
          receiverName: receiver.fullName,
          senderName: this.currentUserName,
          amount: this.transferAmount,
          note: this.transferNote
        }).subscribe({
          next: () => {
            this.transferMessage = 'Transfer successful.';
            this.transferEmail = '';
            this.transferAmount = null;
            this.transferNote = '';
            this.isTransferring = false;
            this.loadTransactions();
          },
          error: err => {
            this.transferError = err.error?.message || 'Transfer failed. Please try again.';
            this.isTransferring = false;
          }
        });
      },
      error: err => {
        this.transferError = err.error?.message || 'No active user found with that email address.';
        this.isTransferring = false;
      }
    });
  }

  downloadStatement(format: 'pdf' | 'csv') {
    if (!this.statementFrom || !this.statementTo) {
      return;
    }
    this.walletService.downloadStatement(format, this.statementFrom, this.statementTo).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `loyalpay-statement.${format}`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {}
    });
  }
}
