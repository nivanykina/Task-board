import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';
import { TooltipDirective } from '../../shared/tooltip.directive';
import { ClickDirective } from '../../shared/click.directive';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subscription, lastValueFrom } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-to-do-list-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    TooltipDirective,
    ClickDirective,
    TranslateModule,
  ],
  templateUrl: './to-do-list-item-component.component.html',
  styleUrls: ['./to-do-list-item-component.component.css'],
})
export class ToDoListItemComponent implements OnInit, OnDestroy {
  @Input() item!: { id: number; text: string; description: string };
  @Input() selectedItemId!: number | null;
  @Output() delete = new EventEmitter<number>();
  public deleteButtonTitle: string = '';
  public showDescriptionText: string = '';
  public hideDescriptionText: string = '';
  private langChangeSubscription: Subscription | null = null;

  constructor(private translate: TranslateService) {}

  async ngOnInit(): Promise<void> {
    await this.setTranslations();
    this.langChangeSubscription = this.translate.onLangChange
      .pipe(
        tap(() => this.setTranslations()),
        catchError((err) => {
          console.error('Error during language change', err);
          return [];
        }),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  private async setTranslations(): Promise<void> {
    try {
      this.deleteButtonTitle = await lastValueFrom(
        this.translate.get('deleteButtonTitle'),
      );
      this.showDescriptionText = await lastValueFrom(
        this.translate.get('toggleDescriptionShow'),
      );
      this.hideDescriptionText = await lastValueFrom(
        this.translate.get('toggleDescriptionHide'),
      );
    } catch (error) {
      console.error('Error during translations', error);
    }
  }

  deleteItem(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.item.id);
  }

  toggleDescription(event: Event): void {
    event.stopPropagation();
    this.selectedItemId =
      this.selectedItemId === this.item.id ? null : this.item.id;
  }
}
