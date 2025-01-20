import { TooltipDirective } from './tooltip.directive';
import { ElementRef, Renderer2 } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

describe('TooltipDirective', () => {
  let elementRef: ElementRef;
  let renderer: Renderer2;
  let translateService: TranslateService;

  beforeEach(() => {
    elementRef = new ElementRef(document.createElement('div'));
    renderer = jasmine.createSpyObj('Renderer2', [
      'createElement',
      'appendChild',
      'setStyle',
      'setProperty',
    ]);
    translateService = jasmine.createSpyObj('TranslateService', [
      'get',
      'instant',
      'use',
      'setDefaultLang',
    ]);
  });

  it('should create an instance', () => {
    const directive = new TooltipDirective(elementRef, renderer, translateService);
    expect(directive).toBeTruthy();
  });
});
