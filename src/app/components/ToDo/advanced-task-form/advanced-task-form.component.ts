import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToDo, Priority, Category } from '../../../models/todo.model';
import { StripNgClassesDirective } from '../../../shared/directives/strip-ng-classes.directive';

@Component({
  selector: 'app-advanced-task-form',
  imports: [FormsModule, StripNgClassesDirective],
  templateUrl: './advanced-task-form.component.html',
  styleUrl: './advanced-task-form.component.css'
})
export class AdvancedTaskFormComponent {
  readonly targetColumn = input<string | null>(null);
  readonly taskCreated = output<Partial<ToDo>>();

  protected readonly taskText = signal('');
  protected readonly notes = signal('');
  protected readonly priority = signal<Priority>('medium');
  protected readonly category = signal<Category>('personal');
  protected readonly tags = signal<string[]>([]);
  protected readonly newTag = signal('');
  protected readonly dueDate = signal('');
  protected readonly estimatedTime = signal(30);
  protected readonly color = signal('#0d9488');
  protected readonly shape = signal<NonNullable<ToDo['shape']>>('circle');

  protected readonly canSubmit = computed(() => this.taskText().trim().length > 0);
  protected readonly titleLength = computed(() => this.taskText().length);
  protected readonly previewTitle = computed(() => this.taskText().trim() || 'Untitled task');
  protected readonly selectedPriority = computed(
    () => this.priorities.find(p => p.value === this.priority()) ?? this.priorities[1]
  );
  protected readonly selectedCategory = computed(
    () => this.categories.find(c => c.value === this.category()) ?? this.categories[1]
  );
  protected readonly selectedShape = computed(
    () => this.shapes.find(s => s.value === this.shape()) ?? this.shapes[0]
  );
  protected readonly previewDueLabel = computed(() => {
    const raw = this.dueDate();
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  });
  protected readonly completeness = computed(() => {
    let score = 0;
    if (this.taskText().trim()) score += 40;
    if (this.notes().trim()) score += 15;
    if (this.dueDate()) score += 15;
    if (this.tags().length > 0) score += 10;
    if (this.estimatedTime() > 0) score += 10;
    score += 10; // priority + category always chosen
    return Math.min(100, score);
  });
  protected readonly completenessLabel = computed(() => {
    const value = this.completeness();
    if (value >= 90) return 'Polished';
    if (value >= 55) return 'Looking good';
    if (value >= 40) return 'Getting there';
    return 'Start with a title';
  });
  protected readonly suggestedTags = computed(() => {
    const existing = new Set(this.tags().map(tag => tag.toLowerCase()));
    return this.tagSuggestions.filter(tag => !existing.has(tag.toLowerCase())).slice(0, 5);
  });
  protected readonly minDueDate = new Date().toISOString().slice(0, 16);
  protected readonly estimatePresets = [15, 30, 60, 120] as const;
  protected readonly tagSuggestions = ['focus', 'blocked', 'follow-up', 'deep-work', 'errand'];

  protected readonly priorities: { value: Priority; label: string; icon: string; color: string }[] = [
    { value: 'low', label: 'Low', icon: 'fa-arrow-down', color: '#059669' },
    { value: 'medium', label: 'Med', icon: 'fa-minus', color: '#d97706' },
    { value: 'high', label: 'High', icon: 'fa-arrow-up', color: '#dc2626' },
    { value: 'urgent', label: 'Urgent', icon: 'fa-bolt', color: '#be123c' }
  ];

  protected readonly categories: { value: Category; label: string; icon: string }[] = [
    { value: 'work', label: 'Work', icon: 'fa-briefcase' },
    { value: 'personal', label: 'Personal', icon: 'fa-user' },
    { value: 'shopping', label: 'Shopping', icon: 'fa-shopping-cart' },
    { value: 'health', label: 'Health', icon: 'fa-heart' },
    { value: 'finance', label: 'Finance', icon: 'fa-dollar-sign' },
    { value: 'learning', label: 'Learning', icon: 'fa-graduation-cap' },
    { value: 'travel', label: 'Travel', icon: 'fa-plane' },
    { value: 'other', label: 'Other', icon: 'fa-ellipsis-h' }
  ];

  protected readonly shapes: { value: NonNullable<ToDo['shape']>; label: string; emoji: string }[] = [
    { value: 'circle', label: 'Note', emoji: '📝' },
    { value: 'square', label: 'Pin', emoji: '📌' },
    { value: 'star', label: 'Important', emoji: '⭐' },
    { value: 'triangle', label: 'Warning', emoji: '⚠️' },
    { value: 'heart', label: 'Favorite', emoji: '❤️' },
    { value: 'diamond', label: 'Idea', emoji: '💡' },
    { value: 'hexagon', label: 'Done', emoji: '✅' }
  ];

  protected readonly presetColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#0284c7', '#0d9488',
    '#4f46e5', '#7c3aed', '#ec4899', '#f43f5e'
  ] as const;

  protected onSetEstimate(minutes: number): void {
    this.estimatedTime.set(minutes);
  }

  protected onClearDue(): void {
    this.dueDate.set('');
  }

  protected onAddSuggestedTag(tag: string): void {
    if (this.tags().includes(tag)) return;
    this.tags.update(list => [...list, tag]);
  }

  protected onAddTag(): void {
    const tag = this.newTag().trim();
    if (!tag || this.tags().includes(tag)) return;
    this.tags.update(list => [...list, tag]);
    this.newTag.set('');
  }

  protected onRemoveTag(tag: string): void {
    this.tags.update(list => list.filter(item => item !== tag));
  }

  protected onCreate(): void {
    const text = this.taskText().trim();
    if (!text) return;

    const due = this.dueDate();
    const tagList = this.tags();

    this.taskCreated.emit({
      toDoItemText: text,
      notes: this.notes().trim() || undefined,
      priority: this.priority(),
      category: this.category(),
      tags: tagList.length > 0 ? tagList : undefined,
      dueDate: due ? new Date(due) : undefined,
      estimatedTime: this.estimatedTime(),
      color: this.color(),
      shape: this.shape()
    });
    this.resetForm();
  }

  private resetForm(): void {
    this.taskText.set('');
    this.notes.set('');
    this.priority.set('medium');
    this.category.set('personal');
    this.tags.set([]);
    this.newTag.set('');
    this.dueDate.set('');
    this.estimatedTime.set(30);
    this.color.set('#0d9488');
    this.shape.set('circle');
  }
}
