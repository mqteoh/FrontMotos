import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TemaService } from '../../../core/tema/tema.service';
import { Icono } from '../icono/icono';

@Component({
  selector: 'app-selector-tema',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="btn btn--icono"
      [attr.aria-label]="etiqueta()"
      [title]="etiqueta()"
      (click)="tema.alternar()"
    >
      <app-icono [nombre]="tema.tema() === 'dark' ? 'sol' : 'luna'" />
    </button>
  `,
})
export class SelectorTema {
  protected readonly tema = inject(TemaService);
  protected readonly etiqueta = computed(() =>
    this.tema.tema() === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro',
  );
}
