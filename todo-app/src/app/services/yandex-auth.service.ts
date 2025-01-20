import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment.local';
import { User } from '../interfaces/user.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class YandexAuthService {
  private authUrl = 'https://oauth.yandex.ru/authorize';
  private tokenUrl = 'https://oauth.yandex.ru/token';
  private accessToken: string | null = null;
  private currentUser: User | null = null;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private clientId = environment.YANDEX_CLIENT_ID;
  private clientSecret = environment.YANDEX_CLIENT_SECRET;

  login(): void {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: 'http://localhost:4200/auth/yandex/callback',
    }).toString();

    window.location.href = `${this.authUrl}?${params}`;
  }

  exchangeCodeForToken(code: string): Observable<User | null> {
    const body = new HttpParams()
      .set('client_id', this.clientId)
      .set('client_secret', this.clientSecret)
      .set('grant_type', 'authorization_code')
      .set('code', code)
      .set('redirect_uri', 'http://localhost:4200/auth/yandex/callback');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    });

    return this.http
      .post<{
        access_token: string;
      }>(this.tokenUrl, body.toString(), { headers })
      .pipe(
        switchMap((token) => {
          this.accessToken = token.access_token;
          return this.getUserInfo(token.access_token);
        }),
        tap((user) => {
          if (user) {
            this.authService.addUser(user).subscribe();
          }
        }),
        catchError((error) => {
          console.error('Token exchange error:', error);
          return of(null);
        }),
      );
  }

  private getUserInfo(accessToken: string): Observable<User | null> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${accessToken}` });
    return this.http
      .get<{
        id: string;
        real_name: string;
        default_email: string;
      }>('https://login.yandex.ru/info', { headers })
      .pipe(
        map(
          (response) =>
            ({
              id: response.id,
              name: response.real_name,
              login: response.default_email,
            }) as User,
        ),
        catchError((error) => {
          console.error('User info fetch error:', error);
          return of(null);
        }),
      );
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}
