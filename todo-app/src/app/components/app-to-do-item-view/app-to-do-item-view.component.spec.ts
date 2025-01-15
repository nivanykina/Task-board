import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppToDoItemViewComponent } from './app-to-do-item-view.component';

describe('AppToDoItemViewComponent', () => {
  let component: AppToDoItemViewComponent;
  let fixture: ComponentFixture<AppToDoItemViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppToDoItemViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppToDoItemViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
