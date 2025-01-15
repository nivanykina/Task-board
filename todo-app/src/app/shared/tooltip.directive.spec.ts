import { TooltipDirective } from './tooltip.directive';
import { ElementRef, Renderer2 } from '@angular/core';

describe('TooltipDirective', () => {
  let elementRef: ElementRef;
  let renderer: Renderer2;

  beforeEach(() => {
    elementRef = new ElementRef(document.createElement('div'));
    renderer = jasmine.createSpyObj('Renderer2', ['createElement', 'appendChild', 'setStyle', 'setProperty']);
  });

  it('should create an instance', () => {
    const directive = new TooltipDirective(elementRef, renderer);
    expect(directive).toBeTruthy();
  });
});
