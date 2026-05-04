import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RewardsService } from '../../../core/services/rewards.service';

@Component({
  selector: 'app-rewards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rewards.component.html',
  styleUrl: './rewards.component.css'
})
export class RewardsComponent implements OnInit {
  private rewardsService = inject(RewardsService);

  summary: any = null;
  catalog: any[] = [];
  history: any[] = [];
  showAllHistory = false;

  isLoading = true;
  message = '';
  error = '';

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.message = '';
    this.error = '';

    forkJoin({
      summary: this.rewardsService.getSummary().pipe(catchError(() => of({ data: null }))),
      catalog: this.rewardsService.getCatalog().pipe(catchError(() => of({ data: [] }))),
      history: this.rewardsService.getHistory().pipe(catchError(() => of({ data: [] })))
    }).subscribe({
      next: result => {
        this.summary = result.summary.data ?? null;
        this.catalog = result.catalog.data ?? [];
        this.history = result.history.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load rewards data. Please try again.';
        this.isLoading = false;
      }
    });
  }

  redeem(itemId: string) {
    this.message = '';
    this.error = '';
    this.rewardsService.redeem({ itemId }).subscribe({
      next: (res) => {
        this.message = res.message || res.data || 'Reward redeemed successfully.';
        this.loadData();
      },
      error: (err) => this.error = err.error?.message || 'Failed to redeem reward. Please try again.'
    });
  }
}
