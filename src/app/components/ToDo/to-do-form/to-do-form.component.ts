import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-to-do-form',
  imports: [FormsModule],
  templateUrl: './to-do-form.component.html',
  styleUrl: './to-do-form.component.css'
})
export class ToDoFormComponent {
  toDoText: string = '';
  @Output() toDoAdd: EventEmitter<string> = new EventEmitter<string>();
  
  addToDo(): void {
    if (this.toDoText.trim()) {
      this.toDoAdd.emit(this.toDoText);
      this.toDoText = '';
    }
  }
}  
