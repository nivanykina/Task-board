import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [CommonModule, LanguageSwitcherComponent],
})
export class HeaderComponent {
  constructor(private router: Router) {}

  logout(): void {
    this.router.navigate(['/login']).catch((err) => {
      console.error('Navigation error:', err);
    });
  }
}
