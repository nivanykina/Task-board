import { Directive, Output, EventEmitter, HostListener } from '@angular/core';

@Directive({
  selector: '[appClick]',
  standalone: true,
})
export class ClickDirective {
  @Output() singleClick = new EventEmitter<Event>();
  @Output() doubleClick = new EventEmitter<Event>();

  private clickCount: number = 0;
  private timeout: ReturnType<typeof setTimeout> | null = null;

  @HostListener('mousedown', ['$event'])
  handleMouseDown(event: Event): void {}

  @HostListener('mouseup', ['$event'])
  handleMouseUp(event: Event): void {}

  @HostListener('dblclick', ['$event'])
  handleDoubleClickEvent(event: Event): void {
    event.stopPropagation();
    this.doubleClick.emit(event);
  }

  @HostListener('click', ['$event'])
  handleClickEvent(event: Event): void {
    event.stopPropagation();
    this.singleClick.emit(event);
  }
}
