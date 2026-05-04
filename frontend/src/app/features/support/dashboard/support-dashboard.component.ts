import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TicketService } from '../../../core/services/ticket.service';

@Component({
  selector: 'app-support-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './support-dashboard.component.html'
})
export class SupportDashboardComponent implements OnInit {
  private ticketService = inject(TicketService);

  tickets: any[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading = true;
    this.errorMessage = '';
    this.ticketService.getAllTickets({ page: 1, size: 50 }).subscribe({
      next: res => {
        this.tickets = res.data?.items || [];
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load support dashboard.';
        this.isLoading = false;
      }
    });
  }

  count(status: string) {
    return this.tickets.filter(ticket => ticket.status === status).length;
  }

  highPriority() {
    return this.tickets.filter(ticket => ticket.priority === 'High');
  }

  activeTickets() {
    return this.tickets.filter(ticket =>
      (ticket.status === 'Open' || ticket.status === 'InProgress') &&
      ticket.category !== 'PinReset'
    );
  }

  resolvedToday() {
    const today = new Date().toDateString();
    return this.tickets.filter(ticket => ticket.status === 'Resolved' && ticket.resolvedAt && new Date(ticket.resolvedAt).toDateString() === today).length;
  }
}
