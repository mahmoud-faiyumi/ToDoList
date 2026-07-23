import { Component, ElementRef, AfterViewInit, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    <div class="modal-backdrop" role="presentation" (click)="close.emit()" tabindex="-1"></div>
    <div class="modal" role="dialog" aria-modal="true" [attr.aria-labelledby]="titleId">
      <div
        #panel
        class="modal-panel"
        [class.modal-panel--sm]="size() === 'sm'"
        [class.modal-panel--md]="size() === 'md'"
        [class.modal-panel--lg]="size() === 'lg'">
        <div class="modal-header">
          <div class="modal-heading">
            <h3 [id]="titleId">{{ title() }}</h3>
            @if (subtitle()) {
              <p class="modal-subtitle">{{ subtitle() }}</p>
            }
          </div>
          <button type="button" class="btn btn-ghost btn-icon" (click)="close.emit()" aria-label="Close">
            <i class="fa fa-times" aria-hidden="true"></i>
          </button>
        </div>
        <div class="modal-body" [class.modal-body--flush]="flushBody()">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    :host { position: fixed; inset: 0; z-index: 1000; }
    .modal-backdrop {
      position: fixed; inset: 0;
      background: color-mix(in srgb, #020617 48%, transparent);
      backdrop-filter: blur(4px);
      animation: fadeIn .15s ease-out;
    }
    .modal {
      position: fixed; inset: 0; display: grid; place-items: center;
      padding: 1rem; z-index: 1001;
    }
    .modal > * { grid-row: 1; grid-column: 1; }
    .modal-panel {
      width: min(900px, 95vw);
      max-width: 95vw;
      max-height: 90vh;
      overflow-y: auto;
      border-radius: var(--radius-lg);
      padding: 0;
      box-shadow: var(--glass-shadow-drag);
      background: var(--glass-surface);
      border: 1px solid var(--glass-border);
      backdrop-filter: blur(var(--blur-strength)) saturate(1.2);
      color: var(--text-primary);
      transform: translateY(8px) scale(0.98);
      opacity: 0;
      animation: scaleIn .18s ease-out forwards;
    }
    .modal-panel--sm {
      width: min(440px, 95vw);
    }
    .modal-panel--md {
      width: min(680px, 95vw);
    }
    .modal-panel--lg {
      width: min(940px, 96vw);
    }
    .modal-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 0.75rem;
      padding: 1.1rem 1.15rem 0.65rem;
    }
    .modal-heading { min-width: 0; }
    .modal-header h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .modal-subtitle {
      margin: 0.2rem 0 0;
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--text-secondary);
      line-height: 1.35;
    }
    .modal-body { padding: 0.35rem 1.15rem 1.15rem; }
    .modal-body--flush { padding: 0; }
    @media (max-width: 768px) {
      .modal-panel:not(.modal-panel--sm) { width: min(95vw, 500px); }
    }
    @media (max-width: 480px) {
      .modal-panel { width: 95vw; margin: 0.5rem; }
      .modal-body:not(.modal-body--flush) { padding: 0.35rem 0.85rem 0.85rem; }
      .modal-header { padding: 0.85rem 0.85rem 0.5rem; }
    }
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes scaleIn {
      from { opacity: 0; transform: translateY(8px) scale(0.98) }
      to { opacity: 1; transform: translateY(0) scale(1) }
    }
    `
  ],
  host: {
    '(document:keydown)': 'onKeydown($event)'
  }
})
export class ModalComponent implements AfterViewInit {
  readonly title = input('');
  readonly subtitle = input('');
  readonly size = input<'default' | 'sm' | 'md' | 'lg'>('default');
  readonly flushBody = input(false);
  readonly close = output<void>();
  private readonly panelRef = viewChild.required<ElementRef<HTMLDivElement>>('panel');
  protected readonly titleId = `modal-title-${Math.random().toString(36).slice(2)}`;

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
      return;
    }
    if (event.key === 'Tab') {
      const focusables = this.getFocusable();
      if (focusables.length === 0) return;
      const current = document.activeElement as HTMLElement | null;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey) {
        if (!current || current === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!current || current === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const focusables = this.getFocusable();
      if (focusables.length > 0) {
        focusables[0].focus();
      }
    });
  }

  private getFocusable(): HTMLElement[] {
    const root = this.panelRef()?.nativeElement || document.body;
    const nodes = root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    return Array.from(nodes).filter(el => el.offsetParent !== null);
  }
}
