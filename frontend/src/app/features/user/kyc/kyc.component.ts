import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { KycService } from '../../../core/services/kyc.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-kyc',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './kyc.component.html',
  styleUrl: './kyc.component.css'
})
export class KycComponent implements OnInit {
  private fb = inject(FormBuilder);
  private kycService = inject(KycService);

  kycStatus: any = null;
  isLoadingStatus = true;
  isSubmitting = false;
  errorMessage = '';

  kycForm: FormGroup = this.fb.group({
    documentType: ['', Validators.required],
    documentNumber: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(100)]]
  });

  selectedFile: File | null = null;
  selectedFileBase64: string = '';

  ngOnInit() {
    this.checkStatus();
  }

  checkStatus() {
    this.isLoadingStatus = true;
    this.kycService.getStatus().subscribe({
      next: (res) => {
        this.kycStatus = res.data;
        this.isLoadingStatus = false;
      },
      error: () => {
        this.kycStatus = null;
        this.isLoadingStatus = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 8000000) {
        this.errorMessage = 'File payload is too large. Maximum size is 8MB.';
        return;
      }
      this.selectedFile = file;
      this.errorMessage = '';

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.selectedFileBase64 = reader.result as string;
      };
      reader.onerror = () => {
        this.errorMessage = 'Failed to read file.';
      };
    }
  }

  onSubmit() {
    if (this.kycForm.invalid || !this.selectedFileBase64) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = {
      documentType: this.kycForm.value.documentType,
      documentNumber: this.kycForm.value.documentNumber,
      fileBase64: this.selectedFileBase64
    };

    this.kycService.submitKyc(payload)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => {
          this.checkStatus(); // Refresh status to show "Pending" state
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to submit KYC. Please try again.';
        }
      });
  }
}
