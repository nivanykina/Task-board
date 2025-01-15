import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FilterOption } from './filter-option.interface';
import { BehaviorSubject, Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslationService } from 'src/app/services/translation.service';
import { tap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-task-filter',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, TranslateModule],
  templateUrl: './task-filter.component.html',
  styleUrls: ['./task-filter.component.css'],
})
export class TaskFilterComponent implements OnInit, OnDestroy {
  @Input() filterTitle: string = 'filterByStatus';
  @Input() filterOptions: FilterOption[] = [];
  @Output() filterChange: EventEmitter<string | null> = new EventEmitter<
    string | null
  >();
  public translatedFilterTitle: string = '';
  public selectedFilter?: string;
  private filterSubject: BehaviorSubject<string | null> = new BehaviorSubject<
    string | null
  >(null);
  private langChangeSubscription: Subscription | null = null;

  constructor(
    private translationService: TranslationService,
    private translate: TranslateService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.translationService.waitForTranslations();
    await this.applyTranslations();

    this.langChangeSubscription = this.translate.onLangChange
      .pipe(
        tap(async () => {
          await this.translationService.waitForTranslations();
          await this.applyTranslations();
        }),
        catchError((error: any) => {
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
      this.translatedFilterTitle =
        await this.translationService.translateKeyAsync(this.filterTitle);

      this.filterOptions = await Promise.all(
        this.filterOptions.map(async (option) => ({
          value: option.value,
          label: await this.translationService.translateKeyAsync(option.label),
        })),
      );
    } catch (error: any) {
      console.error('Error during translations', error);
    }
  }

  onFilterChange(filter: string | null): void {
    this.filterSubject.next(filter);
    this.filterChange.emit(filter);
  }

  get filter$() {
    return this.filterSubject.asObservable();
  }
}
