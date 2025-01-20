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
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ButtonComponent } from '../button/button.component';
import { TodoService, Task } from '../../services/todo.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { v4 as uuidv4 } from 'uuid';
import { Subscription, lastValueFrom } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { User } from '../../interfaces/user.interface';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-todo-create-item',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    ButtonComponent,
    TranslateModule,
  ],
  templateUrl: './todo-create-item.component.html',
  styleUrls: ['./todo-create-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoCreateItemComponent implements OnInit, OnDestroy {
  @Output() taskCreated = new EventEmitter<Task>();
  public addTaskForm: FormGroup;
  public addButtonTitle: string = '';
  public newTaskPlaceholder: string = '';
  public taskDescriptionPlaceholder: string = '';
  public users: User[] = [];
  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private todoService: TodoService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.addTaskForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      status: ['backlogTitle', Validators.required],
      estimate: [0, Validators.required],
      assignee: ['', Validators.required],
      reporter: ['', Validators.required],
      labels: [''],
      sprint: [''],
      priority: ['Low', Validators.required],
    });
    this.toastService = toastService;
  }

  async ngOnInit(): Promise<void> {
    await this.setTranslations();
    this.loadUsers();
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

  private loadUsers(): void {
    const usersSubscription = this.authService.getUsers().pipe(
      tap((users) => {
        this.users = users;
        this.cdr.markForCheck();
      }),
      catchError((err) => {
        console.error('Failed to load users:', err);
        return [];
      })
    ).subscribe();

    this.subscriptions.add(usersSubscription);
  }

  public onSubmit(): void {
    if (this.addTaskForm.valid) {
      const newTask: Task = {
        id: uuidv4(),
        name: this.addTaskForm.value.name.trim(),
        description: this.addTaskForm.value.description.trim(),
        status: this.addTaskForm.value.status,
        estimate: this.addTaskForm.value.estimate,
        assignee: this.addTaskForm.value.assignee,
        reporter: this.addTaskForm.value.reporter,
        labels: this.addTaskForm.value.labels
          .split(',')
          .map((label: string) => label.trim()),
        sprint: this.addTaskForm.value.sprint,
        priority: this.addTaskForm.value.priority,
      };
      const addTaskSubscription = this.todoService
        .addTask(newTask)
        .pipe(
          tap({
            next: (addedTask) => {
              this.taskCreated.emit(addedTask);
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
