import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoService, Task } from '../../services/todo.service';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { LoaderService } from '../../services/loader.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    LoadingSpinnerComponent,
    TranslateModule,
  ],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css'],
})
export class BoardComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  private destroy$ = new Subject<void>();
  public isLoading: boolean = true;

  backlogTitle: string;
  inProgressTitle: string;
  completedTitle: string;

  constructor(
    private todoService: TodoService,
    private ngZone: NgZone,
    private loaderService: LoaderService,
    private translate: TranslateService,
  ) {
    this.loadTasks();
    this.backlogTitle = this.translate.instant('backlogTitle');
    this.inProgressTitle = this.translate.instant('inProgressTitle');
    this.completedTitle = this.translate.instant('completedTitle');
  }

  ngOnInit(): void {
    this.initializeLoader();
  }

  initializeLoader(): void {
    this.loaderService.loaderState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.isLoading = state;
      });

    this.loaderService.showLoader();

    setTimeout(() => {
      this.loaderService.hideLoader();
    }, 5000);
  }

  get backlogTasks(): Task[] {
    return this.tasks.filter((task: Task) => task.status === undefined);
  }

  get inProgressTasks(): Task[] {
    return this.tasks.filter((task: Task) => task.status === false);
  }

  get completedTasks(): Task[] {
    return this.tasks.filter((task: Task) => task.status === true);
  }

  loadTasks(): void {
    this.todoService.tasks$
      .pipe(
        takeUntil(this.destroy$),
        tap({
          next: (tasks: Task[]) => {
            this.tasks = tasks;
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
        moveItemInArray(
          event.container.data,
          event.previousIndex,
          event.currentIndex,
        );
      } else {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex,
        );
        this.updateTaskStatus(
          event.container.data[event.currentIndex],
          event.container.id,
        );
      }
    });
  }

  updateTaskStatus(task: Task, containerId: string): void {
    task.status =
      containerId === 'completed'
        ? true
        : containerId === 'in-progress'
          ? false
          : undefined;
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
