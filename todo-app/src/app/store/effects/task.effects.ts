import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { TodoService } from '../../services/todo.service';
import {
  loadTasks,
  loadTasksSuccess,
  loadTasksFailure,
} from '../actions/task.actions';

@Injectable()
export class TaskEffects {
  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTasks),
      mergeMap(() =>
        this.todoService.tasks$.pipe(
          map((tasks) => loadTasksSuccess({ tasks })),
          catchError((error) => of(loadTasksFailure({ error }))),
        ),
      ),
    ),
  );

  constructor(
    private actions$: Actions,
    private todoService: TodoService,
  ) {}
}
