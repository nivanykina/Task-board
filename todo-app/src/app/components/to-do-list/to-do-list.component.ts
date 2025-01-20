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
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { selectSelectedTask } from '../../store/selectors/task.selectors';
import { AppToDoItemViewComponent } from '../app-to-do-item-view/app-to-do-item-view.component';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { UserService } from '../../services/user.service';
import { FilterOption } from '../task-filter/filter-option.interface';
import { EditStateService } from '../../services/edit-state.service';

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
  public selectedTask!: Task | null;
  public isLoading: boolean = true;
  public filterOptions: { [key: string]: FilterOption[] } = {};
  private filterSubject: BehaviorSubject<{ [key: string]: string | null }> = new BehaviorSubject<{ [key: string]: string | null }>({});
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
    private userService: UserService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    await this.setTranslations();

    this.tasks$ = this.todoService.tasks$;
    this.filteredTasks$ = this.filterTasks();

    this.tasks$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (tasks) => {
        this.isLoading = false;
        this.extractFilterOptions(tasks);
      },
      error: (err) => {
        this.errorHandler.handleError(err);
        this.isLoading = false;
      },
    });

    this.store
      .select(selectSelectedTask)
      .pipe(
        takeUntil(this.destroy$),
        filter((task): task is Task => !!task),
      )
      .subscribe((task) => {
        console.log('Selected task from store:', task);
        this.selectedTask = task;
        this.cdr.detectChanges();
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

  private extractFilterOptions(tasks: Task[]): void {
    const statusOptions = this.getUniqueOptions(tasks, 'status', 'TASK.STATUS_');
    const assigneeOptions = this.getUniqueOptions(tasks, 'assignee', '');
    const priorityOptions = this.getUniqueOptions(tasks, 'priority', 'TASK.PRIORITY_');
    const labelOptions = this.getUniqueOptions(tasks, 'labels', '');
    const reporterOptions = this.getUniqueOptions(tasks, 'reporter', '');
    const estimateOptions = this.getUniqueOptions(tasks, 'estimate', '');
    const sprintOptions = this.getUniqueOptions(tasks, 'sprint', '');

    this.filterOptions = {
      status: statusOptions,
      assignee: assigneeOptions,
      priority: priorityOptions,
      labels: labelOptions,
      reporter: reporterOptions,
      estimate: estimateOptions,
      sprint: sprintOptions
    };
  }

  private async setTranslations(): Promise<void> {
    try {
      const users = await lastValueFrom(this.userService.getUsers());

      this.title = await lastValueFrom(this.translate.get('tasksListTitle'));
      this.deleteButtonTitle = await lastValueFrom(this.translate.get('deleteButtonTitle'));
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  private getUniqueOptions(tasks: Task[], key: keyof Task, prefix: string): FilterOption[] {
    const options = tasks
      .map(task => task[key])
      .flatMap(value => Array.isArray(value) ? value : [value])
      .filter((value, index, self) => value && self.indexOf(value) === index);


    return options.map(value => {
      let label = value.toString();
      if (prefix && value) {
        label = this.translate.instant(`${prefix}${value.toString().toUpperCase()}`);
      }
      return {
        value: value,
        label: label
      };
    });
  }

  private filterTasks(): Observable<Task[]> {
    return combineLatest([this.tasks$, this.filterSubject]).pipe(
      map(([tasks, filters]) => {
        return tasks.filter(task => {
          return Object.keys(filters).every(filterKey => {
            const filterValue = filters[filterKey];
            if (!filterValue) {
              return true;
            }
            if (filterKey === 'labels') {
              return Array.isArray(task['labels']) && task['labels'].includes(filterValue);
            }
            if (filterKey === 'assignee' || filterKey === 'reporter') {
              return task[filterKey] === filterValue;
            }
            return task[filterKey as keyof Task] === filterValue;
          });
        });
      }),
      takeUntil(this.destroy$),
    );
  }
  public applyFilter(filters: { [key: string]: string | null }): void {
    const currentFilters = this.filterSubject.value;
    this.filterSubject.next({ ...currentFilters, ...filters });
    this.filteredTasks$ = this.filterTasks();
  }

  public onTaskCreated(task: Task): void {
    this.toastService.showSuccess(
      this.translate.instant('taskCreatedSuccess', { task: task.name }),
    );
    this.tasks$ = this.todoService.tasks$;
    this.applyFilter(this.filterSubject.value);
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
            this.applyFilter(this.filterSubject.value);
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

    this.tasks$.pipe(takeUntil(this.destroy$)).subscribe((tasks) => {
      this.selectedTask = tasks.find((task) => task.id === taskId) || null;
    });

    this.router.navigate(['/tasks', taskId]).catch((err) => {
      this.errorHandler.handleError(err);
    });
  }

  public toggleStatus(task: Task, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const updatedStatus: 'backlogTitle' | 'inProgressTitle' | 'completedTitle' =
      isChecked ? 'completedTitle' : (task.status === 'completedTitle' ? 'inProgressTitle' : 'backlogTitle');

    const updatedTask: Task = {
      ...task,
      status: updatedStatus
    };

    this.todoService.updateTask(updatedTask).pipe(
      takeUntil(this.destroy$),
      tap({
        next: () => {
          const message = updatedStatus === 'completedTitle'
            ? this.translate.instant('taskCompleted')
            : this.translate.instant('taskIncomplete');
          this.toastService.showSuccess(message);
          this.applyFilter(this.filterSubject.value);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.errorHandler.handleError(err);
        },
      }),
    ).subscribe();
  }


  public trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
