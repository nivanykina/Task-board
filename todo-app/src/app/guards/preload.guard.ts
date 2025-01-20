import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';

@Injectable({
  providedIn: 'root',
})
export class PreloadGuard implements CanActivate {
  constructor(private loaderService: LoaderService) {}

  canActivate(): Observable<boolean> {
    this.loaderService.showLoader();

    return of(true).pipe(
      tap(() => {
        setTimeout(() => {
          this.loaderService.hideLoader();
        }, 1000);
      }),
    );
  }
}
