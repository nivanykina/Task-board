import {
  Component,
  EventEmitter,
  Output,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskFilterComponent } from '../task-filter/task-filter.component';
import { FilterOption } from '../task-filter/filter-option.interface';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subscription, lastValueFrom } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-task-control-panel',
  standalone: true,
  imports: [CommonModule, TaskFilterComponent, TranslateModule],
  templateUrl: './task-control-panel.component.html',
  styleUrls: ['./task-control-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskControlPanelComponent implements OnInit, OnDestroy {
  @Input() filterOptions: { [key: string]: FilterOption[] } = {};
  @Output() filterChange: EventEmitter<{ [key: string]: string | null }> = new EventEmitter<{ [key: string]: string | null }>();

  filterTitles: { [key: string]: string } = {
    status: 'filterByStatus',
    assignee: 'filterByAssignee',
    priority: 'filterByPriority',
    labels: 'filterByLabels',
    reporter: 'filterByReporter',
    estimate: 'filterByEstimate',
    sprint: 'filterBySprint'
  };

  private langChangeSubscription: Subscription | null = null;
  private users: User[] = [];

  constructor(private translate: TranslateService, private userService: UserService) {}

  async ngOnInit(): Promise<void> {
    await this.applyTranslations();

    this.langChangeSubscription = this.translate.onLangChange
      .pipe(
        tap(() => this.applyTranslations()),
        catchError((error) => {
          console.error('Error during language change', error);
          return [];
        }),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  async applyTranslations(): Promise<void> {
    try {
      this.users = await lastValueFrom(this.userService.getUsers());

      const allOption = { value: null, label: await lastValueFrom(this.translate.get('filterAll')) };

      const statusOptions = this.filterOptions['status'] ?? [];
      const translatedStatuses = await Promise.all(statusOptions.map(async (option) => {
        if (option.value) {
          let translationKey = '';
          switch (option.value) {
            case 'completedTitle':
              translationKey = 'TASK.STATUS_COMPLETED';
              break;
            case 'inProgressTitle':
              translationKey = 'TASK.STATUS_IN_PROGRESS';
              break;
            case 'backlogTitle':
              translationKey = 'TASK.STATUS_BACKLOG';
              break;
          }
          return {
            ...option,
            label: await lastValueFrom(this.translate.get(translationKey))
          };
        }
        return option;
      }));

      const priorityOptions = this.filterOptions['priority'] ?? [];
      const translatedPriorities = await Promise.all(priorityOptions.map(async (option) => {
        if (option.value) {
          let translationKey = '';
          switch (option.value) {
            case 'Low':
              translationKey = 'TASK.PRIORITY_LOW';
              break;
            case 'Medium':
              translationKey = 'TASK.PRIORITY_MEDIUM';
              break;
            case 'High':
              translationKey = 'TASK.PRIORITY_HIGH';
              break;
          }
          return {
            ...option,
            label: await lastValueFrom(this.translate.get(translationKey))
          };
        }
        return option;
      }));

      const labelsOptions = this.filterOptions['labels'] ?? [];
      const reporterOptions = this.filterOptions['reporter'] ?? [];
      const estimateOptions = this.filterOptions['estimate'] ?? [];
      const sprintOptions = this.filterOptions['sprint'] ?? [];

      const uniqueReporterIds = new Set(this.users.map(user => user.id));

      this.filterOptions = {
        status: [allOption, ...translatedStatuses.filter(option => option.value !== null)],
        assignee: [
          allOption,
          ...this.users.map(user => ({
            value: user.id,
            label: user.name
          }))
        ],
        priority: [allOption, ...translatedPriorities.filter(option => option.value !== null)],
        labels: [allOption, ...labelsOptions.filter(option => option.value !== null)],
        reporter: [
          allOption,
          ...reporterOptions.filter(option => option.value !== null && !uniqueReporterIds.has(option.value)),
          ...this.users.map(user => ({
            value: user.id,
            label: user.name
          }))
        ],
        estimate: [allOption, ...estimateOptions.filter(option => option.value !== null)],
        sprint: [allOption, ...sprintOptions.filter(option => option.value !== null)]
      };

    } catch (error) {
      console.error('Error during translations:', error);
    }
  }

  onFilterChange(filterType: string, filter: string | null): void {
    this.filterChange.emit({ [filterType]: filter });
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
