import { AfterViewInit, Directive, ElementRef, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appStripNgClasses]',
  host: {
    '(input)': 'onInput()',
    '(change)': 'onChange()',
    '(blur)': 'onBlur()'
  }
})
export class StripNgClassesDirective implements AfterViewInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);

  ngAfterViewInit(): void {
    this.strip();
  }

  protected onInput(): void {
    this.strip();
  }

  protected onChange(): void {
    this.strip();
  }

  protected onBlur(): void {
    this.strip();
  }

  private strip(): void {
    const el = this.host.nativeElement;
    const classes = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean);
    for (const cls of classes) {
      if (cls.startsWith('ng-')) {
        this.renderer.removeClass(el, cls);
      }
    }
  }
}
