import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  inject,
  input,
} from '@angular/core';
import { Icono } from '../icono/icono';

let siguienteCampo = 0;

@Component({
  selector: 'app-campo',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'campo' },
  template: `
    <label class="campo__etiqueta" [for]="idControl">
      {{ etiqueta() }}
      @if (obligatorio()) {
        <span class="campo__obligatorio" aria-hidden="true">*</span>
      }
    </label>
    @if (ayuda()) {
      <p class="campo__ayuda" [id]="idAyuda">{{ ayuda() }}</p>
    }
    <ng-content />
    @if (error()) {
      <p class="campo__error" [id]="idError"><app-icono nombre="error" />{{ error() }}</p>
    }
  `,
})
export class Campo {
  readonly etiqueta = input.required<string>();
  readonly ayuda = input<string>();
  readonly error = input<string | null>(null);
  readonly obligatorio = input(false);

  readonly idControl = `campo-${++siguienteCampo}`;
  protected readonly idAyuda = `${this.idControl}-ayuda`;
  protected readonly idError = `${this.idControl}-error`;

  readonly descripcion = computed(
    () =>
      [this.ayuda() ? this.idAyuda : null, this.error() ? this.idError : null]
        .filter(Boolean)
        .join(' ') || null,
  );
}

@Directive({
  selector: 'input[appControl], select[appControl], textarea[appControl]',
  host: {
    class: 'control',
    '[id]': 'campo.idControl',
    '[attr.aria-describedby]': 'campo.descripcion()',
    '[attr.aria-invalid]': "campo.error() ? 'true' : null",
    '[attr.aria-required]': "campo.obligatorio() ? 'true' : null",
  },
})
export class Control {
  readonly campo = inject(Campo);
}
