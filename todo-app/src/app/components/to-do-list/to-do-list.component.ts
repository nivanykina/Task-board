import {
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToDoListItemComponent } from '../to-do-list-item-component/to-do-list-item-component.component';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ButtonComponent } from '../button/button.component';
import { TodoService, Task } from '../../services/todo.service';
import { ToastService } from '../../services/toast.service';
import {
  Observable,
  Subject,
  BehaviorSubject,
  combineLatest,
  lastValueFrom,
} from 'rxjs';
import { map, takeUntil, filter, tap, catchError } from 'rxjs/operators';
import { ClickDirective } from '../../shared/click.directive';
import { TooltipDirective } from '../../shared/tooltip.directive';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { TaskControlPanelComponent } from '../task-control-panel/task-control-panel.component';
import { TodoCreateItemComponent } from '../todo-create-item/todo-create-item.component';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../app.state';
import { selectTask } from '../../store/actions/task.actions';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { selectSelectedTask } from '../../store/selectors/task.selectors';
import { AppToDoItemViewComponent } from '../app-to-do-item-view/app-to-do-item-view.component';
import { EditStateService } from '../../services/edit-state.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-to-do-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ToDoListItemComponent,
    MatInputModule,
    MatProgressSpinnerModule,
    ButtonComponent,
    ClickDirective,
    TooltipDirective,
    LoadingSpinnerComponent,
    TaskControlPanelComponent,
    TodoCreateItemComponent,
    RouterModule,
    AppToDoItemViewComponent,
    TranslateModule,
  ],
  templateUrl: './to-do-list.component.html',
  styleUrls: ['./to-do-list.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ToDoListComponent implements OnInit, OnDestroy {
  public title: string = '';
  public deleteButtonTitle: string = '';
  public tasks$!: Observable<Task[]>;
  public filteredTasks$!: Observable<Task[]>;
  public selectedItemId: string | null = null;
  public selectedTask!: Task;
  public isLoading: boolean = true;
  private filterSubject: BehaviorSubject<string | null> = new BehaviorSubject<
    string | null
  >(null);
  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private todoService: TodoService,
    private toastService: ToastService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private store: Store<AppState>,
    private editStateService: EditStateService,
    private translate: TranslateService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    await this.setTranslations();

    setTimeout(() => {
      this.tasks$ = this.todoService.tasks$;
      this.filteredTasks$ = combineLatest([
        this.tasks$,
        this.filterSubject,
      ]).pipe(
        map(([tasks, filter]) => {
          if (!filter) {
            return tasks;
          }
          return tasks.filter(
            (task) => task.status === (filter === 'completed'),
          );
        }),
      );
      this.tasks$.pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.isLoading = false;
        },
        error: (err) => {
          this.errorHandler.handleError(err);
          this.isLoading = false;
        },
      });
    }, 2000);

    this.store
      .select(selectSelectedTask)
      .pipe(
        takeUntil(this.destroy$),
        filter((task): task is Task => !!task),
      )
      .subscribe((task) => {
        this.selectedTask = task;
      });

    this.translate.onLangChange
      .pipe(
        takeUntil(this.destroy$),
        tap(() => this.setTranslations()),
        catchError((err) => {
          this.errorHandler.handleError(err);
          return [];
        }),
      )
      .subscribe();
  }

  private async setTranslations(): Promise<void> {
    try {
      this.title = await lastValueFrom(this.translate.get('title'));
      this.deleteButtonTitle = await lastValueFrom(
        this.translate.get('deleteButtonTitle'),
      );
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  public onTaskCreated(task: { text: string; description: string }): void {
    this.toastService.showSuccess(
      this.translate.instant('taskCreatedSuccess', { task: task.text }),
    );
  }

  public deleteTask(taskId: string, event: Event): void {
    event.stopPropagation();
    this.todoService
      .deleteTask(taskId)
      .pipe(
        takeUntil(this.destroy$),
        tap({
          next: () => {
            this.toastService.showSuccess(
              this.translate.instant('taskDeletedSuccess'),
            );
          },
          error: (err) => {
            this.errorHandler.handleError(err);
          },
        }),
      )
      .subscribe();
  }

  public handleClick(taskId: string, event: Event): void {
    event.stopPropagation();
    this.selectedItemId = taskId;
    this.store.dispatch(selectTask({ taskId }));
    this.editStateService.setEditingState(false);
    this.router.navigate(['/tasks', taskId]).catch((err) => {
      this.errorHandler.handleError(err);
    });
  }

  public toggleStatus(task: Task): void {
    const updatedTask: Task = {
      ...task,
      status: !task.status,
    };
    this.todoService
      .updateTask(updatedTask)
      .pipe(
        takeUntil(this.destroy$),
        tap({
          next: () => {
            const message = updatedTask.status
              ? this.translate.instant('taskCompleted')
              : this.translate.instant('taskIncomplete');
            this.toastService.showSuccess(message);
          },
          error: (err) => {
            this.errorHandler.handleError(err);
          },
        }),
      )
      .subscribe();
  }

  public trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  public applyFilter(filter: string | null): void {
    this.filterSubject.next(filter);
    this.filteredTasks$ = combineLatest([this.tasks$, this.filterSubject]).pipe(
      map(([tasks, filter]) => {
        if (!filter) {
          return tasks;
        }
        if (filter === 'completed') {
          return tasks.filter((task) => task.status === true);
        } else if (filter === 'in progress') {
          return tasks.filter(
            (task) => task.status === false || task.status === null,
          );
        } else {
          return tasks;
        }
      }),
      takeUntil(this.destroy$),
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
