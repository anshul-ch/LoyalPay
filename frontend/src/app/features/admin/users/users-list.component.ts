﻿import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { UserView } from '../../../core/models/api.models';
import { ToastService } from '../../../core/services/toast.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-5 page-enter">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Users</h1>
          <p class="text-sm text-gray-500 mt-1">Manage all registered users</p>
        </div>
        @if (!loading) {
          <span class="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1.5 rounded-lg">
            {{ totalCount }} total users
          </span>
        }
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3">
        <div class="relative flex-1 min-w-48">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input [(ngModel)]="search" (ngModelChange)="onSearchChange($event)"
            type="text" placeholder="Search by name or email..."
            class="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange bg-white">
        </div>
        <select [(ngModel)]="kycFilter" (ngModelChange)="onFilterChange()"
          class="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange bg-white">
          <option value="">All KYC</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
          <option value="NotSubmitted">Not Submitted</option>
        </select>
        <select [(ngModel)]="tierFilter" (ngModelChange)="onFilterChange()"
          class="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange bg-white">
          <option value="">All Tiers</option>
          <option value="Silver">Silver</option>
          <option value="Gold">Gold</option>
          <option value="Platinum">Platinum</option>
        </select>
        <select [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()"
          class="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange bg-white">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <!-- Loading skeleton -->
      @if (loading) {
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="divide-y divide-gray-50">
            @for (i of skeletonRows; track i) {
              <div class="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div class="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0"></div>
                <div class="flex-1 space-y-1.5">
                  <div class="h-3 w-36 bg-gray-100 rounded"></div>
                  <div class="h-2.5 w-48 bg-gray-100 rounded"></div>
                </div>
                <div class="h-5 w-16 bg-gray-100 rounded-full"></div>
                <div class="h-7 w-14 bg-gray-100 rounded-full"></div>
              </div>
            }
          </div>
        </div>
      }

      @if (!loading) {
        @if (statusDialogUser) {
          <div class="fixed inset-0 z-[950] bg-black/45" (click)="cancelDeactivate()"></div>
          <div class="fixed inset-0 z-[951] flex items-center justify-center p-4">
            <div class="w-full max-w-lg rounded-2xl bg-white border border-gray-100 shadow-2xl p-6">
              <h3 class="text-lg font-bold text-gray-900">Deactivate user</h3>
              <p class="text-sm text-gray-500 mt-1">
                Add a reason for deactivating <span class="font-semibold text-gray-700">{{ statusDialogUser.fullName }}</span>.
              </p>

              <div class="mt-4 space-y-2">
                <label class="text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  [(ngModel)]="statusReason"
                  rows="3"
                  maxlength="500"
                  placeholder="Example: Suspicious activity, policy violation, manual verification pending"
                  class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange resize-none"></textarea>
                <p class="text-xs text-gray-400">{{ statusReason.length }}/500</p>
              </div>

              <div class="mt-5 flex justify-end gap-2">
                <button type="button" (click)="cancelDeactivate()" class="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="button" (click)="confirmDeactivate()" class="px-4 py-2 text-sm bg-brand-red text-white rounded-xl hover:bg-brand-red-dark">
                  Confirm Deactivate
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Desktop table -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hidden lg:block">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                  <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC</th>
                  <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
                  <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @for (user of users; track user.userId; let i = $index) {
                  <tr class="hover:bg-gray-50/70 transition-colors">
                    <td class="px-6 py-4 text-xs text-gray-400 font-medium tabular-nums">
                      {{ (currentPage - 1) * PAGE_SIZE + i + 1 }}
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                          [class]="user.role === 'Admin' ? 'bg-brand-yellow-light text-brand-yellow-dark' : 'bg-brand-navy-light text-brand-navy'">
                          {{ initials(user.fullName) }}
                        </div>
                        <div>
                          <p class="font-semibold text-gray-900">{{ user.fullName }}</p>
                          <p class="text-gray-500 text-xs">{{ user.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-gray-700 font-medium">{{ user.phone || '-' }}</td>
                    <td class="px-6 py-4">
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        [class]="user.role === 'Admin' ? 'bg-brand-yellow-light text-brand-yellow-dark' : 'bg-brand-navy-light text-brand-navy'">
                        {{ user.role }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <button type="button" (click)="toggleStatus(user)"
                          [disabled]="updatingUserId === user.userId"
                          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50"
                          [class]="user.isActive ? 'bg-emerald-500' : 'bg-gray-300'"
                          [attr.aria-label]="user.isActive ? 'Deactivate user' : 'Activate user'">
                          <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                            [class]="user.isActive ? 'translate-x-6' : 'translate-x-1'"></span>
                        </button>
                        <span class="text-xs font-medium" [class]="user.isActive ? 'text-emerald-600' : 'text-red-600'">
                          {{ user.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </div>
                      @if (!user.isActive && user.inactiveReason) {
                        <p class="text-[11px] text-red-600 mt-1 max-w-[220px] truncate" [title]="user.inactiveReason">{{ user.inactiveReason }}</p>
                      }
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold" [class]="kycClass(user.kycStatus)">
                        {{ user.kycStatus || 'Not Submitted' }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span class="font-semibold text-xs"
                        [ngClass]="{
                          'text-slate-400': (user.tier || 'Silver') === 'Silver',
                          'text-amber-500': user.tier === 'Gold',
                          'text-cyan-700': user.tier === 'Platinum'
                        }">
                        {{ tierIcon(user.tier) }} {{ user.tier || 'Silver' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-gray-500 text-xs">{{ user.createdAt | date:'dd MMM yyyy' }}</td>
                  </tr>
                }
                @empty {
                  <tr>
                    <td colspan="8" class="text-center py-16">
                      <svg class="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      <p class="text-sm text-gray-400">No users match your filters.</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Mobile cards -->
        <div class="space-y-3 lg:hidden">
          @for (user of users; track user.userId) {
            <article class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    [class]="user.role === 'Admin' ? 'bg-brand-yellow-light text-brand-yellow-dark' : 'bg-brand-navy-light text-brand-navy'">
                    {{ initials(user.fullName) }}
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900 text-sm">{{ user.fullName }}</p>
                    <p class="text-xs text-gray-500">{{ user.email }}</p>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0" [class]="kycClass(user.kycStatus)">
                  {{ user.kycStatus || 'Not Submitted' }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-gray-50 pt-3">
                <span class="text-gray-400">Phone</span>
                <span class="text-gray-800 font-medium">{{ user.phone || '-' }}</span>
                <span class="text-gray-400">Joined</span>
                <span class="text-gray-800 font-medium">{{ user.createdAt | date:'dd MMM yyyy' }}</span>
                <span class="text-gray-400">Tier</span>
                <span class="font-semibold text-xs"
                  [ngClass]="{
                    'text-slate-400': (user.tier || 'Silver') === 'Silver',
                    'text-amber-500': user.tier === 'Gold',
                    'text-cyan-700': user.tier === 'Platinum'
                  }">
                  {{ tierIcon(user.tier) }} {{ user.tier || 'Silver' }}
                </span>
                <span class="text-gray-400">Role</span>
                <span class="text-gray-800 font-medium">{{ user.role }}</span>
                <span class="text-gray-400">Active</span>
                <div class="space-y-1">
                  <button type="button" (click)="toggleStatus(user)"
                    [disabled]="updatingUserId === user.userId"
                    class="justify-self-start relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 disabled:opacity-50"
                    [class]="user.isActive ? 'bg-emerald-500' : 'bg-gray-300'">
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                      [class]="user.isActive ? 'translate-x-6' : 'translate-x-1'"></span>
                  </button>
                  <p class="text-[11px] font-medium" [class]="user.isActive ? 'text-emerald-600' : 'text-red-600'">{{ user.isActive ? 'Active' : 'Inactive' }}</p>
                  @if (!user.isActive && user.inactiveReason) {
                    <p class="text-[11px] text-red-600 max-w-[220px]">{{ user.inactiveReason }}</p>
                  }
                </div>
              </div>
            </article>
          }
          @empty {
            <div class="bg-white rounded-xl p-8 text-center border border-gray-100">
              <p class="text-sm text-gray-400">No users match your filters.</p>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages > 1) {
          <div class="flex items-center justify-between gap-4 flex-wrap bg-white border border-gray-100 rounded-2xl px-5 py-3.5 shadow-sm">
            <p class="text-sm text-gray-500">
              Showing
              <span class="font-semibold text-gray-800">{{ (currentPage - 1) * PAGE_SIZE + 1 }}</span>-<span class="font-semibold text-gray-800">{{ min(currentPage * PAGE_SIZE, totalCount) }}</span>
              of <span class="font-semibold text-gray-800">{{ totalCount }}</span> users
            </p>
            <div class="flex items-center gap-1">
              <button type="button" (click)="goTo(1)" [disabled]="currentPage === 1"
                class="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition" title="First">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
              </button>
              <button type="button" (click)="goTo(currentPage - 1)" [disabled]="currentPage === 1"
                class="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition" title="Previous">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              @for (p of pageNumbers; track p) {
                @if (p === -1) {
                  <span class="w-8 text-center text-sm text-gray-400 select-none">...</span>
                } @else {
                  <button type="button" (click)="goTo(p)"
                    class="min-w-[34px] h-[34px] px-2 text-sm font-medium rounded-lg border transition-all"
                    [class]="p === currentPage
                      ? 'bg-brand-orange border-brand-orange text-white shadow-sm shadow-brand-orange/25'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'">
                    {{ p }}
                  </button>
                }
              }
              <button type="button" (click)="goTo(currentPage + 1)" [disabled]="currentPage === totalPages"
                class="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition" title="Next">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
              <button type="button" (click)="goTo(totalPages)" [disabled]="currentPage === totalPages"
                class="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition" title="Last">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class UsersListComponent implements OnInit {
  readonly PAGE_SIZE = PAGE_SIZE;
  readonly skeletonRows = Array(PAGE_SIZE).fill(0);

  users: UserView[] = [];
  loading = true;
  updatingUserId: string | null = null;
  statusDialogUser: UserView | null = null;
  statusReason = '';

  search = '';
  kycFilter = '';
  tierFilter = '';
  statusFilter = '';

  currentPage = 1;
  totalPages = 1;
  totalCount = 0;

  private searchSubject = new Subject<string>();

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (cur > 3) pages.push(-1);
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p);
    if (cur < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private adminSvc: AdminService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Debounce search input so it only fires after typing pauses.
    this.searchSubject.pipe(debounceTime(350), distinctUntilChanged()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.currentPage = 1;
      this.fetchPage();
    });
    this.fetchPage();
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.fetchPage();
  }

  goTo(p: number): void {
    if (p < 1 || p > this.totalPages || p === this.currentPage) return;
    this.currentPage = p;
    this.fetchPage();
  }

  private fetchPage(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.adminSvc.getUsers(this.currentPage, PAGE_SIZE, this.search, this.kycFilter, this.tierFilter, this.statusFilter)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: res => {
          const data = res.data!;
          this.users = data.items;
          this.totalCount = data.totalCount;
          this.totalPages = data.totalPages;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.toast.error('Could not load users. Please refresh.');
          this.cdr.markForCheck();
        }
      });
  }

  toggleStatus(user: UserView): void {
    if (this.updatingUserId) return;

    if (user.isActive) {
      this.statusDialogUser = user;
      this.statusReason = '';
      this.cdr.markForCheck();
      return;
    }

    this.applyStatusChange(user, true, undefined);
  }

  confirmDeactivate(): void {
    if (!this.statusDialogUser) return;

    const reason = this.statusReason.trim();
    if (!reason) {
      this.toast.error('Please provide a reason before deactivating a user.');
      return;
    }

    const user = this.statusDialogUser;
    this.statusDialogUser = null;
    this.applyStatusChange(user, false, reason);
  }

  cancelDeactivate(): void {
    this.statusDialogUser = null;
    this.statusReason = '';
    this.cdr.markForCheck();
  }

  private applyStatusChange(user: UserView, isActive: boolean, reason?: string): void {
    const prev = user.isActive;
    const prevReason = user.inactiveReason;
    user.isActive = isActive;
    user.inactiveReason = isActive ? undefined : reason;
    this.updatingUserId = user.userId;
    this.cdr.markForCheck();

    this.adminSvc.updateUserStatus(user.userId, { isActive, reason }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        if (!res.success) {
          user.isActive = prev;
          user.inactiveReason = prevReason;
          this.toast.error(res.message || 'Failed to update user status.');
          this.updatingUserId = null;
          this.cdr.markForCheck();
          return;
        }

        this.toast.success(res.message ?? `User ${user.isActive ? 'activated' : 'deactivated'}.`);
        this.updatingUserId = null;
        this.cdr.markForCheck();
      },
      error: () => {
        user.isActive = prev;
        user.inactiveReason = prevReason;
        this.updatingUserId = null;
        this.toast.error('Failed to update user status.');
        this.cdr.markForCheck();
      }
    });
  }

  min(a: number, b: number): number { return Math.min(a, b); }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  tierIcon(tier: string | undefined): string {
    if (tier === 'Platinum') return 'P';
    if (tier === 'Gold') return 'G';
    return 'S';
  }

  kycClass(status: string): string {
    const map: Record<string, string> = {
      Approved: 'bg-emerald-100 text-emerald-700',
      Pending: 'bg-amber-100 text-amber-700',
      Rejected: 'bg-red-100 text-red-600'
    };
    return map[status] ?? 'bg-gray-100 text-gray-500';
  }
}





