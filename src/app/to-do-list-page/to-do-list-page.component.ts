import { Component, OnInit } from '@angular/core';
import { ToDoListComponent } from '../components/ToDo/to-do-list/to-do-list.component';
import { ToDoFormComponent } from '../components/ToDo/to-do-form/to-do-form.component';
import { ToDo } from '../models/todo.model';
import { ToDoStatus } from '../models/enum/todo.enum';

@Component({
  selector: 'app-to-do-list-page',
  imports: [ToDoListComponent, ToDoFormComponent],
  templateUrl: './to-do-list-page.component.html',
  styleUrl: './to-do-list-page.component.css'
})
export class ToDoListPageComponent implements OnInit {
  toDoItems: ToDo[] = [];
  filteredItems: ToDo[] = [];
  filter: string = 'All';

  constructor() {}

  ngOnInit(): void {
    this.loadToDos();
    this.applyFilter();
  }

  toDoAddHandler(item: string): void {
    const newTask: ToDo = { toDoItemText: item, status: ToDoStatus.NEW, isEditing: false };
    this.toDoItems.push(newTask);
    this.saveToDos();
    this.applyFilter();
  }

  setFilter(filter: string): void {
    this.filter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.filter === 'All') {
      this.filteredItems = this.toDoItems;
    } else if (this.filter === 'Active') {
      this.filteredItems = this.toDoItems.filter(task => task.status === ToDoStatus.NEW || task.status === ToDoStatus.EDITED);
    } else if (this.filter === 'Done') {
      this.filteredItems = this.toDoItems.filter(task => task.status === ToDoStatus.DONE);
    }
  }

  saveToDos(): void {
    localStorage.setItem('toDoItems', JSON.stringify(this.toDoItems));
  }

  loadToDos(): void {
    const savedToDos = localStorage.getItem('toDoItems');
    if (savedToDos) {
      this.toDoItems = JSON.parse(savedToDos);
    }
    this.applyFilter();
  }
}