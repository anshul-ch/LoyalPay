import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { KycSubmissionView, UserView } from '../../../core/models/api.models';

@Component({
  selector: 'app-kyc-management',
  standalone: true,
  imports: [CommonModule, ConfirmDialogComponent],
  template: `
    <div class="space-y-5 page-enter">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">KYC Review</h1>
          <p class="text-gray-500 text-sm mt-0.5">Review and action pending identity verifications</p>
        </div>
        @if (!loading && submissions.length > 0) {
          <span class="px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full">
            {{ submissions.length }} pending
          </span>
        }
      </div>

      <!-- Loading skeleton -->
      @if (loading) {
        <div class="space-y-4">
          @for (i of [1,2,3]; track i) {
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
              <div class="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-gray-200"></div>
                <div class="space-y-1.5 flex-1">
                  <div class="h-3 w-32 bg-gray-200 rounded"></div>
                  <div class="h-2.5 w-48 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div class="px-6 py-4 space-y-3">
                <div class="grid grid-cols-4 gap-4">
                  @for (j of [1,2,3,4]; track j) {
                    <div class="h-8 bg-gray-100 rounded"></div>
                  }
                </div>
                <div class="flex gap-3">
                  <div class="h-9 w-32 bg-gray-100 rounded-xl"></div>
                  <div class="h-9 w-24 bg-gray-100 rounded-xl"></div>
                  <div class="h-9 w-24 bg-gray-100 rounded-xl"></div>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="space-y-4">
          @for (sub of submissions; track sub.submissionId) {
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <!-- User header -->
              <div class="flex items-center gap-4 px-6 py-4 bg-brand-navy-light/50 border-b border-gray-100">
                <div class="w-10 h-10 rounded-full bg-brand-navy flex items-center justify-center flex-shrink-0">
                  <span class="text-white font-bold text-sm">{{ getUserInitials(sub.userId) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-brand-navy text-sm">{{ getUserName(sub.userId) }}</p>
                  <p class="text-gray-500 text-xs truncate">{{ getUserEmail(sub.userId) }}</p>
                </div>
                <span class="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex-shrink-0">
                  {{ sub.status }}
                </span>
              </div>

              <!-- Document details -->
              <div class="px-6 py-5">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  <div>
                    <p class="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Document Type</p>
                    <p class="text-sm font-semibold text-gray-900">{{ sub.documentType }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Document Number</p>
                    <p class="text-sm font-semibold text-gray-900 font-mono">{{ sub.documentNumber }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">File</p>
                    <p class="text-sm text-gray-700 truncate" [title]="sub.fileName">{{ sub.fileName }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Submitted</p>
                    <p class="text-sm text-gray-700">{{ sub.submittedAt | date:'dd MMM yyyy' }}</p>
                  </div>
                </div>

                <!-- Document preview -->
                @if (documentUrls[sub.submissionId]) {
                  <div class="mb-5 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    @if (isImage(sub.submissionId)) {
                      <img [src]="documentUrls[sub.submissionId]"
                           alt="KYC Document"
                           class="max-h-80 w-full object-contain">
                    } @else {
                      <div class="p-8 text-center">
                        <div class="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <svg class="w-7 h-7 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                        </div>
                        <a [href]="documentUrls[sub.submissionId]" target="_blank"
                           class="inline-flex items-center gap-2 text-brand-orange font-semibold text-sm hover:underline">
                          Open PDF Document
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                          </svg>
                        </a>
                      </div>
                    }
                  </div>
                }

                <!-- Actions -->
                <div class="flex items-center gap-3 flex-wrap">
                  <button (click)="viewDocument(sub)"
                    [disabled]="loadingDoc === sub.submissionId"
                    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-navy border border-brand-navy-light rounded-xl hover:bg-brand-navy-light transition disabled:opacity-50">
                    @if (loadingDoc === sub.submissionId) {
                      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Loading...
                    } @else {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                      {{ documentUrls[sub.submissionId] ? 'Reload Doc' : 'View Document' }}
                    }
                  </button>

                  <button (click)="openApprove(sub)"
                    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Approve
                  </button>

                  <button (click)="openReject(sub)"
                    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-red rounded-xl hover:bg-brand-red-dark transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    Reject
                  </button>
                </div>
              </div>
            </div>
          }

          @empty {
            <div class="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
              <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <p class="font-semibold text-gray-900">All caught up!</p>
              <p class="text-gray-500 text-sm mt-1">No pending KYC submissions to review.</p>
            </div>
          }
        </div>
      }
    </div>

    <app-confirm-dialog
      [visible]="showApprove"
      title="Approve KYC"
      [message]="approveMessage"
      confirmLabel="Approve"
      confirmClass="bg-emerald-600 hover:bg-emerald-700"
      (confirmed)="doApprove()"
      (cancelled)="showApprove = false">
    </app-confirm-dialog>

    <app-confirm-dialog
      [visible]="showReject"
      title="Reject KYC"
      [message]="rejectMessage"
      confirmLabel="Reject"
      confirmClass="bg-brand-red hover:bg-brand-red-dark"
      [showNote]="true"
      (confirmed)="doReject($event)"
      (cancelled)="showReject = false">
    </app-confirm-dialog>
  `
})
export class KycManagementComponent implements OnInit {
  submissions: KycSubmissionView[] = [];
  users: UserView[] = [];
  documentUrls: Record<string, string> = {};
  documentTypes: Record<string, string> = {};
  loadingDoc: string | null = null;
  loading = true;
  selected: KycSubmissionView | null = null;
  showApprove = false;
  showReject = false;

  get approveMessage(): string {
    if (!this.selected) return '';
    return `Approve ${this.selected.documentType} (${this.selected.documentNumber}) for ${this.getUserName(this.selected.userId)}?`;
  }

  get rejectMessage(): string {
    if (!this.selected) return '';
    return `Reject ${this.selected.documentType} for ${this.getUserName(this.selected.userId)}. Provide a reason (optional):`;
  }

  constructor(private adminSvc: AdminService, private toast: ToastService) {}

  ngOnInit(): void {
    forkJoin({
      users: this.adminSvc.getUsers(),
      kyc: this.adminSvc.getPendingKyc()
    }).subscribe({
      next: ({ users, kyc }) => {
        this.users = users.data ?? [];
        this.submissions = kyc.data ?? [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getUserName(userId: string): string {
    return this.users.find(u => u.userId === userId)?.fullName ?? 'Unknown User';
  }

  getUserEmail(userId: string): string {
    return this.users.find(u => u.userId === userId)?.email ?? userId;
  }

  getUserInitials(userId: string): string {
    return this.getUserName(userId).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  isImage(submissionId: string): boolean {
    return (this.documentTypes[submissionId] ?? '').startsWith('image/');
  }

  viewDocument(sub: KycSubmissionView): void {
    this.loadingDoc = sub.submissionId;
    this.adminSvc.getKycDocument(sub.submissionId).subscribe({
      next: blob => {
        this.loadingDoc = null;
        if (this.documentUrls[sub.submissionId]) {
          URL.revokeObjectURL(this.documentUrls[sub.submissionId]);
        }
        this.documentTypes[sub.submissionId] = blob.type || sub.contentType || 'application/octet-stream';
        this.documentUrls[sub.submissionId] = URL.createObjectURL(blob);
      },
      error: () => { this.loadingDoc = null; }
    });
  }

  openApprove(sub: KycSubmissionView): void { this.selected = sub; this.showApprove = true; }
  openReject(sub: KycSubmissionView): void { this.selected = sub; this.showReject = true; }

  doApprove(): void {
    this.showApprove = false;
    if (!this.selected) return;
    const id = this.selected.submissionId;
    const name = this.getUserName(this.selected.userId);
    this.adminSvc.approveKyc(id).subscribe({
      next: () => {
        this.toast.success(`KYC approved for ${name}.`);
        this.submissions = this.submissions.filter(s => s.submissionId !== id);
        this.selected = null;
      }
    });
  }

  doReject(note: string | undefined): void {
    this.showReject = false;
    if (!this.selected) return;
    const id = this.selected.submissionId;
    const name = this.getUserName(this.selected.userId);
    this.adminSvc.rejectKyc(id, { rejectionNote: note }).subscribe({
      next: () => {
        this.toast.success(`KYC rejected for ${name}.`);
        this.submissions = this.submissions.filter(s => s.submissionId !== id);
        this.selected = null;
      }
    });
  }
}
