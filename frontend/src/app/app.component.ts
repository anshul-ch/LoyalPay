import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, SpinnerComponent],
  template: `
    <router-outlet></router-outlet>
    <app-toast></app-toast>
    <app-spinner></app-spinner>
  `
})
export class AppComponent {}
