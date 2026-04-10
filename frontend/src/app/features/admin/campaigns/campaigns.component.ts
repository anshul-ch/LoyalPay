import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';

function dateRangeValidator(group: AbstractControl) {
  const start = group.get('startDate')?.value;
  const end = group.get('endDate')?.value;
  if (start && end && end <= start) {
    return { dateRange: true };
  }
  return null;
}

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-2xl mx-auto space-y-6 page-enter">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Campaigns</h1>
        <p class="text-sm text-gray-500 mt-1">Create reward campaigns to engage users</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 class="font-semibold text-gray-900 mb-5">Create New Campaign</h2>
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Campaign Name</label>
            <input formControlName="name" type="text" placeholder="e.g. Summer Bonus 2026"
              class="input" [class.input-error]="f['name'].invalid && f['name'].touched">
            @if (f['name'].invalid && f['name'].touched) {
              <p class="text-brand-red text-xs mt-1">Name must be at least 3 characters.</p>
            }
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Description <span class="text-gray-400 font-normal">(optional)</span></label>
            <textarea formControlName="description" rows="3" placeholder="Describe the campaign goals and rewards..."
              class="input resize-none"></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Bonus Points</label>
            <div class="relative">
              <input formControlName="bonusPoints" type="number" placeholder="Enter points (1 – 100,000)"
                class="input pr-16" [class.input-error]="f['bonusPoints'].invalid && f['bonusPoints'].touched">
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">pts</span>
            </div>
            @if (f['bonusPoints'].invalid && f['bonusPoints'].touched) {
              <p class="text-brand-red text-xs mt-1">Bonus points must be between 1 and 100,000.</p>
            }
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
              <input formControlName="startDate" type="date" class="input"
                [class.input-error]="f['startDate'].invalid && f['startDate'].touched">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
              <input formControlName="endDate" type="date" class="input"
                [class.input-error]="f['endDate'].invalid && f['endDate'].touched">
            </div>
          </div>
          @if (form.errors?.['dateRange'] && form.get('endDate')?.touched) {
            <p class="text-brand-red text-xs -mt-2">End date must be after start date.</p>
          }

          <div class="pt-2">
            <button type="submit" [disabled]="form.invalid || loading"
              class="btn-primary inline-flex items-center gap-2">
              @if (loading) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Creating...
              } @else {
                Create Campaign
              }
            </button>
          </div>
        </form>
      </div>

      <!-- Success state -->
      @if (lastCreated) {
        <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <svg class="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <p class="text-sm font-semibold text-emerald-800">Campaign created successfully!</p>
            <p class="text-xs text-emerald-700 mt-0.5">
              "{{ lastCreated.name }}" · {{ lastCreated.bonusPoints | number }} bonus points ·
              {{ lastCreated.startDate | date:'dd MMM' }} – {{ lastCreated.endDate | date:'dd MMM yyyy' }}
            </p>
          </div>
        </div>
      }
    </div>
  `
})
export class CampaignsComponent {
  loading = false;
  lastCreated: any = null;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    description: [''],
    bonusPoints: [null as number | null, [Validators.required, Validators.min(1), Validators.max(100000)]],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required]
  }, { validators: dateRangeValidator });

  get f() { return this.form.controls; }

  constructor(private fb: FormBuilder, private adminSvc: AdminService, private toast: ToastService) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const v = this.form.value;
    const payload = {
      name: v.name!,
      description: v.description || undefined,
      bonusPoints: v.bonusPoints!,
      startDate: new Date(v.startDate!).toISOString(),
      endDate: new Date(v.endDate!).toISOString()
    };
    this.adminSvc.createCampaign(payload).subscribe({
      next: () => {
        this.loading = false;
        this.lastCreated = { ...v, startDate: v.startDate, endDate: v.endDate };
        this.toast.success('Campaign created successfully!');
        this.form.reset();
      },
      error: () => { this.loading = false; }
    });
  }
}
