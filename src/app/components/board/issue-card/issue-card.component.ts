import { Component, input, output } from '@angular/core';
import { CdkDrag, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import { ToDo, Priority, Category } from '../../../models/todo.model';
import { ToDoStatus } from '../../../models/enum/todo.enum';

@Component({
  selector: 'app-issue-card',
  imports: [CdkDrag, CdkDragPlaceholder],
  templateUrl: './issue-card.component.html',
  styleUrl: './issue-card.component.css'
})
export class IssueCardComponent {
  readonly task = input.required<ToDo>();
  readonly isSelectionMode = input(false);
  readonly selected = input(false);

  readonly edit = output<ToDo>();
  readonly toggleDone = output<ToDo>();
  readonly delete = output<ToDo>();
  readonly selectionChange = output<ToDo>();

  protected readonly ToDoStatus = ToDoStatus;

  protected issueKey(id: string): string {
    const tail = id.replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase();
    return tail.length >= 3 ? `APP-${tail}` : `APP-${id.slice(0, 6).toUpperCase()}`;
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

  protected formatDue(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  protected isOverdue(date: Date): boolean {
    return date < new Date() && this.task().status !== ToDoStatus.DONE;
  }

  protected accentColor(): string | undefined {
    return this.task().color;
  }

  protected onCardClick(event: MouseEvent): void {
    if (!this.isSelectionMode()) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('.issue-card__grip')) {
      return;
    }
    this.selectionChange.emit(this.task());
  }

  protected onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.task());
  }

  protected onToggle(event: Event): void {
    event.stopPropagation();
    this.toggleDone.emit(this.task());
  }

  protected onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.task());
  }
}
