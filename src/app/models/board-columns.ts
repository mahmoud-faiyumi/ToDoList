export interface BoardColumnDef {
  id: string;
  title: string;
  icon: string;
  color?: string;
}

export const MAX_BOARD_COLUMNS = 5;
export const MIN_BOARD_COLUMNS = 2;

export const BOARD_COLUMNS: BoardColumnDef[] = [
  { id: 'todo', title: 'To Do', icon: 'fa-circle-dot', color: '#0d9488' },
  { id: 'in_progress', title: 'In Progress', icon: 'fa-spinner', color: '#0284c7' },
  { id: 'done', title: 'Done', icon: 'fa-check', color: '#059669' }
];

export const CORE_BOARD_COLUMN_IDS: readonly string[] = BOARD_COLUMNS.map(c => c.id);

/** @deprecated Prefer runtime board column ids from ToDoService.boardColumns */
export const BOARD_COLUMN_IDS = CORE_BOARD_COLUMN_IDS;

export const DEFAULT_BOARD_COLUMN_ID = 'todo';
export const DONE_BOARD_COLUMN_ID = 'done';

export const COLUMN_ICON_OPTIONS: readonly string[] = [
  'fa-circle-dot',
  'fa-spinner',
  'fa-check',
  'fa-inbox',
  'fa-bolt',
  'fa-flag',
  'fa-star',
  'fa-heart',
  'fa-bookmark',
  'fa-fire',
  'fa-rocket',
  'fa-lightbulb',
  'fa-clipboard-list',
  'fa-hourglass-half',
  'fa-thumbs-up',
  'fa-layer-group',
  'fa-folder-open',
  'fa-list-check',
  'fa-compass',
  'fa-gem'
] as const;

export const COLUMN_COLOR_OPTIONS: readonly string[] = [
  '#0d9488',
  '#0284c7',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#db2777',
  '#4f46e5',
  '#0891b2',
  '#65a30d',
  '#ea580c',
  '#475569'
] as const;

const CUSTOM_COLUMN_ID_PATTERN = /^col_[a-z0-9]+$/i;

export function createBoardColumnId(): string {
  return `col_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function isCoreBoardColumnId(id: string): boolean {
  return CORE_BOARD_COLUMN_IDS.includes(id);
}

export function isBoardColumnIdFormat(id: string): boolean {
  return isCoreBoardColumnId(id) || CUSTOM_COLUMN_ID_PATTERN.test(id);
}

/** @deprecated Use ToDoService column registry / isBoardColumnIdFormat */
export function isKnownBoardColumnId(id: string): boolean {
  return isBoardColumnIdFormat(id);
}

export function isAllowedColumnIcon(icon: string): boolean {
  return (COLUMN_ICON_OPTIONS as readonly string[]).includes(icon);
}

export function cloneDefaultBoardColumns(): BoardColumnDef[] {
  return BOARD_COLUMNS.map(col => ({ ...col }));
}

export function sanitizeBoardColumn(
  entry: Partial<BoardColumnDef>,
  fallback?: BoardColumnDef
): BoardColumnDef | null {
  const id = typeof entry.id === 'string' ? entry.id : '';
  if (!isBoardColumnIdFormat(id)) return null;

  const title =
    typeof entry.title === 'string' && entry.title.trim().length > 0
      ? entry.title.trim().slice(0, 40)
      : fallback?.title || 'New column';
  const icon =
    typeof entry.icon === 'string' && isAllowedColumnIcon(entry.icon)
      ? entry.icon
      : fallback?.icon || 'fa-inbox';
  const color =
    typeof entry.color === 'string' &&
    (COLUMN_COLOR_OPTIONS as readonly string[]).includes(entry.color)
      ? entry.color
      : fallback?.color || '#475569';

  return { id, title, icon, color };
}
