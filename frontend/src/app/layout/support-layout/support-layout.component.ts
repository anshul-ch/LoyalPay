import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-support-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './support-layout.component.html',
  styleUrl: './support-layout.component.css'
})
export class SupportLayoutComponent {
  private authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }
}
