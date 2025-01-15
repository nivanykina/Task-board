import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EditStateService {
  private isEditingSubject = new BehaviorSubject<boolean>(false);
  public isEditing$ = this.isEditingSubject.asObservable();

  setEditingState(isEditing: boolean): void {
    this.isEditingSubject.next(isEditing);
  }
}
