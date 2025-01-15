import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, lastValueFrom, Subscription } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TranslationService implements OnDestroy {
  private currentLangSubject = new BehaviorSubject<string>('ru');
  currentLang$ = this.currentLangSubject.asObservable();
  private translationsReady = new BehaviorSubject<boolean>(false);
  translationsReady$ = this.translationsReady.asObservable();
  private langChangeSubscription: Subscription;

  constructor(public translate: TranslateService) {
    this.translate.setDefaultLang('ru');
    this.langChangeSubscription = this.translate.use('ru').subscribe(() => {
      this.translationsReady.next(true);
    });
  }

  switchLanguage(language: string): void {
    this.translate.use(language).subscribe(() => {
      this.translationsReady.next(true);
    });
    this.currentLangSubject.next(language);
  }

  getCurrentLang(): string {
    return this.translate.currentLang || this.translate.defaultLang;
  }

  async translateKeyAsync(key: string): Promise<string> {
    try {
      return await lastValueFrom(this.translate.get(key));
    } catch (error) {
      console.error('Error during translation', error);
      throw error;
    }
  }

  async waitForTranslations(): Promise<void> {
    try {
      await lastValueFrom(
        this.translationsReady$.pipe(
          tap((ready: boolean) => {
            if (!ready) throw new Error('Translations not ready');
          }),
          catchError((error) => {
            console.error('Error during waiting for translations', error);
            throw error;
          }),
        ),
      );
    } catch (error) {
      console.error('Error during waiting for translations', error);
      throw error;
    }
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }
}
