import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface Task {
  id: string;
  text: string;
  description: string;
  status?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TodoService implements OnDestroy {
  private apiUrl: string = 'http://localhost:3000/tasks';
  private _tasksSubject: BehaviorSubject<Task[]> = new BehaviorSubject<Task[]>(
    [],
  );
  private subscriptions: Subscription = new Subscription();

  constructor(private http: HttpClient) {
    this.loadTasks()
      .pipe(
        catchError((error) => {
          console.error('Failed to load tasks:', error);
          return throwError(() => new Error('Error loading tasks'));
        }),
      )
      .subscribe({
        next: (tasks) => {
          console.log('Tasks loaded successfully:', tasks);
        },
      });
  }

  private loadTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl).pipe(
      tap((tasks) => this._tasksSubject.next(tasks)),
      catchError(this.handleError),
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
      tap((newTask) => {
        const currentTasks = this._tasksSubject.value;
        this._tasksSubject.next([...currentTasks, newTask]);
      }),
      catchError((error) => {
        console.error('Error adding task:', error);
        return throwError(() => new Error('Error adding task'));
      }),
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentTasks = this._tasksSubject.value.filter(
          (task) => task.id !== id,
        );
        this._tasksSubject.next(currentTasks);
      }),
      catchError((error) => {
        console.error('Error deleting task:', error);
        return throwError(() => new Error('Error deleting task'));
      }),
    );
  }

  updateTask(task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${task.id}`, task).pipe(
      tap((updatedTask) => {
        const currentTasks = this._tasksSubject.value.map((t) =>
          t.id === updatedTask.id ? updatedTask : t,
        );
        this._tasksSubject.next(currentTasks);
      }),
      catchError((error) => {
        console.error('Error updating task:', error);
        return throwError(() => new Error('Error updating task'));
      }),
    );
  }

  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`).pipe(
      tap((task) => console.log('Fetched Task:', task)),
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error.message);
    return throwError(
      () => new Error('Something bad happened; please try again later.'),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
