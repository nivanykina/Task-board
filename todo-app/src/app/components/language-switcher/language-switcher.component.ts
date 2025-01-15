import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store, select } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';
import { setLanguage } from '../../store/actions/language.actions';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.css'],
  imports: [CommonModule],
})
export class LanguageSwitcherComponent implements OnInit, OnDestroy {
  currentLanguage$: Observable<string>;
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<{ language: string }>,
    private translationService: TranslationService,
  ) {
    this.currentLanguage$ = store.pipe(select('language'));
  }

  ngOnInit() {
    const initialLanguage = this.translationService.getCurrentLang();
    this.store.dispatch(setLanguage({ language: initialLanguage }));

    this.currentLanguage$
      .pipe(
        takeUntil(this.destroy$),
        tap({
          error: (err) =>
            console.error('Error in currentLanguage$ stream:', err),
        }),
      )
      .subscribe();
  }

  switchLanguage(language: string) {
    this.store.dispatch(setLanguage({ language }));
    this.translationService.switchLanguage(language);
  }

  isCurrentLanguage(language: string): Observable<boolean> {
    return this.currentLanguage$.pipe(
      map((currentLanguage: string) => currentLanguage === language),
      tap({
        error: (err) =>
          console.error(
            `Error comparing current language to ${language}:`,
            err,
          ),
      }),
      takeUntil(this.destroy$),
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
