import { Component, OnInit, OnDestroy, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDropListGroup, CdkDragDrop } from '@angular/cdk/drag-drop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BoardColumnComponent } from '../components/board/board-column/board-column.component';
import {
  BoardColumnDef,
  COLUMN_COLOR_OPTIONS,
  COLUMN_ICON_OPTIONS,
  MAX_BOARD_COLUMNS
} from '../models/board-columns';
import { ToDoFormComponent } from '../components/ToDo/to-do-form/to-do-form.component';
import { AdvancedTaskFormComponent } from '../components/ToDo/advanced-task-form/advanced-task-form.component';
import { ModalComponent } from '../shared/modal/modal.component';
import { StripNgClassesDirective } from '../shared/directives/strip-ng-classes.directive';
import { ToDo, Priority, Category } from '../models/todo.model';
import { ToDoStatus } from '../models/enum/todo.enum';
import { ToDoService, Theme } from '../shared/services/to-do.service';
import { getBackgroundWithOpacity } from '../shared/utils/color';

@Component({
  selector: 'app-to-do-list-page',
  imports: [
    FormsModule,
    RouterLink,
    RouterLinkActive,
    CdkDropListGroup,
    BoardColumnComponent,
    ToDoFormComponent,
    AdvancedTaskFormComponent,
    ModalComponent,
    StripNgClassesDirective
  ],
  templateUrl: './to-do-list-page.component.html',
  styleUrls: ['./to-do-list-page.component.css', './board-page.css'],
  host: {
    '(document:keydown)': 'onKeyDown($event)'
  }
})
export class ToDoListPageComponent implements OnInit, OnDestroy {
  private toDoService = inject(ToDoService);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  filteredItems: ToDo[] = [];
  filter: string = 'All';
  searchQuery: string = '';
  isAddOpen: boolean = false;
  isAdvancedAddOpen: boolean = false;
  isEditOpen: boolean = false;
  editTaskId: string | null = null;
  editDraft: ToDo | null = null;
  editDueDateLocal: string = '';
  editTagInput: string = '';
  importMessage: string = '';
  toastMessage: string = '';
  pendingDeleteId: string | null = null;
  pendingAddColumnId: string | null = null;
  readonly editPriorities: { value: Priority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];
  readonly editCategories: { value: Category; label: string }[] = [
    { value: 'work', label: 'Work' },
    { value: 'personal', label: 'Personal' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'health', label: 'Health' },
    { value: 'finance', label: 'Finance' },
    { value: 'learning', label: 'Learning' },
    { value: 'travel', label: 'Travel' },
    { value: 'other', label: 'Other' }
  ];
  selectedTaskIds: Set<string> = new Set();
  isSelectionMode: boolean = false;
  sortBy: 'created' | 'priority' | 'dueDate' = 'created';
  readonly boardColumns = this.toDoService.boardColumns;
  readonly connectedColumnIds = computed(() => this.toDoService.boardColumnIds());
  readonly canAddBoardColumn = this.toDoService.canAddBoardColumn;
  readonly maxBoardColumns = MAX_BOARD_COLUMNS;
  readonly columnIconOptions = COLUMN_ICON_OPTIONS;
  readonly columnColorOptions = COLUMN_COLOR_OPTIONS;
  isColumnCustomizeOpen = false;
  customizeColumnId: string | null = null;
  customizeDraft: { title: string; icon: string; color: string } = {
    title: '',
    icon: 'fa-circle-dot',
    color: '#0d9488'
  };
  columnBuffers: Record<string, ToDo[]> = {};
  filterBy: 'all' | 'overdue' | 'dueToday' | 'highPriority' = 'all';
  presetColors: string[] = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
    '#94a3b8', '#ffffff',
    '#b91c1c', '#fb7185', '#fca5a5',
    '#fdba74', '#fbbf24',
    '#bef264', '#a3e635',
    '#4ade80', '#86efac',
    '#2dd4bf', '#99f6e4',
    '#7dd3fc', '#60a5fa',
    '#818cf8', '#a78bfa',
    '#f0abfc', '#f9a8d4',
    '#d1d5db'
  ];
  presetShapes: NonNullable<ToDo['shape']>[] = ['circle','square','star','triangle','heart','diamond','hexagon'];
  shapeLabels: Record<NonNullable<ToDo['shape']>, string> = {
    circle: 'Note',
    square: 'Pin',
    star: 'Important',
    triangle: 'Warning',
    heart: 'Favorite',
    diamond: 'Idea',
    hexagon: 'Done',
  };
  get toDoItems(): ToDo[] { return this.toDoService.items(); }
  get totalCount(): number { return this.toDoService.totalCount(); }
  get doneCount(): number { return this.toDoService.doneCount(); }
  get activeCount(): number { return this.toDoService.activeCount(); }
  get completionPercent(): number { return this.toDoService.completionPercent(); }
  get currentTheme(): Theme { return this.toDoService.theme(); }
  get selectedCount(): number {
    return this.selectedTaskIds.size;
  }

  isBoardDragDisabled(): boolean {
    return (
      !!this.searchQuery.trim() ||
      this.filterBy !== 'all' ||
      this.filter !== 'All'
    );
  }

  ngOnInit(): void {
    this.ensureColumnBuffers();
    this.loadToDos();
    this.applyFilter();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  private readonly quickFormCategories: readonly Category[] = [
    'work',
    'personal',
    'shopping',
    'health',
    'learning',
    'other'
  ];

  showToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
      this.toastTimer = null;
    }, 2600);
  }

  loadDemoBoard(): void {
    this.toDoService.seedDemoTasks();
    this.applyFilter();
    this.showToast('Sample board loaded');
  }

  onColumnAdd(columnId: string): void {
    this.pendingAddColumnId = this.toDoService.hasBoardColumn(columnId) ? columnId : null;
    this.isAddOpen = true;
  }

  onAddBoardColumn(): void {
    const created = this.toDoService.addBoardColumn();
    if (!created) {
      this.showToast(`Maximum of ${MAX_BOARD_COLUMNS} columns`);
      return;
    }
    this.ensureColumnBuffers();
    this.applyFilter();
    this.onColumnCustomize(created);
    this.showToast('Column added');
  }

  pendingAddColumnTitle(): string | null {
    if (!this.pendingAddColumnId) return null;
    return this.boardColumns().find(col => col.id === this.pendingAddColumnId)?.title ?? null;
  }

  onColumnCustomize(column: BoardColumnDef): void {
    this.customizeColumnId = column.id;
    this.customizeDraft = {
      title: column.title,
      icon: column.icon,
      color: column.color || '#0d9488'
    };
    this.isColumnCustomizeOpen = true;
  }

  closeColumnCustomize(): void {
    this.isColumnCustomizeOpen = false;
    this.customizeColumnId = null;
  }

  selectColumnIcon(icon: string): void {
    this.customizeDraft = { ...this.customizeDraft, icon };
  }

  selectColumnColor(color: string): void {
    this.customizeDraft = { ...this.customizeDraft, color };
  }

  saveColumnCustomize(): void {
    if (!this.customizeColumnId) return;
    const title = this.customizeDraft.title.trim();
    if (!title) {
      this.showToast('Column name is required');
      return;
    }
    this.toDoService.updateBoardColumn(this.customizeColumnId, {
      title,
      icon: this.customizeDraft.icon,
      color: this.customizeDraft.color
    });
    this.closeColumnCustomize();
    this.showToast('Column updated');
  }

  closeAddModal(): void {
    this.isAddOpen = false;
    this.pendingAddColumnId = null;
  }

  toDoAddHandler(taskData: { text: string; priority?: Priority; category?: string }): void {
    const options: Partial<ToDo> = {};
    if (taskData.priority) options.priority = taskData.priority;
    const cat = taskData.category;
    if (cat && this.quickFormCategories.includes(cat as Category)) {
      options.category = cat as Category;
    }
    if (this.pendingAddColumnId) {
      options.boardColumnId = this.pendingAddColumnId;
    }

    this.toDoService.add(taskData.text, options);
    this.pendingAddColumnId = null;
    this.applyFilter();
    this.isAddOpen = false;
    this.showToast('Task added');
  }

  advancedTaskCreated(taskData: Partial<ToDo>): void {
    if (this.pendingAddColumnId && !taskData.boardColumnId) {
      taskData = { ...taskData, boardColumnId: this.pendingAddColumnId };
    }
    this.toDoService.add(taskData.toDoItemText || '', taskData);
    this.pendingAddColumnId = null;
    this.applyFilter();
    this.isAdvancedAddOpen = false;
    this.showToast('Task created');
  }

  createTemplateTask(category: Category): void {
    const templates: Record<string, { toDoItemText: string; category: Category; priority: Priority; color: string }> = {
      work: {
        toDoItemText: 'New work task',
        category: 'work' as Category,
        priority: 'medium' as Priority,
        color: '#0284c7'
      },
      personal: {
        toDoItemText: 'Personal task',
        category: 'personal' as Category,
        priority: 'low' as Priority,
        color: '#0d9488'
      },
      shopping: {
        toDoItemText: 'Shopping item',
        category: 'shopping' as Category,
        priority: 'medium' as Priority,
        color: '#d97706'
      },
      health: {
        toDoItemText: 'Health & wellness',
        category: 'health' as Category,
        priority: 'high' as Priority,
        color: '#dc2626'
      }
    };

    const template = templates[category];
    if (template) {
      this.toDoService.add(template.toDoItemText, template);
      this.applyFilter();
      this.showToast(`${template.category} template added`);
    }
  }

  onEditRequested(item: ToDo): void {
    this.editTaskId = item.id;
    this.editDraft = {
      ...item,
      tags: item.tags ? [...item.tags] : []
    };
    this.editDueDateLocal = item.dueDate
      ? this.toDatetimeLocalValue(item.dueDate)
      : '';
    this.editTagInput = '';
    this.isEditOpen = true;
  }

  cancelEdit(): void {
    this.isEditOpen = false;
    this.editTaskId = null;
    this.editDraft = null;
    this.editDueDateLocal = '';
    this.editTagInput = '';
  }

  saveEdit(): void {
    if (!this.editTaskId || !this.editDraft) return;
    const due = this.editDueDateLocal.trim() ? new Date(this.editDueDateLocal) : undefined;
    const tags = this.editDraft.tags?.filter(t => t.trim()) ?? [];
    const estimatedTime = this.normalizeOptionalMinutes(this.editDraft.estimatedTime);
    const actualTime = this.normalizeOptionalMinutes(this.editDraft.actualTime);
    this.toDoService.editById(this.editTaskId, {
      toDoItemText: this.editDraft.toDoItemText,
      color: this.editDraft.color,
      shape: this.editDraft.shape ?? null,
      notes: this.editDraft.notes,
      priority: this.editDraft.priority,
      category: this.editDraft.category,
      tags,
      dueDate: due,
      estimatedTime,
      actualTime
    });
    this.cancelEdit();
    this.applyFilter();
    this.showToast('Task updated');
  }

  private normalizeOptionalMinutes(value: number | null | undefined): number | undefined {
    if (value === null || value === undefined) return undefined;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }

  private toDatetimeLocalValue(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private currentTaskByEditId(): ToDo | undefined {
    if (!this.editTaskId) return undefined;
    return this.toDoItems.find(t => t.id === this.editTaskId);
  }

  hasEditChanges(): boolean {
    if (!this.editTaskId || !this.editDraft) return false;
    const curr = this.currentTaskByEditId();
    if (!curr) return true;
    const draftTitle = (this.editDraft.toDoItemText || '').trim();
    const currTitle = (curr.toDoItemText || '').trim();
    const currTags = curr.tags ?? [];
    const draftTags = this.editDraft.tags ?? [];
    const tagsEqual =
      currTags.length === draftTags.length && currTags.every((t, i) => t === draftTags[i]);
    const currDue = curr.dueDate?.getTime();
    const draftDue = this.editDueDateLocal.trim()
      ? new Date(this.editDueDateLocal).getTime()
      : undefined;
    const dueEqual = currDue === draftDue || (currDue === undefined && draftDue === undefined);
    return (
      draftTitle !== currTitle ||
      (this.editDraft.color || null) !== (curr.color || null) ||
      (this.editDraft.shape ?? null) !== (curr.shape ?? null) ||
      (this.editDraft.notes || '') !== (curr.notes || '') ||
      this.editDraft.priority !== curr.priority ||
      this.editDraft.category !== curr.category ||
      !tagsEqual ||
      !dueEqual ||
      (this.editDraft.estimatedTime ?? undefined) !== (curr.estimatedTime ?? undefined) ||
      (this.editDraft.actualTime ?? undefined) !== (curr.actualTime ?? undefined)
    );
  }

  addEditTag(): void {
    if (!this.editDraft) return;
    const tag = this.editTagInput.trim();
    if (!tag) return;
    const list = this.editDraft.tags ?? [];
    if (list.includes(tag)) return;
    this.editDraft.tags = [...list, tag];
    this.editTagInput = '';
  }

  removeEditTag(tag: string): void {
    if (!this.editDraft?.tags) return;
    this.editDraft.tags = this.editDraft.tags.filter(t => t !== tag);
  }

  getMinDateForEdit(): string {
    return new Date().toISOString().slice(0, 16);
  }

  applyPresetColor(color: string): void {
    if (!this.editDraft) return;
    this.editDraft.color = color;
  }

  applyPresetShape(shape: NonNullable<ToDo['shape']>): void {
    if (!this.editDraft) return;
    this.editDraft.shape = shape;
  }

  getShapeEmoji(shape: NonNullable<ToDo['shape']>): string {
    switch (shape) {
      case 'circle': return '📝';
      case 'square': return '📌';
      case 'star': return '⭐';
      case 'triangle': return '⚠️';
      case 'heart': return '❤️';
      case 'diamond': return '💡';
      case 'hexagon': return '✅';
    }
  }

  getBackgroundWithOpacity = getBackgroundWithOpacity;

  setFilter(filter: string): void {
    this.filter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    let items = this.toDoItems;

    if (this.searchQuery.trim()) {
      items = this.toDoService.searchItems(this.searchQuery);
    }

    switch (this.filterBy) {
      case 'overdue':
        items = this.toDoService.getOverdueTasks();
        break;
      case 'dueToday':
        items = this.toDoService.getTasksDueToday();
        break;
      case 'highPriority':
        items = this.toDoService
          .filterByPriority('high')
          .concat(this.toDoService.filterByPriority('urgent'));
        break;
    }

    if (this.filter === 'All') {
      this.filteredItems = items;
    } else if (this.filter === 'Active') {
      this.filteredItems = items.filter(
        task => task.status === ToDoStatus.NEW || task.status === ToDoStatus.EDITED
      );
    } else if (this.filter === 'Done') {
      this.filteredItems = items.filter(task => task.status === ToDoStatus.DONE);
    }

    this.syncColumnBuffers();
  }

  private sortTasksInColumn(tasks: ToDo[]): ToDo[] {
    switch (this.sortBy) {
      case 'priority':
        return this.toDoService.sortByPriority(tasks);
      case 'dueDate':
        return this.toDoService.sortByDueDate(tasks);
      case 'created':
      default:
        return this.toDoService.sortByCreated(tasks);
    }
  }

  private syncColumnBuffers(): void {
    this.ensureColumnBuffers();
    for (const col of this.boardColumns()) {
      const inCol = this.filteredItems.filter(t => t.boardColumnId === col.id);
      this.columnBuffers[col.id] = this.sortTasksInColumn([...inCol]);
    }
  }

  private ensureColumnBuffers(): void {
    const next: Record<string, ToDo[]> = {};
    for (const col of this.boardColumns()) {
      next[col.id] = this.columnBuffers[col.id] ?? [];
    }
    this.columnBuffers = next;
  }

  onColumnDrop(event: CdkDragDrop<ToDo[]>): void {
    if (this.isBoardDragDisabled()) {
      return;
    }
    const task = event.item.data as ToDo;
    this.toDoService.moveToColumnAfterDrop(
      task.id,
      event.previousContainer.id,
      event.container.id,
      event.previousIndex,
      event.currentIndex
    );
    this.applyFilter();
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  saveToDos(): void { /* handled by service */ }

  loadToDos(): void { this.applyFilter(); }

  onToggleFromCard(task: ToDo): void {
    this.toDoService.toggleDoneById(task.id);
    this.applyFilter();
    this.showToast(task.status === ToDoStatus.DONE ? 'Task reopened' : 'Task completed');
  }

  onDeleteFromCard(task: ToDo): void {
    this.pendingDeleteId = task.id;
  }

  cancelPendingDelete(): void {
    this.pendingDeleteId = null;
  }

  confirmPendingDelete(): void {
    if (!this.pendingDeleteId) return;
    this.toDoService.deleteById(this.pendingDeleteId);
    this.selectedTaskIds.delete(this.pendingDeleteId);
    this.pendingDeleteId = null;
    this.applyFilter();
    this.showToast('Task deleted');
  }

  toggleTheme(): void {
    this.toDoService.toggleTheme();
  }

  toggleSelectionMode(): void {
    this.isSelectionMode = !this.isSelectionMode;
    if (!this.isSelectionMode) {
      this.selectedTaskIds = new Set();
    }
  }

  toggleTaskSelection(task: ToDo): void {
    const next = new Set(this.selectedTaskIds);
    if (next.has(task.id)) {
      next.delete(task.id);
    } else {
      next.add(task.id);
    }
    this.selectedTaskIds = next;
  }

  selectAll(): void {
    this.selectedTaskIds = new Set(this.filteredItems.map(t => t.id));
  }

  clearSelection(): void {
    this.selectedTaskIds = new Set();
  }

  deleteSelected(): void {
    if (this.selectedCount === 0) return;
    this.toDoService.deleteByIds(Array.from(this.selectedTaskIds));
    this.selectedTaskIds = new Set();
    this.applyFilter();
    this.showToast('Selected tasks deleted');
  }

  exportTasks(): void {
    const json = this.toDoService.exportTasksJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.importMessage = '';
    this.showToast('Export downloaded');
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const result = this.toDoService.importTasksJson(text);
      this.importMessage = result.ok ? 'Import completed successfully.' : result.error;
      this.applyFilter();
      this.showToast(result.ok ? 'Import complete' : 'Import failed');
    };
    reader.readAsText(file);
  }

  isTaskSelected(id: string): boolean {
    return this.selectedTaskIds.has(id);
  }

  setSortBy(sort: 'created' | 'priority' | 'dueDate'): void {
    this.sortBy = sort;
    this.applyFilter();
  }

  setFilterBy(filter: 'all' | 'overdue' | 'dueToday' | 'highPriority'): void {
    this.filterBy = filter;
    this.applyFilter();
  }

  onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing =
      target?.tagName === 'INPUT' ||
      target?.tagName === 'TEXTAREA' ||
      target?.tagName === 'SELECT' ||
      target?.isContentEditable;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n' && !typing) {
      event.preventDefault();
      this.isAddOpen = true;
    }

    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      event.preventDefault();
      this.toggleTheme();
    }

    if (event.key === 'Escape') {
      if (this.pendingDeleteId) {
        this.cancelPendingDelete();
      } else if (this.isSelectionMode) {
        this.toggleSelectionMode();
      } else if (this.isAddOpen) {
        this.isAddOpen = false;
        this.pendingAddColumnId = null;
      } else if (this.isAdvancedAddOpen) {
        this.isAdvancedAddOpen = false;
      } else if (this.isEditOpen) {
        this.cancelEdit();
      }
    }

    if (this.isSelectionMode && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && !typing) {
      event.preventDefault();
      this.selectAll();
    }

    if (this.isSelectionMode && event.key === 'Delete' && this.selectedCount > 0 && !typing) {
      event.preventDefault();
      this.deleteSelected();
    }
  }

  refreshTasks(): void {
    this.loadToDos();
    this.applyFilter();
    this.showToast('Board refreshed');
  }
}
