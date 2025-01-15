import { Routes } from '@angular/router';
import { ToDoListComponent } from './components/to-do-list/to-do-list.component';
import { AppToDoItemViewComponent } from './components/app-to-do-item-view/app-to-do-item-view.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { BoardComponent } from './components/board/board.component';
import { PreloadGuard } from './guards/preload.guard';

export const routes: Routes = [
  {
    path: 'tasks',
    component: ToDoListComponent,
    children: [{ path: ':id', component: AppToDoItemViewComponent }],
  },
  { path: 'backlog', component: ToDoListComponent },
  { path: 'board', component: BoardComponent, canActivate: [PreloadGuard] },
  { path: '', redirectTo: '/backlog', pathMatch: 'full' },
  { path: '**', component: PageNotFoundComponent },
];
