import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface Task {
  id: string;
  name: string;
  description: string;
  status: 'backlogTitle' | 'inProgressTitle' | 'completedTitle';
  estimate: number;
  assignee: string;
  reporter: string;
  labels: string[];
  sprint: string;
  priority: 'Low' | 'Medium' | 'High';

  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class TodoService implements OnDestroy {
  private apiUrl: string = 'http://localhost:3000/tasks';
  private _tasksSubject: BehaviorSubject<Task[]> = new BehaviorSubject<Task[]>([]);
  private subscriptions: Subscription = new Subscription();

  constructor(private http: HttpClient) {
    this.loadTasks()
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Failed to load tasks:', error);
          return throwError(() => new Error('Error loading tasks'));
        }),
      )
      .subscribe({
        next: (tasks: Task[]) => {
          console.log('Tasks loaded successfully:', tasks);
          this._tasksSubject.next(tasks);
        },
        error: (error) => {
          console.error('Error occurred while loading tasks:', error);
        }
      });
  }

  private loadTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl).pipe(
      tap((tasks: Task[]) => this._tasksSubject.next(tasks)),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(`Error loading tasks: ${error.message}`));
      })
    );
  }

  get tasks$(): Observable<Task[]> {
    return this._tasksSubject.asObservable();
  }

  set tasks(tasks: Task[]) {
    this._tasksSubject.next(tasks);
  }

  addTask(task: Task): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task).pipe(
      tap((newTask: Task) => {
        const currentTasks = this._tasksSubject.value;
        this._tasksSubject.next([...currentTasks, newTask]);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error adding task:', error.message);
        return throwError(() => new Error(`Error adding task: ${error.message}`));
      })
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentTasks = this._tasksSubject.value.filter((task) => task.id !== id);
        this._tasksSubject.next(currentTasks);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error deleting task:', error.message);
        return throwError(() => new Error(`Error deleting task: ${error.message}`));
      })
    );
  }

  updateTask(task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${task.id}`, task).pipe(
      tap((updatedTask: Task) => {
        const currentTasks = this._tasksSubject.value.map((t) =>
          t.id === updatedTask.id ? updatedTask : t,
        );
        this._tasksSubject.next(currentTasks);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating task:', error.message);
        return throwError(() => new Error(`Error updating task: ${error.message}`));
      })
    );
  }

  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`).pipe(
      tap((task: Task) => console.log('Fetched Task:', task)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching task:', error.message);
        return throwError(() => new Error(`Error fetching task: ${error.message}`));
      })
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error.message);
    return throwError(() => new Error(`Something bad happened; please try again later. Error: ${error.message}`));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
