import { ToggleClassDirective } from './toggle-class.directive';
import { ElementRef, Renderer2 } from '@angular/core';

describe('ToggleClassDirective', () => {
  it('should create an instance', () => {
    const elementRefMock = {} as ElementRef;
    const rendererMock = {} as Renderer2;
    const directive = new ToggleClassDirective(elementRefMock, rendererMock);
    expect(directive).toBeTruthy();
  });
});
