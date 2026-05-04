import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AdminService } from '../../../core/services/admin.service';
import { TicketService } from '../../../core/services/ticket.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private ticketService = inject(TicketService);

  stats: any = {};
  pendingKyc: any[] = [];
  campaigns: any[] = [];
  rewards: any[] = [];
  tickets: any[] = [];
  supportAgents: any[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      stats: this.adminService.getDashboard().pipe(catchError(() => of({ data: {} }))),
      kyc: this.adminService.getPendingKyc().pipe(catchError(() => of({ data: [] }))),
      campaigns: this.adminService.getCampaigns().pipe(catchError(() => of({ data: [] }))),
      rewards: this.adminService.getRewards().pipe(catchError(() => of({ data: [] }))),
      tickets: this.ticketService.getAllTickets({ page: 1, size: 5 }).pipe(catchError(() => of({ data: { items: [] } }))),
      agents: this.ticketService.getSupportAgents().pipe(catchError(() => of({ data: [] })))
    }).subscribe({
      next: result => {
        this.stats = result.stats.data || {};
        this.pendingKyc = result.kyc.data || [];
        this.campaigns = result.campaigns.data || [];
        this.rewards = result.rewards.data || [];
        this.tickets = result.tickets.data?.items || [];
        this.supportAgents = result.agents.data || [];
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load admin dashboard.';
        this.isLoading = false;
      }
    });
  }

  activeCampaigns() {
    return this.campaigns.filter(item => item.isActive).length;
  }

  activeRewards() {
    return this.rewards.filter(item => item.isActive).length;
  }

  openTickets() {
    return this.tickets.filter(item => item.status === 'Open' || item.status === 'InProgress').length;
  }
}
