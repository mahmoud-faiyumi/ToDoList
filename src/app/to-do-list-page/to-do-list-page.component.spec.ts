import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToDoListPageComponent } from './to-do-list-page.component';

describe('ToDoListPageComponent', () => {
  let component: ToDoListPageComponent;
  let fixture: ComponentFixture<ToDoListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToDoListPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToDoListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
