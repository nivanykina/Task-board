import {
  Directive,
  ElementRef,
  Input,
  Renderer2,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Directive({
  selector: '[appToggleClass]',
  standalone: true,
})
export class ToggleClassDirective implements OnChanges {
  @Input() appToggleClass: boolean = false;
  @Input() className: string = '';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appToggleClass']) {
      if (this.appToggleClass) {
        if (!this.el.nativeElement.classList.contains(this.className)) {
          this.renderer.addClass(this.el.nativeElement, this.className);
        }
      } else {
        if (this.el.nativeElement.classList.contains(this.className)) {
          this.renderer.removeClass(this.el.nativeElement, this.className);
        }
      }
    }
  }
}
