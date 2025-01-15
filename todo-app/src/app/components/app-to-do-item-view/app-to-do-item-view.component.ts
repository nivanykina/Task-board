import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TodoService, Task } from '../../services/todo.service';
import { ToastService } from '../../services/toast.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';
import { TaskState } from '../../store/reducers/task.reducer';
import { EditStateService } from '../../services/edit-state.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-to-do-item-view',
  templateUrl: './app-to-do-item-view.component.html',
  styleUrls: ['./app-to-do-item-view.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    ButtonComponent,
    TranslateModule,
  ],
})
export class AppToDoItemViewComponent implements OnInit, OnDestroy {
  @Input() task!: Task;
  public editTaskForm: FormGroup;
  public isEditing: boolean = false;
  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private store: Store<{ tasks: TaskState }>,
    private todoService: TodoService,
    private toastService: ToastService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private editStateService: EditStateService,
  ) {
    this.editTaskForm = this.fb.group({
      editTask: ['', Validators.required],
      editDescription: ['', Validators.required],
      editStatus: [false],
    });
  }

  ngOnInit(): void {
    this.subscribeToRouteParams();
    this.subscribeToEditState();
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
    this.todoService
      .getTaskById(taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (task) => {
          this.task = task;
          this.editTaskForm.patchValue({
            editTask: task.text,
            editDescription: task.description,
            editStatus: task.status,
          });
        },
        error: (err) => this.errorHandler.handleError(err),
      });
  }

  private subscribeToEditState(): void {
    this.editStateService.isEditing$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isEditing) => {
        this.isEditing = isEditing;
      });
  }

  public enableEditing(): void {
    this.isEditing = true;
    this.editStateService.setEditingState(true);
  }

  public saveTask(): void {
    if (!this.editTaskForm.dirty) {
      this.toastService.showError('No changes to save.');
      this.isEditing = false;
      this.editStateService.setEditingState(false);
      return;
    }
    const updatedTask: Task = {
      id: this.task.id,
      text: this.editTaskForm.get('editTask')?.value,
      description: this.editTaskForm.get('editDescription')?.value,
      status: this.editTaskForm.get('editStatus')?.value,
    };

    this.todoService
      .updateTask(updatedTask)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Task updated successfully!');
          this.isEditing = false;
          this.editStateService.setEditingState(false);
          this.task = updatedTask;
          this.cdr.detectChanges();
        },
        error: (err) => this.errorHandler.handleError(err),
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
