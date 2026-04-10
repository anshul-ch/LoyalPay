import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    @keyframes progress {
      0%   { transform: translateX(-100%); }
      50%  { transform: translateX(0%); }
      100% { transform: translateX(100%); }
    }
    .progress-bar { animation: progress 1.4s ease-in-out infinite; }
  `],
  template: `
    @if (visible) {
      <div class="fixed top-0 left-0 right-0 z-[200] h-0.5 bg-brand-orange/20 overflow-hidden">
        <div class="h-full w-1/2 bg-brand-orange progress-bar"></div>
      </div>
    }
  `
})
export class SpinnerComponent implements OnInit, OnDestroy {
  visible = false;
  private timer: any;
  private sub!: Subscription;

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.sub = this.loadingService.loading$.subscribe(loading => {
      if (loading) {
        // Only show after 300ms to avoid flashing on fast requests
        this.timer = setTimeout(() => this.visible = true, 300);
      } else {
        clearTimeout(this.timer);
        this.visible = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    clearTimeout(this.timer);
  }
}
