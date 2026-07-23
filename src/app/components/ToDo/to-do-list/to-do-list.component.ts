import { Component, input, output } from '@angular/core';
import { ToDo, Priority, Category } from '../../../models/todo.model';
import { getBackgroundWithOpacity } from '../../../shared/utils/color';
import { ToDoStatus } from '../../../models/enum/todo.enum';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-to-do-list',
  imports: [FormsModule, DragDropModule],
  templateUrl: './to-do-list.component.html',
  styleUrl: './to-do-list.component.css'
})
export class ToDoListComponent {
  readonly toDoItems = input<ToDo[]>([]);
  readonly editingActive = input(false);
  readonly isSelectionMode = input(false);
  readonly selectedItems = input<Set<number>>(new Set());
  readonly viewMode = input<'list' | 'grid'>('list');

  readonly editRequested = output<{ index: number; item: ToDo }>();
  readonly toggleRequested = output<number>();
  readonly deleteRequested = output<number>();
  readonly reorderRequested = output<{ previousIndex: number; currentIndex: number }>();
  readonly itemSelected = output<number>();

  protected readonly ToDoStatus = ToDoStatus;

  protected toggleDone(index: number): void {
    this.toggleRequested.emit(index);
  }

  protected editItem(index: number): void {
    this.editRequested.emit({ index, item: this.toDoItems()[index] });
  }

  protected saveItem(index: number): void {
    this.editRequested.emit({ index, item: this.toDoItems()[index] });
  }

  protected deleteItem(index: number): void {
    this.deleteRequested.emit(index);
  }

  protected isItemEmpty(_toDo: ToDo): boolean {
    return false;
  }

  protected areAllItemsEmpty(): boolean {
    return this.toDoItems().every(item => this.isItemEmpty(item));
  }

  protected getShapeSymbol(shape: ToDo['shape']): string {
    switch (shape) {
      case 'circle':
        return '📝';
      case 'square':
        return '📌';
      case 'star':
        return '⭐';
      case 'triangle':
        return '⚠️';
      case 'heart':
        return '❤️';
      case 'diamond':
        return '💡';
      case 'hexagon':
        return '✅';
      default:
        return '';
    }
  }

  protected readonly getBackgroundWithOpacity = getBackgroundWithOpacity;

  protected drop(event: CdkDragDrop<ToDo[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.reorderRequested.emit({ previousIndex: event.previousIndex, currentIndex: event.currentIndex });
  }

  protected onDragStarted(_event: unknown): void {}

  protected onDragEnded(_event: unknown): void {}

  protected onItemSelect(index: number): void {
    if (this.isSelectionMode()) {
      this.itemSelected.emit(index);
    }
  }

  protected onItemClick(index: number, event: Event): void {
    if (!this.isSelectionMode()) {
      const target = event.target as HTMLElement;
      if (target.closest('.drag-handle')) {
        return;
      }
    } else {
      this.onItemSelect(index);
    }
  }

  protected isItemSelected(index: number): boolean {
    return this.selectedItems().has(index);
  }

  protected getPriorityIcon(priority: Priority): string {
    const icons: Record<Priority, string> = {
      urgent: 'fa-exclamation',
      high: 'fa-arrow-up',
      medium: 'fa-minus',
      low: 'fa-arrow-down'
    };
    return icons[priority];
  }

  protected getCategoryIcon(category: Category): string {
    const icons: Record<Category, string> = {
      work: 'fa-briefcase',
      personal: 'fa-user',
      shopping: 'fa-shopping-cart',
      health: 'fa-heart',
      finance: 'fa-dollar-sign',
      learning: 'fa-graduation-cap',
      travel: 'fa-plane',
      other: 'fa-ellipsis-h'
    };
    return icons[category];
  }

  protected formatDate(date: Date): string {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    }).format(date);
  }

  protected isOverdue(date: Date): boolean {
    return date < new Date();
  }
}
