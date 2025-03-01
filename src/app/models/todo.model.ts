import { ToDoStatus } from "./enum/todo.enum";

export interface ToDo {
    isEditing: boolean;
    toDoItemText: string;
    status: ToDoStatus;
}