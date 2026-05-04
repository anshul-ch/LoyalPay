import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);

  users: any[] = [];
  search = '';
  kycStatus = '';
  tier = '';
  status = '';
  message = '';
  error = '';

  // Deactivation modal state
  showDeactivateModal = false;
  deactivatingUser: any = null;
  deactivateReason = '';

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.adminService.getUsers({
      page: 1,
      pageSize: 25,
      search: this.search,
      kycStatus: this.kycStatus,
      tier: this.tier,
      status: this.status
    }).subscribe({
      next: res => this.users = res.data?.items || [],
      error: () => this.users = []
    });
  }

  activate(user: any) {
    this.message = '';
    this.error = '';
    this.adminService.updateUserStatus(user.userId, { isActive: true }).subscribe({
      next: res => { this.message = res.message || 'User activated.'; this.loadUsers(); },
      error: err => this.error = err.error?.message || 'Failed to activate user.'
    });
  }

  openDeactivate(user: any) {
    this.deactivatingUser = user;
    this.deactivateReason = '';
    this.showDeactivateModal = true;
  }

  confirmDeactivate() {
    if (!this.deactivateReason.trim()) {
      this.error = 'Please provide a reason for deactivation.';
      return;
    }
    this.message = '';
    this.error = '';
    this.adminService.updateUserStatus(this.deactivatingUser.userId, {
      isActive: false,
      reason: this.deactivateReason.trim()
    }).subscribe({
      next: res => {
        this.message = res.message || 'User deactivated.';
        this.showDeactivateModal = false;
        this.deactivatingUser = null;
        this.deactivateReason = '';
        this.loadUsers();
      },
      error: err => {
        this.error = err.error?.message || 'Failed to deactivate user.';
        this.showDeactivateModal = false;
      }
    });
  }

  cancelDeactivate() {
    this.showDeactivateModal = false;
    this.deactivatingUser = null;
    this.deactivateReason = '';
  }
}
