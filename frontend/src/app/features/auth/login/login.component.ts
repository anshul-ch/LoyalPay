import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private ticketService = inject(TicketService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showReviewForm = false;
  reviewEmail = '';
  reviewDescription = '';
  reviewCategory = 'AccountAccess';
  reviewReasonType = 'Account review request';
  reviewMessage = '';
  reviewError = '';
  isSubmittingReview = false;

  reviewCategories: Record<string, string[]> = {
    AccountAccess: ['Account review request'],
    Other: ['General review', 'Help needed']
  };

  ngOnInit() {
    const notice = this.authService.consumeNoticeMessage();
    if (notice) {
      this.errorMessage = notice;
      this.showReviewForm = /deactivated/i.test(notice);
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        const role = this.authService.getRole();
        if (role === 'Admin') this.router.navigate(['/admin/dashboard']);
        else if (role === 'Support') this.router.navigate(['/support/dashboard']);
        else this.router.navigate(['/user/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || err?.message || 'Invalid email or password. Please try again.';
        this.showReviewForm = /deactivated/i.test(this.errorMessage);
        if (this.showReviewForm && !this.reviewEmail) {
          this.reviewEmail = this.loginForm.value.email || '';
        }
      }
    });
  }

  isDeactivationError(): boolean {
    return /deactivated/i.test(this.errorMessage || '');
  }

  reviewOptions() {
    return this.reviewCategories[this.reviewCategory] || this.reviewCategories['Other'];
  }

  openReviewForm() {
    this.showReviewForm = true;
    this.reviewError = '';
    this.reviewMessage = '';
    this.reviewEmail = this.loginForm.value.email || this.reviewEmail || '';
  }

  submitReviewTicket() {
    this.reviewError = '';
    this.reviewMessage = '';

    if (!this.reviewEmail.trim()) {
      this.reviewError = 'Email is required.';
      return;
    }
    if (!this.reviewDescription.trim()) {
      this.reviewError = 'Ticket description is required.';
      return;
    }
    if (this.isSubmittingReview) return;

    this.isSubmittingReview = true;
    this.ticketService.createPublicReviewTicket({
      email: this.reviewEmail.trim(),
      category: this.reviewCategory,
      reasonType: this.reviewReasonType,
      description: this.reviewDescription.trim()
    }).subscribe({
      next: (res) => {
        this.isSubmittingReview = false;
        if (res.success === false) {
          this.reviewError = res.message || 'Failed to submit ticket.';
          return;
        }
        this.reviewMessage = res.message || 'Support ticket submitted successfully.';
        this.reviewDescription = '';
      },
      error: (err) => {
        this.isSubmittingReview = false;
        this.reviewError = err?.error?.message || 'Failed to submit ticket.';
      }
    });
  }
}
