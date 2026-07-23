import { ToDoStatus } from "./enum/todo.enum";

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Category = 'work' | 'personal' | 'shopping' | 'health' | 'finance' | 'learning' | 'travel' | 'other';

export interface ToDo {
    id: string;
    isEditing: boolean;
    toDoItemText: string;
    status: ToDoStatus;
    /** Kanban column id (see BOARD_COLUMNS). */
    boardColumnId: string;
    /** Order within the column (0 = top). */
    boardRank: number;
    color?: string; // hex or CSS color string
    shape?: 'circle' | 'square' | 'star' | 'triangle' | 'heart' | 'diamond' | 'hexagon' | null;
    notes?: string;
    priority?: Priority;
    category?: Category;
    tags?: string[];
    dueDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    estimatedTime?: number; // in minutes
    actualTime?: number; // in minutes
}