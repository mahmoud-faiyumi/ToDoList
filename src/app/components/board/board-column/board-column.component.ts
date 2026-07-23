import { Component, computed, input, output } from '@angular/core';
import { CdkDropList, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BoardColumnDef } from '../../../models/board-columns';
import { ToDo } from '../../../models/todo.model';
import { IssueCardComponent } from '../issue-card/issue-card.component';

@Component({
  selector: 'app-board-column',
  imports: [CdkDropList, IssueCardComponent],
  templateUrl: './board-column.component.html',
  styleUrl: './board-column.component.css'
})
export class BoardColumnComponent {
  readonly column = input.required<BoardColumnDef>();
  readonly tasks = input.required<ToDo[]>();
  readonly connectedTo = input.required<string[]>();
  readonly dropListDisabled = input(false);
  readonly isSelectionMode = input(false);
  readonly selectedIds = input<ReadonlySet<string>>(new Set());

  readonly dropped = output<CdkDragDrop<ToDo[]>>();
  readonly edit = output<ToDo>();
  readonly toggleDone = output<ToDo>();
  readonly delete = output<ToDo>();
  readonly selectionChange = output<ToDo>();
  readonly addRequested = output<string>();
  readonly customizeRequested = output<BoardColumnDef>();

  protected readonly accentColor = computed(() => this.column().color || '#0d9488');

  protected onDrop(event: CdkDragDrop<ToDo[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    this.dropped.emit(event);
  }

  protected isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  protected onAdd(): void {
    this.addRequested.emit(this.column().id);
  }

  protected onCustomize(): void {
    this.customizeRequested.emit(this.column());
  }
}
