import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ToDo } from '../../../models/todo.model';
import { ToDoStatus } from '../../../models/enum/todo.enum';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-to-do-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './to-do-list.component.html',
  styleUrl: './to-do-list.component.css'
})
export class ToDoListComponent {
  @Input() toDoItems: ToDo[] = [];
  ToDoStatus = ToDoStatus;

  restoreItem(index: number): void {
    this.toDoItems[index].status = ToDoStatus.RESTORED;
    this.saveToLocalStorage();
  }

  removeItem(index: number): void {
    this.toDoItems[index].status = ToDoStatus.DONE;
    this.saveToLocalStorage();
  }

  editItem(index: number): void {
    this.toDoItems[index].isEditing = true;
  }

  saveItem(index: number): void {
    this.toDoItems[index].isEditing = false;
    this.toDoItems[index].status = ToDoStatus.EDITED;
    this.saveToLocalStorage();
  }

  deleteItem(index: number): void {
    this.toDoItems.splice(index, 1);
    this.saveToLocalStorage();
  }

  isItemEmpty(toDo: ToDo): boolean {
    return !toDo.toDoItemText || toDo.toDoItemText.trim() === '';
  }

  areAllItemsEmpty(): boolean {
    return this.toDoItems.every(item => this.isItemEmpty(item));
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('toDoItems', JSON.stringify(this.toDoItems));
  }
}