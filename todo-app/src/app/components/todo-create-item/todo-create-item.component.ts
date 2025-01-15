import {
  Component,
  EventEmitter,
  Output,
  OnDestroy,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ButtonComponent } from '../button/button.component';
import { TodoService, Task } from '../../services/todo.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { v4 as uuidv4 } from 'uuid';
import { TaskCreate } from './task-create.interface';
import { Subscription, lastValueFrom } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-todo-create-item',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    ButtonComponent,
    TranslateModule,
  ],
  templateUrl: './todo-create-item.component.html',
  styleUrls: ['./todo-create-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoCreateItemComponent implements OnInit, OnDestroy {
  @Output() taskCreated = new EventEmitter<TaskCreate>();
  public addTaskForm: FormGroup;
  public addButtonTitle: string = '';
  public newTaskPlaceholder: string = '';
  public taskDescriptionPlaceholder: string = '';
  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private todoService: TodoService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {
    this.addTaskForm = this.fb.group({
      newTask: ['', Validators.required],
      newDescription: ['', Validators.required],
    });
  }

  async ngOnInit(): Promise<void> {
    await this.setTranslations();
    this.subscriptions.add(
      this.translate.onLangChange
        .pipe(
          tap(() => this.setTranslations()),
          catchError((err) => {
            console.error('Error during language change', err);
            return [];
          }),
        )
        .subscribe(),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private async setTranslations(): Promise<void> {
    try {
      this.addButtonTitle = await lastValueFrom(
        this.translate.get('addButtonTitle'),
      );
      this.newTaskPlaceholder = await lastValueFrom(
        this.translate.get('newTaskPlaceholder'),
      );
      this.taskDescriptionPlaceholder = await lastValueFrom(
        this.translate.get('taskDescriptionPlaceholder'),
      );
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error during translations', error);
    }
  }

  public onSubmit(): void {
    if (this.addTaskForm.valid) {
      const newTask: Task = {
        id: uuidv4(),
        text: this.addTaskForm.value.newTask.trim(),
        description: this.addTaskForm.value.newDescription.trim(),
        status: undefined,
      };
      const addTaskSubscription = this.todoService
        .addTask(newTask)
        .pipe(
          tap({
            next: (addedTask) => {
              this.taskCreated.emit({
                text: addedTask.text,
                description: addedTask.description,
              });
              this.addTaskForm.reset();
              this.cdr.markForCheck();
            },
            error: (err) => {
              this.errorHandler.handleError(err);
            },
          }),
        )
        .subscribe();

      this.subscriptions.add(addTaskSubscription);
    }
  }
}
