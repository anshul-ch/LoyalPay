import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WalletService } from '../../core/services/wallet.service';
import { ToastService } from '../../core/services/toast.service';

function dateRangeValidator(group: AbstractControl) {
  const from = group.get('from')?.value;
  const to = group.get('to')?.value;
  if (from && to && to < from) return { dateRange: true };
  return null;
}

@Component({
  selector: 'app-statement',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-lg mx-auto space-y-6 page-enter">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Account Statement</h1>
        <p class="text-gray-500 text-sm mt-1">Download your transaction history as PDF or CSV</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <form [formGroup]="form" class="space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">From Date</label>
              <input formControlName="from" type="date" class="input"
                [class.input-error]="form.errors?.['dateRange'] && form.get('to')?.touched">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">To Date</label>
              <input formControlName="to" type="date" class="input"
                [class.input-error]="form.errors?.['dateRange'] && form.get('to')?.touched">
            </div>
          </div>
          @if (form.errors?.['dateRange'] && form.get('to')?.touched) {
            <p class="text-brand-red text-xs -mt-2">End date must be on or after start date.</p>
          }
          @if (error) {
            <p class="text-brand-red text-xs -mt-1">{{ error }}</p>
          }

          <!-- Quick range presets -->
          <div>
            <p class="text-xs font-medium text-gray-500 mb-2">Quick Select</p>
            <div class="flex flex-wrap gap-2">
              @for (preset of presets; track preset.label) {
                <button type="button" (click)="applyPreset(preset)"
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border transition"
                  [class]="activePreset === preset.label
                    ? 'border-brand-orange bg-brand-orange-light text-brand-orange'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'">
                  {{ preset.label }}
                </button>
              }
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <button type="button" (click)="download('pdf')" [disabled]="form.invalid || loading"
              class="flex items-center justify-center gap-2 px-4 py-3 bg-brand-red text-white rounded-xl text-sm font-semibold hover:bg-brand-red-dark transition disabled:opacity-50">
              @if (loading === 'pdf') {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Generating...
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Download PDF
              }
            </button>
            <button type="button" (click)="download('csv')" [disabled]="form.invalid || loading"
              class="flex items-center justify-center gap-2 px-4 py-3 bg-brand-navy text-white rounded-xl text-sm font-semibold hover:bg-brand-navy-dark transition disabled:opacity-50">
              @if (loading === 'csv') {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Generating...
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Download CSV
              }
            </button>
          </div>
        </form>
      </div>

      <div class="bg-brand-navy-light rounded-xl p-4 flex items-start gap-3">
        <svg class="w-5 h-5 text-brand-navy flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="text-sm text-brand-navy">Statements include all wallet transactions within the selected date range.</p>
      </div>
    </div>
  `
})
export class StatementComponent {
  loading: 'pdf' | 'csv' | null = null;
  activePreset = 'Last 30 days';
  error = '';

  presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'This year', days: 365 }
  ];

  form = this.fb.group({
    from: [this.defaultFrom(30), Validators.required],
    to: [this.today(), Validators.required]
  }, { validators: dateRangeValidator });

  constructor(
    private fb: FormBuilder,
    private walletSvc: WalletService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private defaultFrom(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }

  applyPreset(preset: { label: string; days: number }): void {
    this.activePreset = preset.label;
    this.form.patchValue({ from: this.defaultFrom(preset.days), to: this.today() });
    this.error = '';
    this.cdr.markForCheck();
  }

  download(type: 'pdf' | 'csv'): void {
    if (this.form.invalid) return;
    const { from, to } = this.form.value;
    this.loading = type;
    this.error = '';
    this.cdr.markForCheck();
    const obs = type === 'pdf'
      ? this.walletSvc.getStatementPdf(from!, to!)
      : this.walletSvc.getStatementCsv(from!, to!);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: blob => {
        this.loading = null;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `loyalpay-statement-${from}-to-${to}.${type}`;
        a.click();
        URL.revokeObjectURL(url);
        this.toast.success(`Statement downloaded as ${type.toUpperCase()}`);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = null;
        this.error = 'Could not download statement. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }
}


  private readonly destroyRef = inject(DestroyRef);
