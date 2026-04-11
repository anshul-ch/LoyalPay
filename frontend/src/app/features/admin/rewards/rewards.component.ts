import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService, CreateRewardDto } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminRewardDto } from '../../../core/models/api.models';

@Component({
  selector: 'app-admin-rewards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-3xl mx-auto space-y-6 page-enter">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Rewards Catalog</h1>
        <p class="text-sm text-gray-500 mt-1">Create rewards with automatic expiry (1 to 4 months, tuned for lower point ranges)</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="font-semibold text-gray-900">All Rewards</h2>
            <p class="text-xs text-gray-500">Active and inactive rewards with expiry</p>
          </div>
          <button type="button" (click)="showCreateForm = !showCreateForm"
            class="px-3 py-2 rounded-xl bg-brand-orange text-white text-xs font-semibold hover:bg-brand-orange-dark transition">
            {{ showCreateForm ? 'Close' : 'Create Reward' }}
          </button>
        </div>

        @if (showCreateForm) {
        <div class="border border-gray-100 rounded-xl p-4 mb-4">
        <h3 class="font-semibold text-gray-900 mb-4">Create Reward</h3>
        <form [formGroup]="form" (ngSubmit)="create()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm text-gray-700 mb-1">Name</label>
            <input formControlName="name" class="input" placeholder="e.g. INR 100 Cashback" />
          </div>

          <div>
            <label class="block text-sm text-gray-700 mb-1">Type</label>
            <select formControlName="itemType" class="input">
              <option value="Cashback">Cashback</option>
              <option value="Coupon">Coupon</option>
              <option value="Voucher">Voucher</option>
            </select>
          </div>

          <div>
            <label class="block text-sm text-gray-700 mb-1">Points Cost</label>
            <input formControlName="pointsCost" type="number" class="input" placeholder="e.g. 500" />
          </div>

          <div>
            <label class="block text-sm text-gray-700 mb-1">Stock (-1 unlimited)</label>
            <input formControlName="stock" type="number" class="input" placeholder="-1" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm text-gray-700 mb-1">Description</label>
            <textarea formControlName="description" class="input resize-none" rows="2"></textarea>
          </div>

          <div class="md:col-span-2">
            <button type="submit" [disabled]="form.invalid || loading" class="btn-primary">Create Reward</button>
          </div>
        </form>
        </div>
        }

        <div class="space-y-2 max-h-[520px] overflow-auto">
          @for (r of rewards; track r.itemId) {
            <div class="border border-gray-100 rounded-xl p-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-gray-900 truncate">{{ r.name }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ r.itemType }} | {{ r.pointsCost }} pts | Stock {{ r.stock }}</p>
                  <p class="text-xs mt-1" [class]="isRewardExpired(r) ? 'text-red-600' : 'text-gray-600'">
                    Expires: {{ r.expiresAt ? (r.expiresAt | date:'dd MMM yyyy') : '-' }}
                  </p>
                </div>
                <div class="text-right flex-shrink-0">
                  <span class="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    [class]="r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'">
                    {{ r.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>

              <div class="mt-3 flex items-center gap-2">
                <button type="button" (click)="toggleDetails(r.itemId)"
                  class="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                  {{ expandedRewardId === r.itemId ? 'Hide details' : 'Show details' }}
                </button>

                <button type="button"
                  (click)="toggleReward(r)"
                  [disabled]="togglingRewardId === r.itemId"
                  class="px-2.5 py-1.5 text-xs border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  [class]="r.isActive ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'">
                  {{ togglingRewardId === r.itemId ? 'Updating...' : (r.isActive ? 'Deactivate' : 'Activate') }}
                </button>

                <button type="button"
                  (click)="removeReward(r)"
                  [disabled]="deletingRewardId === r.itemId"
                  class="px-2.5 py-1.5 text-xs border border-red-200 rounded-lg text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ deletingRewardId === r.itemId ? 'Removing...' : 'Remove' }}
                </button>
              </div>

              @if (expandedRewardId === r.itemId) {
                <div class="mt-3 bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-700 space-y-1">
                  <p><span class="font-semibold">Reward ID:</span> {{ r.itemId }}</p>
                  <p><span class="font-semibold">Description:</span> {{ r.description || '-' }}</p>
                  <p><span class="font-semibold">Created:</span> {{ r.createdAt ? (r.createdAt | date:'dd MMM yyyy, hh:mm a') : '-' }}</p>
                  <p><span class="font-semibold">Expires:</span> {{ r.expiresAt ? (r.expiresAt | date:'dd MMM yyyy, hh:mm a') : '-' }}</p>
                </div>
              }
            </div>
          } @empty {
            <p class="text-sm text-gray-500">No rewards found.</p>
          }
        </div>
      </div>
    </div>
  `
})
export class RewardsAdminComponent {
  loading = false;
  rewards: AdminRewardDto[] = [];
  showCreateForm = false;
  expandedRewardId: string | null = null;
  togglingRewardId: string | null = null;
  deletingRewardId: string | null = null;
  private readonly destroyRef = inject(DestroyRef);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    itemType: ['Coupon', Validators.required],
    pointsCost: [500, [Validators.required, Validators.min(50), Validators.max(20000)]],
    stock: [-1, Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private adminSvc: AdminService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.loadRewards();
  }

  loadRewards(): void {
    this.adminSvc.getRewards().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.rewards = res.data ?? [];
        this.cdr.markForCheck();
      }
    });
  }

  isRewardExpired(r: AdminRewardDto): boolean {
    if (!r.expiresAt) return false;
    return new Date(r.expiresAt) <= new Date();
  }

  toggleDetails(rewardId: string): void {
    this.expandedRewardId = this.expandedRewardId === rewardId ? null : rewardId;
  }

  toggleReward(r: AdminRewardDto): void {
    this.togglingRewardId = r.itemId;
    const req$ = r.isActive
      ? this.adminSvc.deactivateReward(r.itemId)
      : this.adminSvc.activateReward(r.itemId);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.togglingRewardId = null;
        if (!res.success) {
          this.toast.error(res.message || 'Unable to update reward status.');
          this.cdr.markForCheck();
          return;
        }
        this.toast.success(res.message || 'Reward status updated.');
        this.loadRewards();
      },
      error: () => {
        this.togglingRewardId = null;
        this.toast.error('Unable to update reward status.');
        this.cdr.markForCheck();
      }
    });
  }

  removeReward(r: AdminRewardDto): void {
    this.deletingRewardId = r.itemId;
    this.adminSvc.removeReward(r.itemId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.deletingRewardId = null;
        if (!res.success) {
          this.toast.error(res.message || 'Unable to remove reward.');
          this.cdr.markForCheck();
          return;
        }
        this.toast.success('Reward removed successfully.');
        this.loadRewards();
      },
      error: () => {
        this.deletingRewardId = null;
        this.toast.error('Unable to remove reward.');
        this.cdr.markForCheck();
      }
    });
  }

  create(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const v = this.form.value;
    const dto: CreateRewardDto = {
      name: v.name!,
      description: v.description || undefined,
      itemType: v.itemType as any,
      pointsCost: v.pointsCost!,
      stock: v.stock!
    };

    this.adminSvc.createReward(dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.loading = false;
        if (!res.success) {
          this.toast.error(res.message || 'Unable to create reward.');
          this.cdr.markForCheck();
          return;
        }
        this.toast.success('Reward created successfully.');
        this.form.reset({ itemType: 'Coupon', pointsCost: 500, stock: -1, name: '', description: '' });
        this.loadRewards();
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Unable to create reward.');
        this.cdr.markForCheck();
      }
    });
  }
}
