import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { Toast } from '../../../core/models/api.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    @keyframes snack-in {
      from { transform: translateY(100%) translateX(-50%); opacity: 0; }
      to   { transform: translateY(0)    translateX(-50%); opacity: 1; }
    }
    @keyframes snack-out {
      from { transform: translateY(0)    translateX(-50%); opacity: 1; }
      to   { transform: translateY(100%) translateX(-50%); opacity: 0; }
    }
    .snack-enter { animation: snack-in  0.28s cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .snack-leave { animation: snack-out 0.22s ease-in forwards; }
  `],
  template: `
    @if (current) {
      <div
        role="status"
        aria-live="polite"
        class="fixed bottom-6 left-1/2 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium max-w-[420px] w-max"
        [class]="containerClass + ' ' + (leaving ? 'snack-leave' : 'snack-enter')"
      >
        <!-- Icon -->
        <span class="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full"
          [class]="iconBgClass">
          @if (current.type === 'success') {
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
            </svg>
          } @else if (current.type === 'error') {
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          } @else {
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        </span>

        <!-- Message -->
        <span class="flex-1 leading-snug">{{ current.message }}</span>

        <!-- Progress bar -->
        <div class="absolute bottom-0 left-0 h-[3px] rounded-b-2xl transition-all ease-linear"
          [class]="progressClass"
          [style.width.%]="progress"
          [style.transition-duration]="'50ms'">
        </div>

        <!-- Dismiss -->
        <button (click)="dismiss()"
          class="flex-shrink-0 opacity-60 hover:opacity-100 transition ml-1"
          aria-label="Dismiss">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    }
  `
})
export class ToastComponent implements OnInit, OnDestroy {
  current: Toast | null = null;
  leaving = false;
  progress = 100;

  private queue: Toast[] = [];
  private sub!: Subscription;
  private progressInterval?: ReturnType<typeof setInterval>;
  private dismissTimeout?: ReturnType<typeof setTimeout>;
  private readonly DURATION = 3800;
  private readonly TICK = 50;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.sub = this.toastService.toasts$.subscribe(toasts => {
      this.queue = [...toasts];
      if (!this.current && this.queue.length > 0) {
        this.showNext();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    clearInterval(this.progressInterval);
    clearTimeout(this.dismissTimeout);
  }

  private showNext(): void {
    if (this.queue.length === 0) return;
    this.current = this.queue[0];
    this.leaving = false;
    this.progress = 100;

    // Progress bar countdown
    const steps = this.DURATION / this.TICK;
    const decrement = 100 / steps;
    this.progressInterval = setInterval(() => {
      this.progress = Math.max(0, this.progress - decrement);
    }, this.TICK);

    // Auto-dismiss
    this.dismissTimeout = setTimeout(() => this.dismiss(), this.DURATION);
  }

  dismiss(): void {
    if (!this.current) return;
    clearInterval(this.progressInterval);
    clearTimeout(this.dismissTimeout);
    this.leaving = true;

    // Wait for leave animation then show next
    setTimeout(() => {
      this.toastService.remove(this.current!.id);
      this.current = null;
      this.leaving = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.showNext(), 80);
      }
    }, 220);
  }

  get containerClass(): string {
    const map: Record<Toast['type'], string> = {
      success: 'bg-gray-900 text-white',
      error:   'bg-gray-900 text-white',
      info:    'bg-gray-900 text-white'
    };
    return map[this.current?.type ?? 'info'];
  }

  get iconBgClass(): string {
    const map: Record<Toast['type'], string> = {
      success: 'bg-emerald-500 text-white',
      error:   'bg-red-500 text-white',
      info:    'bg-blue-500 text-white'
    };
    return map[this.current?.type ?? 'info'];
  }

  get progressClass(): string {
    const map: Record<Toast['type'], string> = {
      success: 'bg-emerald-500',
      error:   'bg-red-500',
      info:    'bg-blue-500'
    };
    return map[this.current?.type ?? 'info'];
  }
}
