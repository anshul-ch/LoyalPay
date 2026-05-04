import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';

@Component({
  selector: 'app-admin-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-staff.component.html'
})
export class AdminStaffComponent implements OnInit {
  private ticketService = inject(TicketService);
  agents: any[] = [];
  form: any = { fullName: '', email: '', phone: '', password: '' };
  message = '';
  error = '';

  ngOnInit() { this.load(); }
  load() {
    this.ticketService.getSupportAgents().subscribe({
      next: res => {
        this.agents = res.data || [];
      },
      error: err => {
        this.agents = [];
        this.error = err.error?.message || 'Failed to load support agent list';
      }
    });
  }
  create() {
    this.ticketService.createSupportAgent(this.form).subscribe({
      next: res => { this.message = res.message || 'Support agent created.'; this.form = { fullName: '', email: '', phone: '', password: '' }; this.load(); },
      error: err => this.error = err.error?.message || 'Failed to create support agent'
    });
  }
}
