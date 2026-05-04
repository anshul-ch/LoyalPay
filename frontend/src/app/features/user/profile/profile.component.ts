import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfileService } from '../../../core/services/profile.service';
import { PinService } from '../../../core/services/pin.service';
import { KycService } from '../../../core/services/kyc.service';
import { PinPadComponent } from '../../../shared/pin-pad/pin-pad.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, PinPadComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private pinService = inject(PinService);
  private kycService = inject(KycService);
  private fb = inject(FormBuilder);

  profile: any = {};
  pinStatus = false;
  editFullName = '';
  editPhone = '';
  profileMessage = '';
  profileError = '';
  currentPassword = '';
  newPassword = '';
  passwordMessage = '';
  passwordError = '';
  pinMessage = '';
  pinError = '';

  // PIN pad state
  showPinPad = false;
  pinStep: 'new' | 'confirm' = 'new';
  firstPin = '';
  pinPadTitle = 'Set Transaction PIN';
  pinPadSubtitle = 'Enter a new 5-digit PIN';

  // KYC state
  kycStatus: any = null;
  isLoadingKyc = true;
  isSubmittingKyc = false;
  kycErrorMessage = '';
  kycSuccessMessage = '';
  selectedFile: File | null = null;
  selectedFileBase64: string = '';

  kycForm: FormGroup = this.fb.group({
    documentType: ['', Validators.required],
    documentNumber: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(100)]]
  });

  ngOnInit() {
    this.loadProfile();
    this.loadKycStatus();
  }

  loadProfile() {
    this.profileService.getProfile().subscribe({
      next: res => {
        this.profile = res.data || {};
        this.editFullName = this.profile.fullName || '';
        this.editPhone = this.profile.phone || '';
        this.pinStatus = this.profile.hasPin || false;
        if (this.profile.mustResetPin && !this.pinMessage && !this.pinError) {
          this.pinMessage = 'Your PIN has been reset. Please set a new one.';
        }
      },
      error: () => {}
    });
  }

  loadKycStatus() {
    this.isLoadingKyc = true;
    this.kycService.getStatus().subscribe({
      next: (res) => {
        this.kycStatus = res.data;
        this.isLoadingKyc = false;
      },
      error: () => {
        this.kycStatus = null;
        this.isLoadingKyc = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 8000000) {
      this.kycErrorMessage = 'File is too large. Maximum size is 8MB.';
      return;
    }
    this.selectedFile = file;
    this.kycErrorMessage = '';
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => { this.selectedFileBase64 = reader.result as string; };
    reader.onerror = () => { this.kycErrorMessage = 'Failed to read file.'; };
  }

  submitKyc() {
    if (this.kycForm.invalid || !this.selectedFileBase64) return;
    this.isSubmittingKyc = true;
    this.kycErrorMessage = '';
    this.kycSuccessMessage = '';

    const payload = {
      documentType: this.kycForm.value.documentType,
      documentNumber: this.kycForm.value.documentNumber,
      fileBase64: this.selectedFileBase64
    };

    this.kycService.submitKyc(payload)
      .pipe(finalize(() => this.isSubmittingKyc = false))
      .subscribe({
        next: () => {
          this.kycSuccessMessage = 'Documents submitted successfully. We will review them within 1-2 business days.';
          this.kycForm.reset();
          this.selectedFile = null;
          this.selectedFileBase64 = '';
          this.loadKycStatus();
        },
        error: (err) => {
          this.kycErrorMessage = err?.error?.message || 'Failed to submit KYC. Please try again.';
        }
      });
  }

  checkPinStatus() {
    this.loadProfile();
  }

  updateProfile() {
    this.profileMessage = '';
    this.profileError = '';
    if (!this.editFullName.trim()) {
      this.profileError = 'Full name is required.';
      return;
    }
    if (!/^\d{10}$/.test(this.editPhone)) {
      this.profileError = 'Please enter a valid 10-digit phone number.';
      return;
    }
    this.profileService.updateProfile({ fullName: this.editFullName.trim(), phone: this.editPhone }).subscribe({
      next: res => {
        this.profile = res.data || this.profile;
        this.profileMessage = 'Profile updated successfully.';
      },
      error: err => this.profileError = err.error?.message || 'Failed to update profile. Please try again.'
    });
  }

  changePassword() {
    this.passwordMessage = '';
    this.passwordError = '';
    if (!this.currentPassword) {
      this.passwordError = 'Please enter your current password.';
      return;
    }
    if (!this.newPassword || this.newPassword.length < 8) {
      this.passwordError = 'New password must be at least 8 characters.';
      return;
    }
    this.profileService.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.passwordMessage = 'Password changed successfully.';
        this.currentPassword = '';
        this.newPassword = '';
      },
      error: err => this.passwordError = err.error?.message || 'Failed to change password. Please check your current password.'
    });
  }

  openSetPin() {
    this.pinMessage = '';
    this.pinError = '';
    this.firstPin = '';
    this.pinStep = 'new';
    this.pinPadTitle = 'Set Transaction PIN';
    this.pinPadSubtitle = 'Enter a new 5-digit PIN';
    this.showPinPad = true;
  }

  onPinConfirmed(pin: string) {
    if (this.pinStep === 'new') {
      this.firstPin = pin;
      this.pinStep = 'confirm';
      this.pinPadTitle = 'Confirm PIN';
      this.pinPadSubtitle = 'Re-enter your PIN to confirm';
      return;
    }
    this.showPinPad = false;
    if (pin !== this.firstPin) {
      this.pinError = 'PINs do not match. Please try again.';
      this.firstPin = '';
      this.pinStep = 'new';
      return;
    }
    this.pinService.setPin({ pin }).subscribe({
      next: () => {
        this.pinMessage = 'Transaction PIN set successfully.';
        this.firstPin = '';
        this.pinStep = 'new';
        this.checkPinStatus();
      },
      error: err => {
        this.pinError = err.error?.message || 'Failed to set PIN. Please try again.';
        this.firstPin = '';
        this.pinStep = 'new';
      }
    });
  }

  onPinCancelled() {
    this.showPinPad = false;
    this.firstPin = '';
    this.pinStep = 'new';
  }
}
