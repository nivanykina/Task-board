import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../interfaces/user.interface';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { YandexAuthService } from '../../services/yandex-auth.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-user-selection',
  templateUrl: './user-selection.component.html',
  styleUrls: ['./user-selection.component.css'],
  imports: [CommonModule, TranslateModule],
})
export class UserSelectionComponent implements OnInit, OnDestroy {
  users: User[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private yandexAuthService: YandexAuthService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.authService
      .getUsers()
      .pipe(
        takeUntil(this.destroy$),
        tap((users) => (this.users = users)),
      )
      .subscribe({
        error: (err) => console.error('Error fetching users:', err),
      });

    this.route.queryParams.subscribe((params) => {
      const code = params['code'];
      if (code) {
        this.exchangeCodeForToken(code);
      }
    });
  }

  selectUser(user: User) {
    this.authService
      .login(user.login, 'mockPassword')
      .pipe(
        takeUntil(this.destroy$),
        tap((isAuthenticated) => {
          if (isAuthenticated) {
            this.router.navigate(['/backlog']);
          } else {
            console.error('Login failed');
          }
        }),
      )
      .subscribe({
        error: (err) => console.error('Login error:', err),
      });
  }

  navigateTo(action: string) {
    this.router
      .navigate([`/user-management/${action}`])
      .then(() => console.log('Navigation successful!'))
      .catch((error) => console.error('Navigation error:', error));
  }

  loginWithYandex() {
    this.yandexAuthService.login();
  }

  exchangeCodeForToken(code: string) {
    this.yandexAuthService
      .exchangeCodeForToken(code)
      .pipe(
        takeUntil(this.destroy$),
        tap((user) => {
          if (user !== null) {
            this.users.push(user);
            this.selectUser(user);
          } else {
            console.error(
              'Yandex login failed or user information is not available.',
            );
          }
        }),
      )
      .subscribe({
        error: (err: any) => console.error('Yandex login error:', err),
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
