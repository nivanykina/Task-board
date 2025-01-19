import { Routes } from '@angular/router';
import { ToDoListComponent } from './components/to-do-list/to-do-list.component';
import { AppToDoItemViewComponent } from './components/app-to-do-item-view/app-to-do-item-view.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { BoardComponent } from './components/board/board.component';
import { PreloadGuard } from './guards/preload.guard';
import { UserSelectionComponent } from './components/user-selection/user-selection.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';

export const routes: Routes = [
  { path: 'login', component: UserSelectionComponent },
  { path: 'user-management/:action', component: UserManagementComponent },
  {
    path: 'tasks',
    component: ToDoListComponent,
    children: [{ path: ':id', component: AppToDoItemViewComponent }],
  },
  { path: 'backlog', component: ToDoListComponent },
  { path: 'board', component: BoardComponent, canActivate: [PreloadGuard] },
  { path: 'auth/yandex/callback', component: AuthCallbackComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', component: PageNotFoundComponent },
];
