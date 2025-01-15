import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<string[]>([]);
  public toasts$: Observable<string[]> = this.toastsSubject.asObservable();

  showToast(message: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, message]);
    setTimeout(() => {
      this.removeToast(0);
    }, 3000);
  }

  showSuccess(message: string): void {
    this.showToast(`Success: ${message}`);
  }

  showError(message: string): void {
    this.showToast(`Error: ${message}`);
  }

  removeToast(index: number): void {
    const currentToasts = this.toastsSubject.value;
    currentToasts.splice(index, 1);
    this.toastsSubject.next([...currentToasts]);
  }
}
