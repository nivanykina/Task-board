import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoService, Task } from '../../services/todo.service';
import { Subject, BehaviorSubject, combineLatestWith } from 'rxjs';
import { takeUntil, tap, map } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { LoaderService } from '../../services/loader.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TaskControlPanelComponent } from '../task-control-panel/task-control-panel.component';
import { FilterOption } from '../task-filter/filter-option.interface';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, LoadingSpinnerComponent, TranslateModule, TaskControlPanelComponent],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  filteredTasks: { [key: string]: Task[] } = {
    backlogTasks: [],
    inProgressTasks: [],
    completedTasks: []
  };
  private destroy$ = new Subject<void>();
  public isLoading: boolean = true;

  backlogTitle: string = '';
  inProgressTitle: string = '';
  completedTitle: string = '';

  filterOptions: { [key: string]: FilterOption[] } = {};
  private filterSubject: BehaviorSubject<{ [key: string]: string | null }> = new BehaviorSubject<{ [key: string]: string | null }>({});

  constructor(
    private todoService: TodoService,
    private ngZone: NgZone,
    private loaderService: LoaderService,
    private translate: TranslateService,
    private cdRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initializeLoader();
    this.loadTasks();
    this.initializeFilters();
    this.initializeFilterOptions();
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.setTranslations();
      this.cdRef.markForCheck();
    });
    this.setTranslations();
  }

  initializeLoader(): void {
    this.loaderService.loaderState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.isLoading = state;
        this.cdRef.markForCheck();
      });

    this.loaderService.showLoader();

    setTimeout(() => {
      this.loaderService.hideLoader();
      this.cdRef.markForCheck();
    }, 5000);
  }

  setTranslations(): void {
    this.translate.get('TASK.STATUS_BACKLOG').subscribe((res: string) => {
      this.backlogTitle = res;
      this.cdRef.markForCheck();
    });
    this.translate.get('TASK.STATUS_IN_PROGRESS').subscribe((res: string) => {
      this.inProgressTitle = res;
      this.cdRef.markForCheck();
    });
    this.translate.get('TASK.STATUS_COMPLETED').subscribe((res: string) => {
      this.completedTitle = res;
      this.cdRef.markForCheck();
    });
  }

  initializeFilters(): void {
    this.filterSubject.pipe(
      takeUntil(this.destroy$),
      combineLatestWith(this.todoService.tasks$),
      map(([filters, tasks]) => this.applyFilters(tasks, filters))
    ).subscribe(filteredTasks => {
      this.filteredTasks = filteredTasks;
    });
  }

  initializeFilterOptions(): void {
    this.todoService.tasks$.pipe(takeUntil(this.destroy$)).subscribe(tasks => {
      this.filterOptions = {
        status: this.getUniqueOptions(tasks, 'status', 'TASK.STATUS_'),
        assignee: this.getUniqueOptions(tasks, 'assignee', ''),
        priority: this.getUniqueOptions(tasks, 'priority', 'TASK.PRIORITY_'),
        labels: this.getUniqueOptions(tasks, 'labels', ''),
        reporter: this.getUniqueOptions(tasks, 'reporter', ''),
        estimate: this.getUniqueOptions(tasks, 'estimate', ''),
        sprint: this.getUniqueOptions(tasks, 'sprint', '')
      };
      this.cdRef.markForCheck();
    });
  }

  private getUniqueOptions(tasks: Task[], key: keyof Task, prefix: string): FilterOption[] {
    const options = tasks
      .map(task => task[key])
      .flatMap(value => Array.isArray(value) ? value : [value])
      .filter((value, index, self) => value && self.indexOf(value) === index);

    return options.map(value => {
      const label = prefix && value ? this.translate.instant(`${prefix}${value.toString().toUpperCase()}`) : value.toString();
      return {
        value: value,
        label: label
      };
    });
  }

  applyFilters(tasks: Task[], filters: { [key: string]: string | null }): { [key: string]: Task[] } {
    const filteredTasks = tasks.filter(task => {
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

    return {
      backlogTasks: filteredTasks.filter((task: Task) => task.status === 'backlogTitle'),
      inProgressTasks: filteredTasks.filter((task: Task) => task.status === 'inProgressTitle'),
      completedTasks: filteredTasks.filter((task: Task) => task.status === 'completedTitle')
    };
  }

  applyFilter(filters: { [key: string]: string | null }): void {
    this.filterSubject.next(filters);
  }

  loadTasks(): void {
    this.todoService.tasks$
      .pipe(
        takeUntil(this.destroy$),
        tap({
          next: (tasks: Task[]) => {
            this.tasks = tasks;
            this.applyFilters(this.tasks, this.filterSubject.value);
          },
          error: (err) => {
            console.error('Failed to load tasks', err);
          },
        }),
      )
      .subscribe();
  }

  drop(event: CdkDragDrop<Task[]>): void {
    this.ngZone.run(() => {
      if (event.previousContainer === event.container) {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      } else {
        transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        this.updateTaskStatus(event.container.data[event.currentIndex], event.container.id);
      }
    });
  }

  updateTaskStatus(task: Task, containerId: string): void {
    task.status =
      containerId === 'completed'
        ? 'completedTitle'
        : containerId === 'in-progress'
          ? 'inProgressTitle'
          : 'backlogTitle';
    this.todoService
      .updateTask(task)
      .pipe(
        tap({
          next: () => {},
          error: (err) => {
            console.error(`Failed to update task ${task.id}`, err);
          },
        }),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
