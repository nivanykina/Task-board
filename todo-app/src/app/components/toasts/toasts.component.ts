import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toasts.component.html',
  styleUrls: ['./toasts.component.css'],
})
export class ToastsComponent implements OnInit, OnDestroy {
  public toasts: string[] = [];
  private toastSubscription!: Subscription;
  private successMessages = ['успешно создана', 'Задача отмечена как завершенная!', 'Задача отмечена как незавершенная!', 'Задача успешно обновлена!'];
  private errorMessages = ['Произошла ошибка', 'успешно удалена'];

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.subscribeToToasts();
  }

  ngOnDestroy(): void {
    if (this.toastSubscription) {
      this.toastSubscription.unsubscribe();
    }
  }

  private subscribeToToasts(): void {
    this.toastSubscription = this.toastService.toasts$
      .pipe(
        tap({
          next: (toasts: string[]) => {
            this.toasts = toasts;
          },
          error: (error) => {
            console.error('Ошибка при получении уведомлений:', error);
          },
        }),
      )
      .subscribe();
  }

  public removeToast(index: number): void {
    this.toastService.removeToast(index);
    this.toasts.splice(index, 1);
  }

  public getToastClass(toast: string): string {
    let toastClass = '';
    if (this.successMessages.some((msg) => toast.includes(msg))) {
      toastClass = 'toast-success';
    } else if (this.errorMessages.some((msg) => toast.includes(msg))) {
      toastClass = 'toast-error';
    }
    return toastClass;
  }

}
