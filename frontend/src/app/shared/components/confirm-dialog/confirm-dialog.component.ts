import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        (click)="cancel()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto"
          (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="px-6 pt-6 pb-4">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                [class]="iconBgClass">
                <svg class="w-5 h-5" [class]="iconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  @if (isDestructive) {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  } @else {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  }
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-base font-semibold text-gray-900">{{ title }}</h3>
                <p class="text-sm text-gray-500 mt-1">{{ message }}</p>
              </div>
            </div>
          </div>

          @if (showNote) {
            <div class="px-6 pb-4">
              <textarea
                [(ngModel)]="note"
                rows="3"
                placeholder="Add a note (optional)..."
                class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange resize-none"
              ></textarea>
            </div>
          }

          <!-- Actions -->
          <div class="px-6 pb-6 flex gap-3 justify-end">
            <button (click)="cancel()"
              class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
              Cancel
            </button>
            <button (click)="confirm()"
              class="px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition"
              [class]="confirmClass">
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmDialogComponent {
  @Input() visible = false;
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmLabel = 'Confirm';
  @Input() confirmClass = 'bg-brand-orange hover:bg-brand-orange-dark';
  @Input() showNote = false;

  @Output() confirmed = new EventEmitter<string | undefined>();
  @Output() cancelled = new EventEmitter<void>();

  note = '';

  get isDestructive(): boolean {
    return this.confirmClass.includes('red') || this.confirmClass.includes('danger');
  }

  get iconBgClass(): string {
    return this.isDestructive ? 'bg-red-100' : 'bg-brand-orange-light';
  }

  get iconClass(): string {
    return this.isDestructive ? 'text-brand-red' : 'text-brand-orange';
  }

  confirm(): void {
    this.confirmed.emit(this.showNote ? this.note : undefined);
    this.note = '';
  }

  cancel(): void {
    this.cancelled.emit();
    this.note = '';
  }
}
