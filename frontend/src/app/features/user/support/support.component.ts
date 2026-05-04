import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService } from '../../../core/services/ticket.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrl: './support.component.css'
})
export class SupportComponent implements OnInit {
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);

  categoryIssueMap: Record<string, string[]> = {
    AccountAccess: ['Login problem', 'Password reset', 'Account blocked', 'Profile access'],
    PaymentIssue: ['Top-up failed', 'Payment pending', 'Duplicate debit', 'Refund not received'],
    TransactionDispute: ['Wrong transfer', 'Receiver not credited', 'Unauthorized transfer', 'Statement mismatch'],
    KycProblem: ['KYC upload failed', 'KYC rejected', 'Document mismatch', 'Verification pending too long'],
    Rewards: ['Points missing', 'Redeem failed', 'Tier mismatch', 'Campaign reward issue'],
    PinReset: ['Forgot PIN', 'PIN blocked', 'Need secure reset'],
    Other: ['General inquiry', 'Feature request', 'Complaint']
  };

  tickets: any[] = [];
  isLoading = true;
  email = '';

  // New ticket state
  showForm = false;
  subject = '';
  category = 'AccountAccess';
  issueType = 'Login problem';
  description = '';
  message = '';
  error = '';
  isSubmitting = false;

  ngOnInit() {
    this.email = this.authService.getCurrentUserEmail() || '';
    this.loadTickets();
  }

  loadTickets() {
    this.isLoading = true;
    this.ticketService.getMyTickets().subscribe({
      next: (res) => {
        this.tickets = res.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.tickets = [];
        this.isLoading = false;
      }
    });
  }

  createTicket() {
    this.message = '';
    this.error = '';
    const subject = this.subject.trim();
    const description = this.description.trim();
    if (!subject) {
      this.error = 'Subject is required.';
      return;
    }
    if (!description) {
      this.error = 'Description is required.';
      return;
    }
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    this.ticketService.createTicket({
      subject: `${this.issueType}: ${subject}`,
      category: this.category,
      description
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success === false) {
          this.error = res.message || 'Failed to create ticket.';
          return;
        }
        this.message = res.message || 'Support ticket created successfully.';
        this.showForm = false;
        this.subject = '';
        this.description = '';
        this.category = 'AccountAccess';
        this.issueType = this.categoryIssueMap['AccountAccess'][0];
        this.loadTickets();
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.status === 401 || err.status === 403) {
          this.error = 'You are not authorized as a User in this tab. Sign in again in this tab and retry.';
          return;
        }
        this.error = err.error?.message || 'Failed to create ticket. Please check that the backend is running.';
      }
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      // Reset form state when cancelling
      this.subject = '';
      this.description = '';
      this.category = 'AccountAccess';
      this.issueType = this.categoryIssueMap['AccountAccess'][0];
      this.error = '';
    }
  }

  onCategoryChange() {
    const options = this.categoryIssueMap[this.category] || [];
    this.issueType = options.length > 0 ? options[0] : '';
  }

  issueOptions() {
    return this.categoryIssueMap[this.category] || [];
  }
}
