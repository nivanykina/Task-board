import { createSelector } from '@ngrx/store';
import { AppState } from '../../app.state';
import { TaskState } from '../reducers/task.reducer';

export const selectTasksState = (state: AppState) => state.tasks;

export const selectSelectedTask = createSelector(
  selectTasksState,
  (state: TaskState) => state.selectedTask,
);
