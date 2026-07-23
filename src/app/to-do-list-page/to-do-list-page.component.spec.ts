import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToDoListPageComponent } from './to-do-list-page.component';
import { routes } from '../app.routes';

describe('ToDoListPageComponent', () => {
  let component: ToDoListPageComponent;
  let fixture: ComponentFixture<ToDoListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToDoListPageComponent],
      providers: [provideRouter(routes)]
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
