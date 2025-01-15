import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskControlPanelComponent } from './task-control-panel.component';

describe('TaskControlPanelComponent', () => {
  let component: TaskControlPanelComponent;
  let fixture: ComponentFixture<TaskControlPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskControlPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskControlPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
