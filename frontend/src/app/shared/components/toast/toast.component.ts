import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { Toast } from '../../../core/models/api.models';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      @for (toast of toasts; track toast.id) {
        <div
          class="flex items-start gap-3 p-4 rounded-xl shadow-lg text-white text-sm pointer-events-auto animate-[slideIn_0.2s_ease-out]"
          [class]="getClass(toast.type)"
        >
          <span class="flex-shrink-0 mt-0.5">
            @if (toast.type === 'success') {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
            } @else if (toast.type === 'error') {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            } @else {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            }
          </span>
          <span class="flex-1 leading-snug">{{ toast.message }}</span>
          <button
            (click)="dismiss(toast.id)"
            class="text-white/70 hover:text-white ml-1 flex-shrink-0 transition"
            aria-label="Dismiss">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toasts$.subscribe(t => this.toasts = t);
  }

  dismiss(id: string): void {
    this.toastService.remove(id);
  }

  getClass(type: Toast['type']): string {
    const map: Record<Toast['type'], string> = {
      success: 'bg-emerald-600',
      error: 'bg-brand-red',
      info: 'bg-brand-navy'
    };
    return map[type];
  }
}
