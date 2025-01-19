import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, switchMap, tap } from 'rxjs/operators';
import { TodoService, Task } from '../../services/todo.service';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/user.interface';
import { ToastService } from '../../services/toast.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';
import { TaskState } from '../../store/reducers/task.reducer';
import { EditStateService } from '../../services/edit-state.service';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationService } from '../../services/translation.service';

export interface TranslatedTask {
  id: string;
  name: string;
  description: string;
  status: string;
  estimate: number;
  assignee: string;
  reporter: string;
  labels: string[];
  sprint: string;
  priority: string;
}

@Component({
  standalone: true,
  selector: 'app-to-do-item-view',
  templateUrl: './app-to-do-item-view.component.html',
  styleUrls: ['./app-to-do-item-view.component.css'],
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ButtonComponent,
    TranslateModule,
  ],
})
export class AppToDoItemViewComponent implements OnInit, OnDestroy {
  @Input() task: Task = {
    id: '',
    name: '',
    description: '',
    status: 'backlogTitle',
    estimate: 0,
    assignee: '',
    reporter: '',
    labels: [],
    sprint: '',
    priority: 'Low',
  };
  public editTaskForm: FormGroup;
  public isEditing: boolean = false;
  public editTaskPlaceholder: string = '';
  public editDescriptionPlaceholder: string = '';
  private destroy$ = new Subject<void>();
  private langChangeSubscription: Subscription | null = null;
  public users: User[] = [];
  private initialTask: Task = {
    id: '',
    name: '',
    description: '',
    status: 'backlogTitle',
    estimate: 0,
    assignee: '',
    reporter: '',
    labels: [],
    sprint: '',
    priority: 'Low',
  };

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private store: Store<{ tasks: TaskState }>,
    private todoService: TodoService,
    private userService: UserService,
    private toastService: ToastService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private editStateService: EditStateService,
    private translationService: TranslationService,
  ) {
    this.editTaskForm = this.fb.group({
      editTask: ['', Validators.required],
      editDescription: ['', Validators.required],
      editStatus: [''],
      editEstimate: [''],
      editAssignee: [''],
      editReporter: [''],
      editLabels: [[]],
      editSprint: [''],
      editPriority: [''],
    });

    const defaultLang = 'ru';
    this.translationService.switchLanguage(defaultLang);

    this.userService.getUsers().subscribe((users) => {
      this.users = users;
    });

    this.editTaskForm.valueChanges.subscribe(() => {
      this.editTaskForm.markAsDirty();
    });
  }

  async ngOnInit(): Promise<void> {
    await this.setTranslations();
    this.subscribeToRouteParams();
    this.subscribeToEditState();
    this.langChangeSubscription = this.translationService.currentLang$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async () => {
        await this.setTranslations();
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.langChangeSubscription) {
      this.langChangeSubscription.unsubscribe();
    }
  }

  private async setTranslations(): Promise<void> {
    try {
      const translations = await Promise.all([
        this.translationService.translateKeyAsync('editTaskPlaceholder'),
        this.translationService.translateKeyAsync('editDescriptionPlaceholder'),
      ]);
      this.editTaskPlaceholder = translations[0];
      this.editDescriptionPlaceholder = translations[1];
      this.cdr.detectChanges();
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }


  private async translateTaskProperties(task: Task): Promise<TranslatedTask> {
    const statusKey = `TASK.STATUS_${this.getStatusKey(task.status)}`;
    const translatedStatus = await this.translationService.translateKeyAsync(statusKey);
    return {
      ...task,
      status: translatedStatus,
      priority: await this.translationService.translateKeyAsync(`TASK.PRIORITY_${task.priority.toUpperCase()}`),
    };
  }

  private getStatusKey(status: string): string {
    switch (status) {
      case 'backlogTitle':
        return 'BACKLOG';
      case 'inProgressTitle':
        return 'IN_PROGRESS';
      case 'completedTitle':
        return 'COMPLETED';
      default:
        return 'BACKLOG';
    }
  }

  private revertStatusKey(translatedStatus: string): 'backlogTitle' | 'inProgressTitle' | 'completedTitle' {
    switch (translatedStatus) {
      case 'TASK.STATUS_COMPLETED':
      case 'Завершено':
        return 'completedTitle';
      case 'TASK.STATUS_IN_PROGRESS':
      case 'В процессе':
        return 'inProgressTitle';
      case 'TASK.STATUS_BACKLOG':
      case 'Отложенные':
        return 'backlogTitle';
      default:
        return 'backlogTitle';
    }
  }

  private revertPriorityKey(translatedPriority: string): 'Low' | 'Medium' | 'High' {
    switch (translatedPriority) {
      case 'Высокий':
        return 'High';
      case 'Средний':
        return 'Medium';
      case 'Низкий':
        return 'Low';
      default:
        return 'Low';
    }
  }

  private subscribeToRouteParams(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const taskId = params.get('id');
      if (taskId) {
        this.loadTask(taskId);
      }
    });
  }

  private loadTask(taskId: string): void {
    this.todoService.getTaskById(taskId).pipe(
      takeUntil(this.destroy$),
      switchMap((task) => this.translateTaskProperties(task)),
      tap((translatedTask: TranslatedTask) => {
        const task: Task = {
          ...translatedTask,
          status: this.revertStatusKey(translatedTask.status),
          priority: this.revertPriorityKey(translatedTask.priority),
        };
        this.task = task;
        this.initialTask = { ...task };
        this.editTaskForm.patchValue({
          editTask: this.task.name,
          editDescription: this.task.description,
          editStatus: this.task.status,
          editEstimate: this.task.estimate,
          editAssignee: this.task.assignee,
          editReporter: this.task.reporter,
          editLabels: this.task.labels || [],
          editSprint: this.task.sprint,
          editPriority: this.task.priority,
        });
        this.cdr.detectChanges();
      })
    ).subscribe({
      error: (err) => this.errorHandler.handleError(err),
    });
  }

  private subscribeToEditState(): void {
    this.editStateService.isEditing$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isEditing) => {
        this.isEditing = isEditing;
        this.cdr.detectChanges();
      });
  }

  public onInputChanged(): void {
    this.editTaskForm.markAsDirty();
  }

  public async saveTask(): Promise<void> {
    if (this.editTaskForm.pristine) {
      this.toastService.showError(
        await this.translationService.translateKeyAsync('ERROR.NO_CHANGES')
      );
      this.isEditing = false;
      this.editStateService.setEditingState(false);
      return;
    }

    const status = this.revertStatusKey(this.editTaskForm.get('editStatus')?.value);

    const updatedTask: Task = {
      id: this.task.id,
      name: this.editTaskForm.get('editTask')?.value,
      description: this.editTaskForm.get('editDescription')?.value,
      status: status,
      estimate: this.editTaskForm.get('editEstimate')?.value,
      assignee: this.editTaskForm.get('editAssignee')?.value,
      reporter: this.editTaskForm.get('editReporter')?.value,
      labels: this.editTaskForm.get('editLabels')?.value,
      sprint: this.editTaskForm.get('editSprint')?.value,
      priority: this.revertPriorityKey(
        this.editTaskForm.get('editPriority')?.value
      ) as 'Low' | 'Medium' | 'High',
    };


    this.todoService.updateTask(updatedTask).pipe(takeUntil(this.destroy$)).subscribe({
      next: async () => {
        this.toastService.showSuccess(
          await this.translationService.translateKeyAsync('SUCCESS.TASK_UPDATED')
        );
        this.isEditing = false;
        this.editStateService.setEditingState(false);
        this.task = { ...updatedTask };
        this.initialTask = { ...updatedTask };
        this.editTaskForm.markAsPristine();
        this.cdr.detectChanges();
      },
      error: (err) => this.errorHandler.handleError(err),
    });
  }


  public cancelEditing(): void {
    this.isEditing = false;
    this.editStateService.setEditingState(false);
    this.editTaskForm.patchValue({
      editTask: this.initialTask.name,
      editDescription: this.initialTask.description,
      editStatus: this.initialTask.status,
      editEstimate: this.initialTask.estimate,
      editAssignee: this.initialTask.assignee,
      editReporter: this.initialTask.reporter,
      editLabels: this.initialTask.labels || [],
      editSprint: this.initialTask.sprint,
      editPriority: this.initialTask.priority,
    });
    this.editTaskForm.markAsPristine();
    this.cdr.detectChanges();
  }

  public enableEditing(): void {
    this.isEditing = true;
    this.editStateService.setEditingState(true);
    this.cdr.detectChanges();
  }

  getAssigneeName(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    return user ? user.name : '';
  }

  getReporterName(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    return user ? user.name : '';
  }

  getStatusTranslation(status: string): string {
    switch (status) {
      case 'backlogTitle':
        return 'TASK.STATUS_BACKLOG';
      case 'inProgressTitle':
        return 'TASK.STATUS_IN_PROGRESS';
      case 'completedTitle':
        return 'TASK.STATUS_COMPLETED';
      default:
        return 'TASK.STATUS_BACKLOG';
    }
  }
}
