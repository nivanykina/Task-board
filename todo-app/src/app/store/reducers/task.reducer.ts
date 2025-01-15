import { createReducer, on } from '@ngrx/store';
import { Task } from '../../services/todo.service';
import { selectTask } from '../actions/task.actions';

export interface TaskState {
  tasks: Task[];
  selectedTask: Task | undefined;
}

export const initialState: TaskState = {
  tasks: [],
  selectedTask: undefined,
};

export const taskReducer = createReducer(
  initialState,
  on(selectTask, (state, { taskId }) => ({
    ...state,
    selectedTask: state.tasks.find((task) => task.id === taskId),
  })),
);
