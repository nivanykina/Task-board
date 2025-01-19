import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastsComponent } from './components/toasts/toasts.component';
import { ToDoListComponent } from './components/to-do-list/to-do-list.component';
import { LoadingSpinnerComponent } from './shared/loading-spinner/loading-spinner.component';
import { TaskControlPanelComponent } from './components/task-control-panel/task-control-panel.component';
import { TaskFilterComponent } from './components/task-filter/task-filter.component';
import { AppToDoItemViewComponent } from './components/app-to-do-item-view/app-to-do-item-view.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { SidePanelComponent } from './components/side-panel/side-panel.component';
import { BoardComponent } from './components/board/board.component';
import { ToggleClassDirective } from './shared/toggle-class.directive';
import { HeaderComponent } from './components/header/header.component';
import { UserSelectionComponent } from './components/user-selection/user-selection.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { Subscription, lastValueFrom } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastsComponent,
    ToDoListComponent,
    LoadingSpinnerComponent,
    TaskControlPanelComponent,
    TaskFilterComponent,
    AppToDoItemViewComponent,
    PageNotFoundComponent,
    SidePanelComponent,
    BoardComponent,
    ToggleClassDirective,
    HeaderComponent,
    UserSelectionComponent,
    UserManagementComponent,
    AuthCallbackComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  title: string = '';
  private subscriptions: Subscription = new Subscription();
  showHeader: boolean = true;
  showSidebar: boolean = true;

  constructor(
    private translate: TranslateService,
    private router: Router,
  ) {
    this.translate.setDefaultLang('ru');
    this.translate.use('ru');

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const currentUrl = this.router.url;
        this.showHeader = true;
        this.showSidebar = !(
          currentUrl === '/login' || currentUrl.startsWith('/user-management/')
        );
      }
    });
  }

  ngOnInit(): void {
    this.setTitleTranslation().catch((error) =>
      console.error('Error during translations', error),
    );
    const langChangeSubscription = this.translate.onLangChange
      .pipe(
        tap(() =>
          this.setTitleTranslation().catch((error) =>
            console.error('Error during translations', error),
          ),
        ),
        catchError((err) => {
          console.error('Error during language change', err);
          return [];
        }),
      )
      .subscribe();

    this.subscriptions.add(langChangeSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private async setTitleTranslation(): Promise<void> {
    try {
      this.title = await lastValueFrom(this.translate.get('title'));
    } catch (error) {
      console.error('Error during translations', error);
    }
  }

  isCollapsed: boolean = false;

  toggleSidePanel(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
