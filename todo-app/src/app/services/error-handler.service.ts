import { Injectable } from '@angular/core';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  constructor(private toastService: ToastService) {}

  handleError(error: any): void {
    console.error('An error occurred:', error);
    this.toastService.showError('An error occurred. Please try again.');
  }
}
