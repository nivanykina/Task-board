import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { TranslationService } from '../../services/translation.service';
import { takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'app-side-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-panel.component.html',
  styleUrls: ['./side-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidePanelComponent implements OnInit, OnDestroy {
  @Output() toggle = new EventEmitter<void>();
  isCollapsed: boolean = false;
  private destroy$ = new Subject<void>();

  backlogLinkText: string = '';
  boardLinkText: string = '';
  calendarLinkText: string = '';

  constructor(
    private translationService: TranslationService,
    private changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.translationService.currentLang$
      .pipe(
        takeUntil(this.destroy$),
        tap({
          next: () => {
            this.updateTranslations();
            this.changeDetector.markForCheck();
          },
          error: (err) => console.error('Language change error:', err),
        }),
      )
      .subscribe();

    this.updateTranslations();
  }

  updateTranslations() {
    this.translationService['translate']
      .get('tasksListTitle')
      .pipe(
        takeUntil(this.destroy$),
        tap({
          next: (text: string) => {
            this.backlogLinkText = text;
            this.changeDetector.markForCheck();
          },
          error: (err) =>
            console.error('Translation error for tasksListTitle:', err),
        }),
      )
      .subscribe();

    this.translationService['translate']
      .get('boardTitle')
      .pipe(
        takeUntil(this.destroy$),
        tap({
          next: (text: string) => {
            this.boardLinkText = text;
            this.changeDetector.markForCheck();
          },
          error: (err) =>
            console.error('Translation error for boardTitle:', err),
        }),
      )
      .subscribe();

    this.translationService['translate']
      .get('calendarLinkText')
      .pipe(
        takeUntil(this.destroy$),
        tap({
          next: (text: string) => {
            this.calendarLinkText = text;
            this.changeDetector.markForCheck();
          },
          error: (err) =>
            console.error('Translation error for calendarLinkText:', err),
        }),
      )
      .subscribe();
  }

  togglePanel(): void {
    setTimeout(() => {
      this.isCollapsed = !this.isCollapsed;
      this.changeDetector.detectChanges();
      this.toggle.emit();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
