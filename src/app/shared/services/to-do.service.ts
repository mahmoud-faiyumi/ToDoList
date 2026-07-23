import { Injectable, signal, computed, effect } from '@angular/core';
import { ToDo, Priority, Category } from '../../models/todo.model';
import { ToDoStatus } from '../../models/enum/todo.enum';
import {
  BoardColumnDef,
  COLUMN_COLOR_OPTIONS,
  DEFAULT_BOARD_COLUMN_ID,
  DONE_BOARD_COLUMN_ID,
  MAX_BOARD_COLUMNS,
  cloneDefaultBoardColumns,
  createBoardColumnId,
  isAllowedColumnIcon,
  sanitizeBoardColumn
} from '../../models/board-columns';

export type Theme = 'light' | 'dark';

export type BoardColumnPatch = Partial<Pick<BoardColumnDef, 'title' | 'icon' | 'color'>>;

@Injectable({ providedIn: 'root' })
export class ToDoService {
  private readonly storageKey = 'toDoItems';
  private readonly themeKey = 'todoTheme';
  private readonly columnsKey = 'todoBoardColumns';
  private readonly columnsSignal = signal<BoardColumnDef[]>(this.loadColumns());
  private readonly itemsSignal = signal<ToDo[]>(this.loadFromStorage());
  private readonly themeSignal = signal<Theme>(this.loadTheme());

  readonly items = computed(() => this.itemsSignal());
  readonly theme = computed(() => this.themeSignal());
  readonly boardColumns = computed(() => this.columnsSignal());
  readonly boardColumnIds = computed(() => this.columnsSignal().map(col => col.id));
  readonly canAddBoardColumn = computed(() => this.columnsSignal().length < MAX_BOARD_COLUMNS);
  readonly totalCount = computed(() => this.itemsSignal().length);
  readonly doneCount = computed(() => this.itemsSignal().filter(t => t.status === ToDoStatus.DONE).length);
  readonly activeCount = computed(() => this.itemsSignal().filter(t => t.status === ToDoStatus.NEW || t.status === ToDoStatus.EDITED).length);
  readonly completionPercent = computed(() => {
    const total = this.totalCount();
    const done = this.doneCount();
    return total === 0 ? 0 : Math.round((done / total) * 100);
  });

  constructor() {
    // Apply theme on initialization
    effect(() => {
      const currentTheme = this.themeSignal();
      this.applyTheme(currentTheme);
    });

    effect(() => {
      this.saveColumns(this.columnsSignal());
    });
  }

  hasBoardColumn(columnId: string): boolean {
    return this.columnsSignal().some(col => col.id === columnId);
  }

  addBoardColumn(seed?: Partial<Pick<BoardColumnDef, 'title' | 'icon' | 'color'>>): BoardColumnDef | null {
    const cols = this.columnsSignal();
    if (cols.length >= MAX_BOARD_COLUMNS) return null;

    const created = sanitizeBoardColumn({
      id: createBoardColumnId(),
      title: seed?.title?.trim() || 'New column',
      icon: seed?.icon || 'fa-inbox',
      color: seed?.color || '#475569'
    });
    if (!created) return null;

    const doneIdx = cols.findIndex(col => col.id === DONE_BOARD_COLUMN_ID);
    const next = [...cols];
    if (doneIdx >= 0) {
      next.splice(doneIdx, 0, created);
    } else {
      next.push(created);
    }
    this.columnsSignal.set(next.slice(0, MAX_BOARD_COLUMNS));
    return created;
  }

  updateBoardColumn(columnId: string, patch: BoardColumnPatch): void {
    if (!this.hasBoardColumn(columnId)) return;

    const title =
      typeof patch.title === 'string' ? patch.title.trim().slice(0, 40) : undefined;
    const icon =
      typeof patch.icon === 'string' && isAllowedColumnIcon(patch.icon) ? patch.icon : undefined;
    const color =
      typeof patch.color === 'string' &&
      (COLUMN_COLOR_OPTIONS as readonly string[]).includes(patch.color)
        ? patch.color
        : undefined;

    if (title === undefined && icon === undefined && color === undefined) return;

    this.columnsSignal.update(cols =>
      cols.map(col => {
        if (col.id !== columnId) return col;
        return {
          ...col,
          ...(title !== undefined && title.length > 0 ? { title } : {}),
          ...(icon !== undefined ? { icon } : {}),
          ...(color !== undefined ? { color } : {})
        };
      })
    );
  }

  resetBoardColumns(): void {
    this.columnsSignal.set(cloneDefaultBoardColumns());
  }

  toggleTheme(): void {
    const newTheme = this.themeSignal() === 'light' ? 'dark' : 'light';
    this.themeSignal.set(newTheme);
    this.saveTheme(newTheme);
  }

  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
    this.saveTheme(theme);
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  private loadTheme(): Theme {
    try {
      const saved = localStorage.getItem(this.themeKey);
      return (saved === 'dark' || saved === 'light') ? saved : 'light';
    } catch {
      return 'light';
    }
  }

  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.themeKey, theme);
    } catch {
      // ignore
    }
  }

  add(text: string, options?: Partial<ToDo>): void {
    const now = new Date();
    const col =
      options?.boardColumnId && this.hasBoardColumn(options.boardColumnId)
        ? options.boardColumnId
        : DEFAULT_BOARD_COLUMN_ID;
    const inCol = this.itemsSignal().filter(t => t.boardColumnId === col);
    const nextRank =
      options?.boardRank !== undefined
        ? options.boardRank
        : inCol.length === 0
          ? 0
          : Math.max(...inCol.map(t => t.boardRank), -1) + 1;

    const { boardColumnId: _omitCol, boardRank: _omitRank, ...rest } = options ?? {};
    const newTask: ToDo = {
      id: this.generateId(),
      toDoItemText: text,
      status: ToDoStatus.NEW,
      isEditing: false,
      createdAt: now,
      updatedAt: now,
      boardColumnId: col,
      boardRank: nextRank,
      ...rest
    };
    const next: ToDo[] = [...this.itemsSignal(), newTask];
    this.update(this.normalizeBoardRanks(next));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private findIndexById(id: string): number {
    return this.itemsSignal().findIndex(item => item.id === id);
  }

  edit(index: number, draft: Partial<ToDo>): void {
    const items = [...this.itemsSignal()];
    const target = items[index];
    if (!target) return;
    items[index] = this.mergeTaskEdit(target, draft);
    this.update(items);
  }

  editById(id: string, draft: Partial<ToDo>): void {
    const index = this.findIndexById(id);
    if (index === -1) return;
    this.edit(index, draft);
  }

  private mergeTaskEdit(target: ToDo, draft: Partial<ToDo>): ToDo {
    return {
      ...target,
      toDoItemText: draft.toDoItemText !== undefined ? (draft.toDoItemText.trim() || 'Untitled task') : target.toDoItemText,
      color: draft.color !== undefined ? draft.color : target.color,
      shape: draft.shape !== undefined ? draft.shape : target.shape,
      notes: draft.notes !== undefined ? draft.notes : target.notes,
      priority: draft.priority !== undefined ? draft.priority : target.priority,
      category: draft.category !== undefined ? draft.category : target.category,
      tags: 'tags' in draft ? (draft.tags?.length ? draft.tags : undefined) : target.tags,
      dueDate: 'dueDate' in draft ? draft.dueDate : target.dueDate,
      estimatedTime: 'estimatedTime' in draft ? draft.estimatedTime : target.estimatedTime,
      actualTime: 'actualTime' in draft ? draft.actualTime : target.actualTime,
      boardColumnId:
        'boardColumnId' in draft && draft.boardColumnId && this.hasBoardColumn(draft.boardColumnId)
          ? draft.boardColumnId
          : target.boardColumnId,
      boardRank: 'boardRank' in draft && draft.boardRank !== undefined ? draft.boardRank : target.boardRank,
      status: ToDoStatus.EDITED,
      updatedAt: new Date()
    };
  }

  toggleDone(index: number): void {
    const items = [...this.itemsSignal()];
    const target = items[index];
    if (!target) return;
    this.applyToggleDone(target);
    this.update(this.normalizeBoardRanks(items));
  }

  toggleDoneById(id: string): void {
    const items = [...this.itemsSignal()];
    const target = items.find(item => item.id === id);
    if (!target) return;
    this.applyToggleDone(target);
    this.update(this.normalizeBoardRanks(items));
  }

  private applyToggleDone(target: ToDo): void {
    const wasDone = target.status === ToDoStatus.DONE;
    target.status = wasDone ? ToDoStatus.NEW : ToDoStatus.DONE;
    target.updatedAt = new Date();
    if (!wasDone) {
      target.completedAt = new Date();
      target.boardColumnId = DONE_BOARD_COLUMN_ID;
    } else {
      target.completedAt = undefined;
      target.boardColumnId = DEFAULT_BOARD_COLUMN_ID;
    }
  }

  delete(index: number): void {
    const items = [...this.itemsSignal()];
    items.splice(index, 1);
    this.update(items);
  }

  deleteById(id: string): void {
    const next = this.itemsSignal().filter(item => item.id !== id);
    if (next.length === this.itemsSignal().length) return;
    this.update(this.normalizeBoardRanks(next));
  }

  /** Removes all tasks whose id is in the set. Safe when ids are missing. */
  deleteByIds(ids: string[]): void {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const next = this.itemsSignal().filter(item => !idSet.has(item.id));
    this.update(this.normalizeBoardRanks(next));
  }

  deleteMultiple(indices: number[]): void {
    const items = [...this.itemsSignal()];
    indices.sort((a, b) => b - a).forEach(index => {
      if (index >= 0 && index < items.length) {
        items.splice(index, 1);
      }
    });
    this.update(items);
  }

  move(previousIndex: number, currentIndex: number): void {
    if (previousIndex === currentIndex) return;
    const items = [...this.itemsSignal()];
    const [moved] = items.splice(previousIndex, 1);
    items.splice(currentIndex, 0, moved);
    this.update(items);
  }

  moveById(movedId: string, targetId: string): void {
    if (movedId === targetId) return;
    const items = [...this.itemsSignal()];
    const movedIndex = items.findIndex(item => item.id === movedId);
    const targetIndex = items.findIndex(item => item.id === targetId);
    if (movedIndex === -1 || targetIndex === -1) return;
    const [moved] = items.splice(movedIndex, 1);
    items.splice(targetIndex, 0, moved);
    this.update(items);
  }

  setAll(items: ToDo[]): void {
    this.update(this.normalizeBoardRanks(items));
  }

  /** Tasks in a column, top to bottom. */
  getColumnTasks(columnId: string): ToDo[] {
    return this.itemsSignal()
      .filter(t => t.boardColumnId === columnId)
      .sort(
        (a, b) =>
          a.boardRank - b.boardRank ||
          a.createdAt.getTime() - b.createdAt.getTime()
      );
  }

  /** After CDK reorder within the same column. */
  reorderWithinColumn(columnId: string, previousIndex: number, currentIndex: number): void {
    if (previousIndex === currentIndex) return;
    const ids = this.getColumnTasks(columnId).map(t => t.id);
    const [moved] = ids.splice(previousIndex, 1);
    ids.splice(currentIndex, 0, moved);
    this.applyColumnOrder(columnId, ids);
  }

  /**
   * After CDK transfer to another column (caller updates UI arrays separately or relies on service refresh).
   * Indices match `getColumnTasks(columnId)` order before the move.
   */
  moveToColumnAfterDrop(
    taskId: string,
    fromColumnId: string,
    toColumnId: string,
    previousIndex: number,
    currentIndex: number
  ): void {
    if (!this.hasBoardColumn(fromColumnId) || !this.hasBoardColumn(toColumnId)) {
      return;
    }
    if (fromColumnId === toColumnId) {
      this.reorderWithinColumn(fromColumnId, previousIndex, currentIndex);
      return;
    }

    const fromIds = this.getColumnTasks(fromColumnId).map(t => t.id);
    const toIds = this.getColumnTasks(toColumnId).map(t => t.id);
    fromIds.splice(previousIndex, 1);
    toIds.splice(currentIndex, 0, taskId);

    const now = new Date();
    const items = this.itemsSignal().map(t => {
      if (t.id !== taskId) return t;
      const moved: ToDo = {
        ...t,
        boardColumnId: toColumnId,
        updatedAt: now
      };
      if (toColumnId === DONE_BOARD_COLUMN_ID) {
        moved.status = ToDoStatus.DONE;
        moved.completedAt = now;
      } else if (fromColumnId === DONE_BOARD_COLUMN_ID) {
        moved.status = ToDoStatus.NEW;
        moved.completedAt = undefined;
      }
      return moved;
    });
    this.itemsSignal.set(items);
    this.applyColumnOrder(fromColumnId, fromIds);
    this.applyColumnOrder(toColumnId, toIds);
  }

  /** Seeds a few sample tasks when the board is empty. */
  seedDemoTasks(): void {
    if (this.itemsSignal().length > 0) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    const todayEvening = new Date();
    todayEvening.setHours(18, 30, 0, 0);

    this.add('Review sprint goals', {
      priority: 'high',
      category: 'work',
      color: '#0d9488',
      shape: 'star',
      dueDate: tomorrow,
      tags: ['planning'],
      boardColumnId: 'todo',
      notes: 'Align with the team on priorities for the week.'
    });
    this.add('Draft weekly status update', {
      priority: 'medium',
      category: 'work',
      color: '#0284c7',
      shape: 'circle',
      boardColumnId: 'in_progress',
      tags: ['comms'],
      estimatedTime: 45
    });
    this.add('Grocery run', {
      priority: 'low',
      category: 'shopping',
      color: '#d97706',
      shape: 'square',
      dueDate: todayEvening,
      boardColumnId: 'todo',
      tags: ['errands']
    });
    this.add('30-minute walk', {
      priority: 'medium',
      category: 'health',
      color: '#059669',
      shape: 'heart',
      boardColumnId: 'done',
      status: ToDoStatus.DONE,
      completedAt: new Date()
    });
  }

  private applyColumnOrder(columnId: string, orderedIds: string[]): void {
    const rankMap = new Map(orderedIds.map((id, i) => [id, i]));
    const next = this.itemsSignal().map(t => {
      if (t.boardColumnId === columnId && rankMap.has(t.id)) {
        return { ...t, boardRank: rankMap.get(t.id)! };
      }
      return t;
    });
    this.update(next);
  }

  /** Fix unknown columns and sequential ranks per column. */
  private normalizeBoardRanks(items: ToDo[]): ToDo[] {
    const columnIds = this.boardColumnIds();
    const next = items.map(t => ({ ...t }));
    for (let i = 0; i < next.length; i++) {
      if (!this.hasBoardColumn(next[i].boardColumnId)) {
        next[i] = { ...next[i], boardColumnId: DEFAULT_BOARD_COLUMN_ID };
      }
    }
    for (const colId of columnIds) {
      const inCol = next
        .filter(t => t.boardColumnId === colId)
        .sort(
          (a, b) =>
            a.boardRank - b.boardRank ||
            a.createdAt.getTime() - b.createdAt.getTime()
        );
      inCol.forEach((t, rank) => {
        const idx = next.findIndex(x => x.id === t.id);
        if (idx !== -1) {
          next[idx] = { ...next[idx], boardColumnId: colId, boardRank: rank };
        }
      });
    }
    return next;
  }

  exportTasksJson(): string {
    return JSON.stringify(this.itemsSignal());
  }

  importTasksJson(json: string): { ok: true } | { ok: false; error: string } {
    try {
      const parsed = JSON.parse(json) as unknown;
      if (!Array.isArray(parsed)) {
        return { ok: false, error: 'File must contain a JSON array of tasks.' };
      }
      const items = parsed.map((item: unknown) => this.migrateTask(item));
      this.update(items);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Could not parse JSON.' };
    }
  }

  searchItems(query: string): ToDo[] {
    if (!query.trim()) return this.itemsSignal();
    const lowercaseQuery = query.toLowerCase();
    return this.itemsSignal().filter(item => 
      item.toDoItemText.toLowerCase().includes(lowercaseQuery) ||
      (item.notes && item.notes.toLowerCase().includes(lowercaseQuery)) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
    );
  }

  filterByCategory(category: Category): ToDo[] {
    return this.itemsSignal().filter(item => item.category === category);
  }

  filterByPriority(priority: Priority): ToDo[] {
    return this.itemsSignal().filter(item => item.priority === priority);
  }

  filterByDueDate(overdue: boolean = false): ToDo[] {
    const now = new Date();
    return this.itemsSignal().filter(item => {
      if (!item.dueDate) return false;
      return overdue ? item.dueDate < now : item.dueDate >= now;
    });
  }

  sortByPriority(items: ToDo[]): ToDo[] {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return [...items].sort((a, b) => {
      const aPriority = a.priority ? priorityOrder[a.priority] : 0;
      const bPriority = b.priority ? priorityOrder[b.priority] : 0;
      return bPriority - aPriority;
    });
  }

  sortByDueDate(items: ToDo[]): ToDo[] {
    return [...items].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }

  sortByCreated(items: ToDo[]): ToDo[] {
    return [...items].sort((a, b) => {
      const aTime = a.createdAt ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });
  }

  getOverdueTasks(): ToDo[] {
    const now = new Date();
    return this.itemsSignal().filter(item => 
      item.dueDate && item.dueDate < now && item.status !== ToDoStatus.DONE
    );
  }

  getTasksDueToday(): ToDo[] {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    return this.itemsSignal().filter(item => 
      item.dueDate && 
      item.dueDate >= startOfDay && 
      item.dueDate <= today && 
      item.status !== ToDoStatus.DONE
    );
  }

  getProductivityStats(): { 
    totalTasks: number; 
    completedTasks: number; 
    overdueTasks: number; 
    dueToday: number;
    averageCompletionTime: number;
  } {
    const items = this.itemsSignal();
    const completed = items.filter(item => item.status === ToDoStatus.DONE);
    const overdue = this.getOverdueTasks().length;
    const dueToday = this.getTasksDueToday().length;
    
    const completionTimes = completed
      .filter(item => item.completedAt && item.createdAt)
      .map(item => item.completedAt!.getTime() - item.createdAt.getTime());
    
    const averageCompletionTime = completionTimes.length > 0 
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;

    return {
      totalTasks: items.length,
      completedTasks: completed.length,
      overdueTasks: overdue,
      dueToday: dueToday,
      averageCompletionTime: averageCompletionTime
    };
  }

  private update(next: ToDo[]): void {
    this.itemsSignal.set(next);
    this.saveToStorage(next);
  }

  private loadFromStorage(): ToDo[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as any[];
      if (!Array.isArray(parsed)) return [];
      // Migrate existing tasks to have new fields
      return this.normalizeBoardRanks(parsed.map(item => this.migrateTask(item)));
    } catch {
      return [];
    }
  }

  private migrateTask(item: any): ToDo {
    const now = new Date();
    const status = item.status || ToDoStatus.NEW;
    let boardColumnId =
      typeof item.boardColumnId === 'string' ? item.boardColumnId : '';
    const boardRank =
      typeof item.boardRank === 'number' && Number.isFinite(item.boardRank)
        ? item.boardRank
        : 0;

    if (!this.hasBoardColumn(boardColumnId)) {
      if (status === ToDoStatus.DONE) {
        boardColumnId = DONE_BOARD_COLUMN_ID;
      } else {
        boardColumnId = DEFAULT_BOARD_COLUMN_ID;
      }
    }

    return {
      id: item.id || this.generateId(),
      isEditing: item.isEditing || false,
      toDoItemText: item.toDoItemText || '',
      status,
      boardColumnId,
      boardRank,
      color: item.color,
      shape: item.shape,
      notes: item.notes,
      priority: item.priority,
      category: item.category,
      tags: item.tags,
      dueDate: item.dueDate ? new Date(item.dueDate as string) : undefined,
      createdAt: item.createdAt ? new Date(item.createdAt as string) : now,
      updatedAt: item.updatedAt ? new Date(item.updatedAt as string) : now,
      completedAt: item.completedAt ? new Date(item.completedAt as string) : undefined,
      estimatedTime: item.estimatedTime,
      actualTime: item.actualTime
    };
  }

  private saveToStorage(items: ToDo[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch {
      // ignore
    }
  }

  private loadColumns(): BoardColumnDef[] {
    const defaults = cloneDefaultBoardColumns();
    try {
      const raw = localStorage.getItem(this.columnsKey);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return defaults;

      const loaded: BoardColumnDef[] = [];
      const seen = new Set<string>();

      for (const entry of parsed) {
        if (loaded.length >= MAX_BOARD_COLUMNS) break;
        if (!entry || typeof entry !== 'object') continue;
        const fallback = defaults.find(col => col.id === (entry as BoardColumnDef).id);
        const sanitized = sanitizeBoardColumn(entry as Partial<BoardColumnDef>, fallback);
        if (!sanitized || seen.has(sanitized.id)) continue;
        seen.add(sanitized.id);
        loaded.push(sanitized);
      }

      if (loaded.length === 0) return defaults;

      // Keep core columns present so status sync / defaults stay reliable.
      for (const core of defaults) {
        if (loaded.length >= MAX_BOARD_COLUMNS) break;
        if (!seen.has(core.id)) {
          loaded.push(core);
          seen.add(core.id);
        }
      }

      // Prefer Done at the end when present.
      const done = loaded.find(col => col.id === DONE_BOARD_COLUMN_ID);
      const rest = loaded.filter(col => col.id !== DONE_BOARD_COLUMN_ID);
      return done ? [...rest, done].slice(0, MAX_BOARD_COLUMNS) : loaded.slice(0, MAX_BOARD_COLUMNS);
    } catch {
      return defaults;
    }
  }

  private saveColumns(columns: BoardColumnDef[]): void {
    try {
      localStorage.setItem(this.columnsKey, JSON.stringify(columns));
    } catch {
      // ignore
    }
  }
}