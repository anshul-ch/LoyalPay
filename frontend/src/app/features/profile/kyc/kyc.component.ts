import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProfileService } from '../../../core/services/profile.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-kyc',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive],
  template: `
    <div class="max-w-2xl mx-auto space-y-6 page-enter">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">My Profile</h1>
        <p class="text-sm text-gray-500 mt-1">Manage your personal information</p>
      </div>

      <!-- Profile nav tabs -->
      <div class="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <a routerLink="/profile" routerLinkActive="bg-white shadow-sm text-gray-900"
          [routerLinkActiveOptions]="{exact:true}"
          class="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 transition">
          Profile
        </a>
        <a routerLink="/profile/change-password" routerLinkActive="bg-white shadow-sm text-gray-900"
          class="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 transition">
          Password
        </a>
        <a routerLink="/profile/kyc" routerLinkActive="bg-white shadow-sm text-gray-900"
          class="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 transition">
          KYC
        </a>
      </div>

      <!-- KYC Status Banner -->
      @if (kycStatus && normalizedStatus !== 'NotSubmitted') {
        <div class="rounded-xl p-4 border flex items-start gap-3" [class]="statusCardClass">
          <span class="text-2xl flex-shrink-0">{{ statusIcon }}</span>
          <div>
            <p class="font-semibold text-sm">KYC Status: {{ normalizedStatus }}</p>
            @if (kycStatus.documentType) {
              <p class="text-sm mt-0.5 opacity-80">{{ kycStatus.documentType }} | {{ kycStatus.documentNumber }}</p>
            }
            @if (kycStatus.rejectionNote) {
              <p class="text-sm mt-1 font-medium">Reason: {{ kycStatus.rejectionNote }}</p>
            }
            @if (kycStatus.reviewedAt) {
              <p class="text-xs mt-1 opacity-60">Reviewed on {{ kycStatus.reviewedAt | date:'dd MMM yyyy' }}</p>
            }
          </div>
        </div>
      }

      <!-- Approved state -->
      @if (normalizedStatus === 'Approved') {
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <p class="font-semibold text-gray-900">Identity Verified</p>
          <p class="text-sm text-gray-500 mt-1">Your KYC has been approved. You have full access to all features.</p>
        </div>
      }

      <!-- Pending state -->
      @if (normalizedStatus === 'Pending') {
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p class="font-semibold text-gray-900">Under Review</p>
          <p class="text-sm text-gray-500 mt-1">Your documents are being reviewed. This usually takes 1-2 business days.</p>
        </div>
      }

      <!-- Submit form (no KYC or rejected) -->
      @if (!kycStatus || normalizedStatus === 'Rejected' || normalizedStatus === 'NotSubmitted') {
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 class="font-semibold text-gray-900 mb-1">Submit KYC Document</h2>
          <p class="text-sm text-gray-500 mb-5">Upload a government-issued ID for identity verification</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Document Type</label>
              <select formControlName="documentType" class="input"
                [class.input-error]="form.get('documentType')!.invalid && form.get('documentType')!.touched">
                <option value="">Select document type</option>
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="Passport">Passport</option>
                <option value="DrivingLicense">Driving License</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Document Number</label>
              <input formControlName="documentNumber" type="text" placeholder="Enter document number"
                class="input" [class.input-error]="form.get('documentNumber')!.invalid && form.get('documentNumber')!.touched">
              @if (form.get('documentNumber')!.invalid && form.get('documentNumber')!.touched) {
                <p class="text-brand-red text-xs mt-1">Document number must be at least 4 characters.</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Upload Document</label>
              <div class="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand-orange/50 transition cursor-pointer"
                (click)="fileInput.click()">
                @if (fileName) {
                  <div class="flex items-center justify-center gap-2 text-emerald-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="text-sm font-medium">{{ fileName }}</span>
                  </div>
                  <button type="button" (click)="clearFile($event)" class="text-xs text-gray-400 hover:text-brand-red mt-1 block mx-auto">
                    Remove file
                  </button>
                } @else {
                  <svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  <p class="text-sm text-gray-500">Click to upload or drag and drop</p>
                  <p class="text-xs text-gray-400 mt-1">JPG, PNG, PDF up to 5MB</p>
                }
              </div>
              <input #fileInput type="file" accept="image/*,application/pdf" (change)="onFile($event)" class="hidden">
              @if (fileError) {
                <p class="text-brand-red text-xs mt-1">{{ fileError }}</p>
              }
            </div>

            <button type="submit" [disabled]="form.invalid || !fileBase64 || loading"
              class="btn-primary w-full justify-center inline-flex items-center gap-2">
              @if (loading) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Submitting...
              } @else {
                Submit for Review
              }
            </button>
          </form>
        </div>
      }
    </div>
  `
})
export class KycComponent implements OnInit {
  loading = false;
  fileBase64 = '';
  fileName = '';
  fileError = '';
  kycStatus: any = null;

  form = this.fb.group({
    documentType: ['', Validators.required],
    documentNumber: ['', [Validators.required, Validators.minLength(4)]]
  });

  get normalizedStatus(): string {
    const rawValue = this.kycStatus?.status
      ?? this.kycStatus?.Status
      ?? this.kycStatus?.kycStatus
      ?? this.kycStatus?.KycStatus
      ?? '';

    const raw = rawValue.toString().trim().toLowerCase();
    if (raw === 'approved') return 'Approved';
    if (raw === 'pending') return 'Pending';
    if (raw === 'rejected') return 'Rejected';
    return 'NotSubmitted';
  }

  get statusCardClass(): string {
    const map: Record<string, string> = {
      Approved: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      Pending: 'bg-amber-50 border-amber-200 text-amber-800',
      Rejected: 'bg-red-50 border-red-200 text-red-800'
    };
    return map[this.normalizedStatus] ?? 'bg-gray-50 border-gray-200';
  }

  get statusIcon(): string {
    const map: Record<string, string> = { Approved: 'OK', Pending: '...', Rejected: 'X' };
    return map[this.normalizedStatus] ?? 'DOC';
  }

  constructor(
    private fb: FormBuilder,
    private profileSvc: ProfileService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.profileSvc.getKycStatus(true).subscribe({
      next: r => {
        this.kycStatus = r.data ?? null;
        this.cdr.markForCheck();

        if (this.normalizedStatus === 'NotSubmitted') {
          this.profileSvc.getProfile().subscribe({
            next: p => {
              const profileStatus = (p.data as any)?.kycStatus ?? (p.data as any)?.KycStatus;
              if (profileStatus) {
                this.kycStatus = {
                  ...(this.kycStatus ?? {}),
                  status: profileStatus
                };
                this.cdr.markForCheck();
              }
            }
          });
        }
      },
      error: () => {
        this.kycStatus = { status: 'NotSubmitted' };
        this.cdr.markForCheck();
      }
    });
  }

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.fileError = '';
    this.fileBase64 = '';
    this.fileName = '';
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      this.fileError = 'Only images (JPG, PNG) and PDF files are allowed.';
      return;
    }
    if (file.size > 5_000_000) {
      this.fileError = 'File size must not exceed 5 MB.';
      return;
    }

    this.fileName = file.name;
    const reader = new FileReader();
    reader.onload = () => { this.fileBase64 = reader.result as string; };
    reader.readAsDataURL(file);
  }

  clearFile(event: Event): void {
    event.stopPropagation();
    this.fileBase64 = '';
    this.fileName = '';
    this.fileError = '';
  }

  submit(): void {
    if (this.form.invalid || !this.fileBase64) return;
    this.loading = true;
    this.profileSvc.submitKyc({
      documentType: this.form.value.documentType as any,
      documentNumber: this.form.value.documentNumber!,
      fileBase64: this.fileBase64
    }).subscribe({
      next: () => {
        this.loading = false;
        this.kycStatus = {
          status: 'Pending',
          documentType: this.form.value.documentType ?? undefined,
          documentNumber: this.form.value.documentNumber ?? undefined
        };
        this.profileSvc.invalidateKycStatusCache();
        this.fileBase64 = '';
        this.fileName = '';
        this.toast.success('KYC submitted! Pending review.');
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}


