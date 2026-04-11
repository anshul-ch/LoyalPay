import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-2xl mx-auto space-y-6 page-enter">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Campaigns</h1>
        <p class="text-sm text-gray-500 mt-1">Create reward campaigns to engage users</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="font-semibold text-gray-900">All Campaigns</h2>
            <p class="text-xs text-gray-500">Active and past campaigns from database</p>
          </div>
          <button type="button" (click)="showCreateForm = !showCreateForm"
            class="px-3 py-2 rounded-xl bg-brand-orange text-white text-xs font-semibold hover:bg-brand-orange-dark transition">
            {{ showCreateForm ? 'Close' : 'Create Campaign' }}
          </button>
        </div>

        @if (showCreateForm) {
        <div class="border border-gray-100 rounded-xl p-4 mb-4">
          <h3 class="font-semibold text-gray-900 mb-4">Create New Campaign</h3>
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
              <input formControlName="bonusPoints" type="number" placeholder="Enter points (1 - 100,000)"
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
          @if (error) {
            <p class="text-brand-red text-xs -mt-2">{{ error }}</p>
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
        }

        @if (campaignsLoading) {
          <div class="space-y-2">
            @for (i of [1,2,3]; track i) {
              <div class="h-14 bg-gray-50 rounded-xl animate-pulse"></div>
            }
          </div>
        } @else {
          <div class="space-y-2 max-h-[520px] overflow-auto pr-1">
            @for (c of campaigns; track c.campaignId || c.name + c.startDate) {
              <div class="border border-gray-100 rounded-xl p-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-900 truncate">{{ c.name }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">
                      {{ c.startDate | date:'dd MMM yyyy' }} - {{ c.endDate | date:'dd MMM yyyy' }}
                    </p>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <p class="text-xs font-semibold text-gray-700">+{{ c.bonusPoints | number }} pts</p>
                    <span class="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      [class]="isCampaignActive(c) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'">
                      {{ isCampaignActive(c) ? 'Active' : 'Past' }}
                    </span>
                  </div>
                </div>

                <div class="mt-3 flex items-center gap-2">
                  <button type="button" (click)="toggleDetails(c.campaignId)"
                    class="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                    {{ expandedCampaignId === c.campaignId ? 'Hide details' : 'Show details' }}
                  </button>

                  <button type="button"
                    (click)="toggleCampaign(c)"
                    [disabled]="togglingCampaignId === c.campaignId"
                    class="px-2.5 py-1.5 text-xs border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    [class]="c.isActive ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'">
                    {{ togglingCampaignId === c.campaignId ? 'Updating...' : (c.isActive ? 'Deactivate' : 'Activate') }}
                  </button>

                  <button type="button"
                    (click)="removeActive(c)"
                    [disabled]="deletingCampaignId === c.campaignId"
                    class="px-2.5 py-1.5 text-xs border border-red-200 rounded-lg text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ deletingCampaignId === c.campaignId ? 'Removing...' : 'Remove' }}
                  </button>
                </div>

                @if (expandedCampaignId === c.campaignId) {
                  <div class="mt-3 bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-700 space-y-1">
                    <p><span class="font-semibold">Campaign ID:</span> {{ c.campaignId }}</p>
                    <p><span class="font-semibold">Description:</span> {{ c.description || '-' }}</p>
                    <p><span class="font-semibold">Created:</span> {{ c.createdAt ? (c.createdAt | date:'dd MMM yyyy, hh:mm a') : '-' }}</p>
                    <p><span class="font-semibold">Is Active Flag:</span> {{ c.isActive ? 'true' : 'false' }}</p>
                  </div>
                }
              </div>
            } @empty {
              <p class="text-sm text-gray-500">No campaigns found.</p>
            }
          </div>
        }
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
              "{{ lastCreated.name }}" - {{ lastCreated.bonusPoints | number }} bonus points -
              {{ lastCreated.startDate | date:'dd MMM' }} - {{ lastCreated.endDate | date:'dd MMM yyyy' }}
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
  error = '';
  campaigns: any[] = [];
  campaignsLoading = false;
  showCreateForm = false;
  expandedCampaignId: string | null = null;
  togglingCampaignId: string | null = null;
  deletingCampaignId: string | null = null;
  private readonly destroyRef = inject(DestroyRef);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    description: [''],
    bonusPoints: [null as number | null, [Validators.required, Validators.min(1), Validators.max(100000)]],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required]
  }, { validators: dateRangeValidator });

  get f() { return this.form.controls; }

  constructor(
    private fb: FormBuilder,
    private adminSvc: AdminService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.loadCampaigns();
  }

  private loadCampaigns(): void {
    this.campaignsLoading = true;
    this.adminSvc.getCampaigns().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.campaigns = res.data ?? [];
        this.campaignsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.campaignsLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  isCampaignActive(c: any): boolean {
    if (!c?.isActive) return false;
    if (!c?.startDate || !c?.endDate) return false;

    const now = new Date();
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);
    return start <= now && end >= now;
  }

  toggleDetails(campaignId: string): void {
    this.expandedCampaignId = this.expandedCampaignId === campaignId ? null : campaignId;
  }

  toggleCampaign(c: any): void {
    if (!c?.campaignId) return;

    this.togglingCampaignId = c.campaignId;
    const request$ = c.isActive
      ? this.adminSvc.deactivateCampaign(c.campaignId)
      : this.adminSvc.activateCampaign(c.campaignId);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.togglingCampaignId = null;
        if (!res.success) {
          this.toast.error(res.message || 'Unable to update campaign status.');
          this.cdr.markForCheck();
          return;
        }

        this.toast.success(res.message || 'Campaign status updated.');
        this.loadCampaigns();
      },
      error: () => {
        this.togglingCampaignId = null;
        this.toast.error('Unable to update campaign status.');
        this.cdr.markForCheck();
      }
    });
  }

  removeActive(c: any): void {
    if (!c?.campaignId) return;

    this.deletingCampaignId = c.campaignId;
    this.adminSvc.removeCampaign(c.campaignId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.deletingCampaignId = null;
        if (!res.success) {
          this.toast.error(res.message || 'Unable to remove campaign.');
          this.cdr.markForCheck();
          return;
        }

        this.toast.success('Campaign removed successfully.');
        this.loadCampaigns();
      },
      error: () => {
        this.deletingCampaignId = null;
        this.toast.error('Unable to remove campaign.');
        this.cdr.markForCheck();
      }
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const v = this.form.value;
    const payload = {
      name: v.name!,
      description: v.description || undefined,
      bonusPoints: v.bonusPoints!,
      startDate: new Date(v.startDate!).toISOString(),
      endDate: new Date(v.endDate!).toISOString()
    };
    this.adminSvc.createCampaign(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading = false;
        this.lastCreated = { ...v, startDate: v.startDate, endDate: v.endDate };
        this.toast.success('Campaign created successfully!');
        this.form.reset();
        this.loadCampaigns();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Unable to create campaign.';
        this.cdr.markForCheck();
      }
    });
  }
}
