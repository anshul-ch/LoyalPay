import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { PinService } from '../../../core/services/pin.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-support-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support-tickets.component.html'
})
export class SupportTicketsComponent implements OnInit {
  private ticketService = inject(TicketService);
  private pinService = inject(PinService);
  private authService = inject(AuthService);

  readonly actionOptionsByCategory: Record<string, string[]> = {
    PinReset: ['Verify identity', 'Confirm reset reason', 'Reset PIN and notify user'],
    AccountAccess: ['Review account status', 'Confirm access issue', 'Guide user to recovery steps'],
    PaymentIssue: ['Review payment history', 'Check gateway status', 'Escalate payment investigation'],
    TransactionDispute: ['Gather transaction details', 'Review dispute evidence', 'Escalate to billing review'],
    KycProblem: ['Review KYC submission', 'Check document quality', 'Request resubmission'],
    Rewards: ['Review rewards balance', 'Confirm eligibility', 'Escalate rewards issue'],
    Other: ['Acknowledge issue', 'Gather more details', 'Escalate if needed']
  };

  tickets: any[] = [];
  agents: any[] = [];
  role: string | null = null;
  status = '';
  category = '';
  message = '';
  error = '';
  selected: any = null;
  updateStatus = 'InProgress';
  updatePriority = 'Medium';
  resolution = '';
  assignAgentId = '';
  transferToAgentId = '';
  ownershipReason = '';
  selectedAction = '';
  activatingUser = false;

  ngOnInit() {
    this.role = this.authService.getRole();
    this.load();
    if (this.role === 'Admin' || this.role === 'Support') {
      this.ticketService.getSupportAgents().subscribe({
        next: res => this.agents = res.data || [],
        error: err => {
          this.agents = [];
          this.error = err.error?.message || 'Failed to load support agent list.';
        }
      });
    }
  }

  load() {
    this.ticketService.getAllTickets({ page: 1, size: 50, status: this.status, category: this.category }).subscribe({
      next: res => this.tickets = res.data?.items || [],
      error: () => this.tickets = []
    });
  }

  open(ticket: any) {
    // Fetch full ticket detail so we have all fields (description, user.userId, etc.)
    this.ticketService.getTicket(ticket.ticketId).subscribe({
      next: res => {
        const full = res.data || ticket;
        this.selected = full;
        if (this.role === 'Admin') {
          this.updateStatus = (full.status === 'InProgress') ? 'InProgress' : 'Resolved';
        } else {
          this.updateStatus = full.status;
        }
        this.updatePriority = full.priority || 'Medium';
        this.resolution = full.resolution || '';
        this.assignAgentId = '';
        this.transferToAgentId = '';
        this.ownershipReason = '';
        this.selectedAction = '';
        this.message = '';
        this.error = '';
      },
      error: () => {
        // Fall back to list data if detail fetch fails
        this.selected = ticket;
        if (this.role === 'Admin') {
          this.updateStatus = (ticket.status === 'InProgress') ? 'InProgress' : 'Resolved';
        } else {
          this.updateStatus = ticket.status;
        }
        this.updatePriority = ticket.priority || 'Medium';
        this.resolution = ticket.resolution || '';
        this.assignAgentId = '';
        this.transferToAgentId = '';
        this.ownershipReason = '';
        this.selectedAction = '';
        this.message = '';
        this.error = '';
      }
    });
  }

  isAssignedToCurrentSupport(ticket: any): boolean {
    if (this.role !== 'Support') return true;
    const currentUserId = this.authService.getCurrentUserId();
    return !!currentUserId && (ticket?.assignedToUserId || '').toLowerCase() === currentUserId.toLowerCase();
  }

  saveTicket() {
    if (!this.selected) return;
    if (this.role === 'Support' && !this.isAssignedToCurrentSupport(this.selected)) {
      this.error = 'You can only work on tickets assigned to you.';
      return;
    }

    // Admin: status dropdown uses 'InProgress' | 'Resolved' — map Resolved to Closed on backend
    // keeping it as 'Resolved' is fine; the backend accepts both.
    // Admin does NOT edit the resolution note — preserve existing value.
    const payload: any = {
      status: this.updateStatus,
      priority: this.role === 'Admin' ? this.updatePriority : undefined,
      resolution: this.role === 'Admin' ? (this.selected.resolution || '') : this.resolution
    };

    this.ticketService.updateTicket(this.selected.ticketId, payload).subscribe({
      next: res => {
        this.message = res.message || 'Ticket updated.';
        this.selected = null;
        this.load();
      },
      error: err => this.error = err.error?.message || 'Failed to update ticket'
    });
  }

  assign(ticket: any, supportAgentId: string) {
    if (!supportAgentId) return;
    this.ticketService.assignTicket(ticket.ticketId, supportAgentId).subscribe({
      next: res => {
        this.message = res.message || 'Ticket assigned.';
        this.load();
      },
      error: err => this.error = err.error?.message || 'Failed to assign ticket'
    });
  }

  /** Admin-only save: update priority, then assign agent if one was selected */
  adminSave() {
    if (!this.selected) return;
    this.message = '';
    this.error = '';

    // Admin only changes priority (and optionally assigns an agent).
    // Status is managed by support agents only.
    this.ticketService.updateTicket(this.selected.ticketId, {
      status: this.selected.status,          // keep existing status unchanged
      priority: this.updatePriority,
      resolution: this.selected.resolution || ''
    }).subscribe({
      next: res => {
        if (this.assignAgentId) {
          this.ticketService.assignTicket(this.selected.ticketId, this.assignAgentId).subscribe({
            next: () => {
              this.message = 'Ticket updated and agent assigned.';
              this.selected = null;
              this.load();
            },
            error: err => {
              this.message = res.message || 'Ticket updated.';
              this.error = err.error?.message || 'Agent assignment failed.';
              this.load();
            }
          });
        } else {
          this.message = res.message || 'Ticket updated.';
          this.selected = null;
          this.load();
        }
      },
      error: err => this.error = err.error?.message || 'Failed to update ticket'
    });
  }

  /** Initiate PIN reset to default 00000 */
  openPinReset() {
    this.error = '';
    if (!this.selected) return;
    if (!this.isAssignedToCurrentSupport(this.selected)) {
      this.error = 'You can only reset PIN for tickets assigned to you.';
      return;
    }

    const ticketId = this.selected.ticketId || this.selected.TicketId;
    const user = this.selected.user || this.selected.User;
    const userId = user?.userId || user?.UserId;

    if (!ticketId) {
      this.error = 'Ticket ID is missing. Please close and reopen the ticket.';
      return;
    }
    if (!userId) {
      this.error = 'User ID is missing. Please close and reopen the ticket.';
      return;
    }

    // Reset PIN to default 00000
    this.pinService.resetPin({
      ticketId,
      userId,
      newPin: '00000'
    }).subscribe({
      next: res => {
        this.message = res.message || 'PIN reset to default. User can now set their own PIN.';
        this.selected = null;
        this.load();
      },
      error: err => {
        this.error = err.error?.message || err.message || 'PIN reset failed. Please try again.';
      }
    });
  }

  requestTransfer() {
    if (!this.selected || this.role !== 'Support') return;
    if (!this.isAssignedToCurrentSupport(this.selected)) {
      this.error = 'You can only request transfer for your assigned tickets.';
      return;
    }
    if (!this.transferToAgentId) {
      this.error = 'Select an agent to request reassignment.';
      return;
    }
    const requestedAgent = this.agents.find(a => a.userId === this.transferToAgentId);
    const transferNote = `[Transfer Request] Please reassign to ${requestedAgent?.fullName || 'selected agent'}. ${this.resolution || ''}`.trim();
    this.ticketService.updateTicket(this.selected.ticketId, {
      status: 'Open',
      resolution: transferNote
    }).subscribe({
      next: res => {
        this.message = res.message || 'Transfer request sent. Admin approval is required for reassignment.';
        this.selected = null;
        this.load();
      },
      error: err => this.error = err.error?.message || 'Failed to submit transfer request'
    });
  }

  actionOptions() {
    return this.actionOptionsByCategory[this.selected?.category || 'Other'] || this.actionOptionsByCategory['Other'];
  }

  applyActionTemplate() {
    if (!this.selectedAction) return;
    const note = `[Action] ${this.selectedAction}`;
    this.resolution = this.resolution ? `${this.resolution}\n${note}` : note;
    this.message = 'Action note added. Remember to click Update Ticket to save.';
    setTimeout(() => this.message = '', 5000); // Clear message after 5 seconds
  }

  canActivateUser(): boolean {
    return this.role === 'Support'
      && this.isAssignedToCurrentSupport(this.selected)
      && this.selected?.category === 'AccountAccess'
      && !!this.selected?.user?.userId;
  }

  activateUserFromTicket() {
    if (!this.canActivateUser() || this.activatingUser) return;

    this.activatingUser = true;
    this.error = '';
    this.message = '';

    this.ticketService.activateUser(this.selected.user.userId).subscribe({
      next: res => {
        this.message = res.message || 'User account has been activated successfully.';
        this.resolution = this.resolution
          ? `${this.resolution}\n[Action] User account activated after review.`
          : '[Action] User account activated after review.';
        this.updateStatus = 'Resolved';
        this.activatingUser = false;
        this.load();
      },
      error: err => {
        this.activatingUser = false;
        this.error = err.error?.message || 'Failed to activate user.';
      }
    });
  }

  requestOwnership(ticket: any) {
    if (this.role !== 'Support') return;
    this.ticketService.requestOwnership(ticket.ticketId, this.ownershipReason).subscribe({
      next: res => {
        this.message = res.message || 'Ownership request submitted to admin.';
        this.ownershipReason = '';
        this.load();
      },
      error: err => this.error = err.error?.message || 'Failed to submit ownership request'
    });
  }
}
