import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipDirective } from '../../shared/tooltip.directive';
import { ClickDirective } from '../../shared/click.directive';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css'],
  imports: [CommonModule, TooltipDirective, ClickDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  @Input() buttonText?: string;
  @Input() buttonState?: string;
  @Input() saveText: string = 'Save';
  @Input() deleteText: string = 'Delete';
  @Input() addText: string = 'Add';
  @Input() disabled: boolean = false;
  @Input() buttonClasses: { [key: string]: boolean } = {};
  @Input() tooltipText: string = 'Click me!';
  @Output() buttonClick = new EventEmitter<void>();

  onClick() {
    this.buttonClick.emit();
  }
}
