import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { YandexAuthService } from '../../services/yandex-auth.service';
import { tap, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-auth-callback',
  template: '<p>Идет обработка авторизации...</p>',
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private yandexAuthService: YandexAuthService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const code = params['code'];
      if (code) {
        this.exchangeCodeForToken(code);
      }
    });
  }

  exchangeCodeForToken(code: string) {
    this.yandexAuthService.exchangeCodeForToken(code).pipe(
      tap((user) => {
        if (user !== null) {
          console.log('User logged in:', user);
          this.router.navigate(['/tasks']).then(success => {
            if (success) {
              console.log('Navigation successful');
            } else {
              console.error('Navigation failed');
            }
          });
        } else {
          console.error(
            'Yandex login failed or user information is not available.',
          );
          this.router.navigate(['/login']).then(success => {
            if (success) {
              console.log('Navigation to login successful');
            } else {
              console.error('Navigation to login failed');
            }
          });
        }
      }),
      catchError((error) => {
        console.error('Yandex login error:', error);
        this.router.navigate(['/login']).then(success => {
          if (success) {
            console.log('Navigation to login successful after error');
          } else {
            console.error('Navigation to login failed after error');
          }
        });
        return of(null);
      }),
      finalize(() => {
      }),
    ).subscribe();
  }
}
