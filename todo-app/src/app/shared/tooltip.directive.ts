import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  Renderer2,
  OnDestroy,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  @Input('appTooltip') tooltipText: string = '';
  private tooltipElement: HTMLElement | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private translate: TranslateService,
  ) {}

  @HostListener('mouseenter') async onMouseEnter() {
    await this.showTooltip();
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.hideTooltip();
  }

  private createTooltip() {
    if (!this.tooltipElement) {
      this.tooltipElement = this.renderer.createElement('span');
      this.renderer.appendChild(document.body, this.tooltipElement);
      this.renderer.addClass(this.tooltipElement, 'tooltip');
    }
  }

  private async setTooltipContent() {
    const message = this.el.nativeElement.disabled
      ? await firstValueFrom(this.translate.get('fillFieldsTooltip'))
      : this.tooltipText;
    const background = this.el.nativeElement.disabled ? '#4242428f' : '#333';
    this.renderer.setStyle(this.tooltipElement, 'background', background);
    this.renderer.setProperty(this.tooltipElement, 'innerText', message);
  }

  private async showTooltip() {
    this.createTooltip();
    await this.setTooltipContent();
    if (this.tooltipElement) {
      this.renderer.setStyle(this.tooltipElement, 'display', 'block');
      const hostPos = this.el.nativeElement.getBoundingClientRect();
      const tooltipPos = this.tooltipElement.getBoundingClientRect();
      const top = hostPos.top - tooltipPos.height - 10 + window.scrollY;
      const left =
        hostPos.left + (hostPos.width - tooltipPos.width) / 2 + window.scrollX;
      this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
      this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
    }
  }

  private hideTooltip() {
    if (this.tooltipElement) {
      this.renderer.setStyle(this.tooltipElement, 'display', 'none');
    }
  }

  ngOnDestroy() {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }
}
