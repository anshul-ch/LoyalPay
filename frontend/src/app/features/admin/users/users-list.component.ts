import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { UserView } from '../../../core/models/api.models';
import { ToastService } from '../../../core/services/toast.service';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyInrPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-5 page-enter">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Users</h1>
          <p class="text-sm text-gray-500 mt-1">Manage all registered users</p>
        </div>
        @if (!loading) {
          <span class="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1.5 rounded-lg">
            {{ filtered.length }} of {{ users.length }} users
          </span>
        }
      </div>

      <!-- Search & filter bar -->
      @if (!loading && users.length > 0) {
        <div class="flex flex-wrap gap-3">
          <div class="relative flex-1 min-w-48">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input [(ngModel)]="search" (ngModelChange)="applyFilter()"
              type="text" placeholder="Search by name or email..."
              class="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange bg-white">
          </div>
          <select [(ngModel)]="kycFilter" (ngModelChange)="applyFilter()"
            class="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange bg-white">
            <option value="">All KYC</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
            <option value="NotSubmitted">Not Submitted</option>
          </select>
          <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()"
            class="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange bg-white">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      }

      <!-- Loading skeleton -->
      @if (loading) {
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="divide-y divide-gray-50">
            @for (i of [1,2,3,4,5,6]; track i) {
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

      <!-- Desktop table -->
      @if (!loading) {
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hidden lg:block">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC</th>
                  <th class="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance / Points</th>
                  <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
                  <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @for (user of filtered; track user.userId) {
                  <tr class="hover:bg-gray-50/70 transition">
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
                    <td class="px-6 py-4 text-gray-700 font-medium text-sm">{{ user.phone || '—' }}</td>
                    <td class="px-6 py-4">
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        [class]="user.role === 'Admin' ? 'bg-brand-yellow-light text-brand-yellow-dark' : 'bg-brand-navy-light text-brand-navy'">
                        {{ user.role }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <button type="button"
                        [disabled]="updatingUserId === user.userId"
                        (click)="toggleStatus(user)"
                        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50"
                        [class]="user.isActive ? 'bg-emerald-500' : 'bg-gray-300'"
                        [attr.aria-label]="user.isActive ? 'Deactivate user' : 'Activate user'">
                        <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                          [class]="user.isActive ? 'translate-x-6' : 'translate-x-1'"></span>
                      </button>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold" [class]="kycClass(user.kycStatus)">
                        {{ user.kycStatus || 'Not Submitted' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <p class="font-bold text-gray-900">{{ user.balance || 0 | currencyInr }}</p>
                      <p class="text-xs font-medium text-brand-orange mt-0.5">{{ user.points || 0 }} pts</p>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-1.5 font-bold text-xs"
                        [ngClass]="{'text-slate-400': user.tier === 'Silver', 'text-amber-500': user.tier === 'Gold', 'text-gray-800': user.tier === 'Platinum'}">
                        @if (user.tier === 'Platinum') { <span>✨</span> }
                        @if (user.tier === 'Gold') { <span>⭐</span> }
                        {{ user.tier || 'Silver' }}
                      </div>
                    </td>
                    <td class="px-6 py-4 text-gray-500 text-xs">{{ user.createdAt | date:'dd MMM yyyy' }}</td>
                  </tr>
                }
                @empty {
                  <tr>
                    <td colspan="6" class="text-center py-12">
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
          @for (user of filtered; track user.userId) {
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
                <span class="text-gray-800 font-medium">{{ user.phone || '—' }}</span>
                <span class="text-gray-400">Joined</span>
                <span class="text-gray-800 font-medium">{{ user.createdAt | date:'dd MMM yyyy' }}</span>
                <span class="text-gray-400">Balance</span>
                <span class="text-gray-800 font-bold">{{ user.balance || 0 | currencyInr }}</span>
                <span class="text-gray-400">Points & Tier</span>
                <span class="text-gray-800 font-medium">{{ user.points || 0 }} pts <span class="px-1.5 py-0.5 rounded text-[10px] ml-1 bg-gray-100">{{ user.tier || 'Silver' }}</span></span>
                <span class="text-gray-400">Role</span>
                <span class="text-gray-800 font-medium">{{ user.role }}</span>
                <span class="text-gray-400">Active</span>
                <button type="button"
                  [disabled]="updatingUserId === user.userId"
                  (click)="toggleStatus(user)"
                  class="justify-self-start relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 disabled:opacity-50"
                  [class]="user.isActive ? 'bg-emerald-500' : 'bg-gray-300'">
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                    [class]="user.isActive ? 'translate-x-6' : 'translate-x-1'"></span>
                </button>
              </div>
            </article>
          }
          @empty {
            <div class="bg-white rounded-xl p-8 text-center border border-gray-100">
              <p class="text-sm text-gray-400">No users match your filters.</p>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class UsersListComponent implements OnInit {
  users: UserView[] = [];
  filtered: UserView[] = [];
  loading = true;
  updatingUserId: string | null = null;
  search = '';
  kycFilter = '';
  statusFilter = '';

  constructor(
    private adminSvc: AdminService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.adminSvc.getUsers().subscribe({
      next: r => {
        this.users = r.data ?? [];
        this.filtered = [...this.users];
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

  applyFilter(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.users.filter(u => {
      const matchSearch = !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchKyc = !this.kycFilter || (u.kycStatus || 'NotSubmitted') === this.kycFilter;
      const matchStatus = !this.statusFilter ||
        (this.statusFilter === 'active' ? u.isActive : !u.isActive);
      return matchSearch && matchKyc && matchStatus;
    });
    this.cdr.markForCheck();
  }

  toggleStatus(user: UserView): void {
    if (this.updatingUserId) return;
    const prev = user.isActive;
    user.isActive = !prev;
    this.updatingUserId = user.userId;
    this.cdr.markForCheck();

    this.adminSvc.updateUserStatus(user.userId, user.isActive).subscribe({
      next: res => {
        this.toast.success(res.message ?? `User ${user.isActive ? 'activated' : 'deactivated'}.`);
        this.updatingUserId = null;
        this.cdr.markForCheck();
      },
      error: () => {
        user.isActive = prev;
        this.updatingUserId = null;
        this.toast.error('Failed to update user status.');
        this.cdr.markForCheck();
      }
    });
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
