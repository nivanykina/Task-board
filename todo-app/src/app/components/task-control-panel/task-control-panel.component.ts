import {
  Component,
  EventEmitter,
  Output,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskFilterComponent } from '../task-filter/task-filter.component';
import { FilterOption } from '../task-filter/filter-option.interface';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subscription, lastValueFrom } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-task-control-panel',
  standalone: true,
  imports: [CommonModule, TaskFilterComponent, TranslateModule],
  templateUrl: './task-control-panel.component.html',
  styleUrls: ['./task-control-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskControlPanelComponent implements OnInit, OnDestroy {
  @Output() filterChange: EventEmitter<string | null> = new EventEmitter<
    string | null
  >();

  filterOptions: FilterOption[] = [];
  filterTitle: string = 'filterByStatus';

  private langChangeSubscription: Subscription | null = null;

  constructor(private translate: TranslateService) {}

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
      this.filterOptions = await Promise.all([
        {
          value: null,
          label: await lastValueFrom(this.translate.get('filterAll')),
        },
        {
          value: 'completed',
          label: await lastValueFrom(this.translate.get('filterCompleted')),
        },
        {
          value: 'in progress',
          label: await lastValueFrom(this.translate.get('filterInProgress')),
        },
      ]);
    } catch (error) {
      console.error('Error during translations', error);
    }
  }

  onFilterChange(filter: string | null): void {
    this.filterChange.emit(filter);
  }
}
