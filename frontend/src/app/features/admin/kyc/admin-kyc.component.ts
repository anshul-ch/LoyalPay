import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-kyc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-kyc.component.html'
})
export class AdminKycComponent implements OnInit {
  private adminService = inject(AdminService);

  submissions: any[] = [];
  message = '';
  error = '';

  // Rejection modal state
  showRejectModal = false;
  rejectingId = '';
  rejectionNote = '';

  ngOnInit() { this.load(); }

  load() {
    this.adminService.getPendingKyc().subscribe({
      next: res => this.submissions = res.data || [],
      error: () => this.submissions = []
    });
  }

  approve(id: string) {
    this.message = '';
    this.error = '';
    this.adminService.approveKyc(id).subscribe({
      next: res => { this.message = res.message || 'KYC approved.'; this.load(); },
      error: err => this.error = err.error?.message || 'Failed to approve KYC.'
    });
  }

  openReject(id: string) {
    this.rejectingId = id;
    this.rejectionNote = '';
    this.showRejectModal = true;
  }

  confirmReject() {
    if (!this.rejectionNote.trim()) {
      this.error = 'Please provide a rejection reason.';
      return;
    }
    this.message = '';
    this.error = '';
    this.adminService.rejectKyc(this.rejectingId, this.rejectionNote.trim()).subscribe({
      next: res => {
        this.message = res.message || 'KYC rejected.';
        this.showRejectModal = false;
        this.rejectingId = '';
        this.rejectionNote = '';
        this.load();
      },
      error: err => {
        this.error = err.error?.message || 'Failed to reject KYC.';
        this.showRejectModal = false;
      }
    });
  }

  cancelReject() {
    this.showRejectModal = false;
    this.rejectingId = '';
    this.rejectionNote = '';
  }

  download(id: string) {
    this.adminService.getKycDocument(id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => this.error = 'Failed to load document.'
    });
  }
}
