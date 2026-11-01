import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICONOS, NombreIcono } from './iconos';

@Component({
  selector: 'app-icono',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[innerHTML]': 'svg()' },
  template: '',
})
export class Icono {
  private readonly sanitizer = inject(DomSanitizer);
  readonly nombre = input.required<NombreIcono>();
  protected readonly svg = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(ICONOS[this.nombre()]),
  );
}
