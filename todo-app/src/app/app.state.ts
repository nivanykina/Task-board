import { TaskState } from './store/reducers/task.reducer';

export interface AppState {
  tasks: TaskState;
}
