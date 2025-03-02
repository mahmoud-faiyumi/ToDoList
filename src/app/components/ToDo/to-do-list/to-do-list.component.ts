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

  constructor() {
    this.loadToDoItems();
  }

  private loadToDoItems(): void {
    const savedItems = localStorage.getItem('toDoItems');

    if (savedItems) {
      this.toDoItems = JSON.parse(savedItems);
    } else {
      this.toDoItems = [
        { toDoItemText: 'Welcome to your To-Do List!', status: ToDoStatus.NEW, isEditing: false },
        { toDoItemText: 'Click an item to edit or mark it as done.', status: ToDoStatus.NEW, isEditing: false },
        { toDoItemText: 'Use the filter buttons to organize your tasks.', status: ToDoStatus.NEW, isEditing: false }
      ];
      this.saveToLocalStorage();
    }
  }

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

  getStatusIcon(status: ToDoStatus): string {
    const iconMap: { [key in ToDoStatus]: string } = {
      [ToDoStatus.NEW]: 'fa-solid fa-plus-circle text-primary',
      [ToDoStatus.DONE]: 'fa-solid fa-check text-success',
      [ToDoStatus.EDITED]: 'fa-solid fa-pen text-warning',
      [ToDoStatus.RESTORED]: 'fa-solid fa-undo text-info'
    };
  
    return iconMap[status] || 'fa-solid fa-question-circle text-secondary'; // Default icon if status is undefined
  }  
}