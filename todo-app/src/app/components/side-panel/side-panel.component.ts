import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
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
})
export class SidePanelComponent implements OnInit, OnDestroy {
  @Output() toggle = new EventEmitter<void>();
  isCollapsed: boolean = false;
  private destroy$ = new Subject<void>();

  backlogLinkText: string = '';
  boardLinkText: string = '';

  constructor(private translationService: TranslationService) {}

  ngOnInit() {
    this.translationService.currentLang$
      .pipe(
        takeUntil(this.destroy$),
        tap({
          next: () => this.updateTranslations(),
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
          },
          error: (err) =>
            console.error('Translation error for boardTitle:', err),
        }),
      )
      .subscribe();
  }

  togglePanel(): void {
    this.isCollapsed = !this.isCollapsed;
    this.toggle.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
