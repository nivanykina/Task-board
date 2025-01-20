import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private loaderSubject = new BehaviorSubject<boolean>(false);
  loaderState$ = this.loaderSubject.asObservable();

  showLoader(): void {
    console.log('showLoader called');
    this.loaderSubject.next(true);
  }

  hideLoader(): void {
    console.log('hideLoader called');
    this.loaderSubject.next(false);
  }
}
