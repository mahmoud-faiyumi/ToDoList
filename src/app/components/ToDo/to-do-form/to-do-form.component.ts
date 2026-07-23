import { AfterViewInit, Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category, Priority } from '../../../models/todo.model';
import { StripNgClassesDirective } from '../../../shared/directives/strip-ng-classes.directive';

export interface QuickTaskData {
  text: string;
  priority?: Priority;
  category?: Category;
}

@Component({
  selector: 'app-to-do-form',
  imports: [FormsModule, StripNgClassesDirective],
  templateUrl: './to-do-form.component.html',
  styleUrl: './to-do-form.component.css'
})
export class ToDoFormComponent implements AfterViewInit {
  private readonly taskInput = viewChild<ElementRef<HTMLInputElement>>('taskInput');

  readonly targetColumn = input<string | null>(null);
  readonly toDoAdd = output<QuickTaskData>();

  protected readonly toDoText = signal('');
  protected readonly selectedPriority = signal<Priority | ''>('');
  protected readonly selectedCategory = signal<Category | ''>('');
  protected readonly canSubmit = computed(() => this.toDoText().trim().length > 0);

  protected readonly priorities: { value: Priority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Med' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  protected readonly categories: { value: Category; label: string }[] = [
    { value: 'work', label: 'Work' },
    { value: 'personal', label: 'Personal' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'health', label: 'Health' },
    { value: 'learning', label: 'Learning' },
    { value: 'finance', label: 'Finance' },
    { value: 'travel', label: 'Travel' },
    { value: 'other', label: 'Other' }
  ];

  ngAfterViewInit(): void {
    setTimeout(() => this.taskInput()?.nativeElement.focus(), 80);
  }

  protected onTextChange(value: string): void {
    this.toDoText.set(value);
  }

  protected onTogglePriority(priority: Priority): void {
    this.selectedPriority.update(current => (current === priority ? '' : priority));
  }

  protected onSelectCategory(category: Category): void {
    this.selectedCategory.update(current => (current === category ? '' : category));
  }

  protected onClear(): void {
    this.toDoText.set('');
    this.selectedPriority.set('');
    this.selectedCategory.set('');
    this.taskInput()?.nativeElement.focus();
  }

  protected onAdd(): void {
    const text = this.toDoText().trim();
    if (!text) return;

    const priority = this.selectedPriority();
    const category = this.selectedCategory();

    this.toDoAdd.emit({
      text,
      ...(priority ? { priority } : {}),
      ...(category ? { category } : {})
    });
    this.onClear();
  }
}
