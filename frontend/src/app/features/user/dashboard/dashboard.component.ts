import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WalletService } from '../../../core/services/wallet.service';
import { ProfileService } from '../../../core/services/profile.service';
import { TicketService } from '../../../core/services/ticket.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private walletService = inject(WalletService);
  private profileService = inject(ProfileService);
  private ticketService = inject(TicketService);

  balance: number = 0;
  transactions: any[] = [];
  
  isLoadingBalance = true;
  isLoadingTransactions = true;
  isUserActive = true;
  deactivationReason = '';
  showReactivationForm = false;
  isCreatingTicket = false;
  message = '';
  error = '';

  ngOnInit() {
    this.checkUserStatus();
    if (this.isUserActive) {
      this.loadBalance();
      this.loadTransactions();
    }
  }

  checkUserStatus() {
    this.profileService.getProfile().subscribe({
      next: (res) => {
        const profile = res.data;
        this.isUserActive = profile?.isActive ?? true;
        this.deactivationReason = profile?.inactiveReason || '';
      },
      error: () => {
        this.isUserActive = true;
      }
    });
  }

  createReactivationTicket() {
    this.isCreatingTicket = true;
    this.error = '';
    this.message = '';

    const ticketPayload = {
      category: 'AccountAccess',
      subject: 'Account Reactivation Request',
      description: 'My account has been deactivated. Please help me reactivate it.' + 
                   (this.deactivationReason ? ` Reason given: ${this.deactivationReason}` : '')
    };

    this.ticketService.createTicket(ticketPayload).subscribe({
      next: () => {
        this.message = 'Reactivation ticket created successfully. Support team will review and contact you soon.';
        this.showReactivationForm = false;
        this.isCreatingTicket = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create ticket. Please try again.';
        this.isCreatingTicket = false;
      }
    });
  }

  loadBalance() {
    this.walletService.getBalance().subscribe({
      next: (res) => {
        this.balance = res.data?.balance || 0;
        this.isLoadingBalance = false;
      },
      error: () => {
        this.isLoadingBalance = false;
      }
    });
  }

  loadTransactions() {
    this.walletService.getTransactions(1, 5).subscribe({
      next: (res) => {
        this.transactions = res.data?.items || [];
        this.isLoadingTransactions = false;
      },
      error: () => {
        this.isLoadingTransactions = false;
      }
    });
  }
}
