import { TestBed } from '@angular/core/testing';
import { ToDoService } from './to-do.service';
import { ToDoStatus } from '../../models/enum/todo.enum';

function installLocalStorageMock(store: Record<string, string>): Storage {
    const storage: Storage = {
        get length() {
            return Object.keys(store).length;
        },
        clear() {
            Object.keys(store).forEach(key => delete store[key]);
        },
        getItem(key: string) {
            return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
        },
        key(index: number) {
            return Object.keys(store)[index] ?? null;
        },
        removeItem(key: string) {
            delete store[key];
        },
        setItem(key: string, value: string) {
            store[key] = value;
        }
    };

    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        writable: true,
        value: storage
    });

    return storage;
}

describe('ToDoService', () => {
    let service: ToDoService;
    const store: Record<string, string> = {};

    beforeEach(() => {
        vi.restoreAllMocks();
        TestBed.resetTestingModule();
        Object.keys(store).forEach(k => delete store[k]);
        installLocalStorageMock(store);

        TestBed.configureTestingModule({});
        service = TestBed.inject(ToDoService);
        service.setAll([]);
    });
    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('adds tasks and toggles completion by id', () => {
        service.add('Alpha');
        const id = service.items()[0].id;
        service.toggleDoneById(id);
        expect(service.items()[0].status).toBe(ToDoStatus.DONE);
        service.toggleDoneById(id);
        expect(service.items()[0].status).toBe(ToDoStatus.NEW);
    });

    it('deleteByIds removes only matching tasks', () => {
        service.add('a');
        service.add('b');
        const [idA] = service.items().map(i => i.id);
        service.deleteByIds([idA]);
        expect(service.items().length).toBe(1);
        expect(service.items()[0].toDoItemText).toBe('b');
    });

    it('editById updates fields and supports clearing tags via empty array', () => {
        service.add('task', { tags: ['x'], priority: 'low' });
        const id = service.items()[0].id;
        service.editById(id, { tags: [], priority: 'high' });
        const t = service.items()[0];
        expect(t.tags).toBeUndefined();
        expect(t.priority).toBe('high');
    });

    it('importTasksJson replaces all tasks', () => {
        service.add('old');
        const payload = [
            {
                id: 'fixed-id',
                toDoItemText: 'Imported',
                status: ToDoStatus.NEW,
                isEditing: false,
                createdAt: new Date('2020-01-01').toISOString(),
                updatedAt: new Date('2020-01-01').toISOString()
            }
        ];
        const result = service.importTasksJson(JSON.stringify(payload));
        expect(result.ok).toBe(true);
        expect(service.items().length).toBe(1);
        expect(service.items()[0].toDoItemText).toBe('Imported');
    });

    it('exportTasksJson round-trips through import', () => {
        service.add('Round trip');
        const json = service.exportTasksJson();
        service.add('Extra');
        const importResult = service.importTasksJson(json);
        expect(importResult.ok).toBe(true);
        expect(service.items().length).toBe(1);
        expect(service.items()[0].toDoItemText).toBe('Round trip');
    });

    it('sortByPriority orders urgent before low', () => {
        service.add('low task', { priority: 'low' });
        service.add('urgent task', { priority: 'urgent' });
        const sorted = service.sortByPriority(service.items());
        expect(sorted[0].priority).toBe('urgent');
    });

    it('removeBoardColumn moves tasks and enforces minimum column count', () => {
        while (service.canAddBoardColumn()) {
            service.addBoardColumn();
        }
        expect(service.boardColumns().length).toBe(5);

        const customCol = service.boardColumns().find(col => col.id.startsWith('col_'));
        expect(customCol).toBeTruthy();
        service.add('orphan task', { boardColumnId: customCol!.id });

        const removed = service.removeBoardColumn(customCol!.id);
        expect(removed.ok).toBe(true);
        expect(removed.movedCount).toBe(1);
        expect(service.boardColumns().length).toBe(4);
        expect(service.items().some(t => t.boardColumnId === customCol!.id)).toBe(false);

        while (service.canRemoveBoardColumn()) {
            const col = service.boardColumns()[0];
            service.removeBoardColumn(col.id);
        }

        expect(service.boardColumns().length).toBe(2);
        expect(service.removeBoardColumn(service.boardColumns()[0].id).ok).toBe(false);
        expect(service.boardColumns().length).toBe(2);
    });
});
