import { ChangeDetectionStrategy, Component, inject, linkedSignal } from '@angular/core';
import { Dialogo } from '../dialogo/dialogo';
import { ConfirmacionPendiente, ConfirmacionService } from './confirmacion.service';

@Component({
  selector: 'app-confirmacion-host',
  imports: [Dialogo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialogo
      [titulo]="mostrado()?.titulo ?? ''"
      [abierto]="confirmacion.actual() !== null"
      (abiertoChange)="!$event && confirmacion.responder(false)"
    >
      <p>{{ mostrado()?.mensaje }}</p>
      <button pie type="button" class="btn btn--secundario" (click)="confirmacion.responder(false)">
        {{ mostrado()?.volver ?? 'Volver' }}
      </button>
      <button
        pie
        type="button"
        class="btn"
        [class.btn--peligro-relleno]="mostrado()?.peligro"
        [class.btn--primario]="!mostrado()?.peligro"
        (click)="confirmacion.responder(true)"
      >
        {{ mostrado()?.accion }}
      </button>
    </app-dialogo>
  `,
})
export class ConfirmacionHost {
  protected readonly confirmacion = inject(ConfirmacionService);
  protected readonly mostrado = linkedSignal<
    ConfirmacionPendiente | null,
    ConfirmacionPendiente | null
  >({
    source: this.confirmacion.actual,
    computation: (actual, previo) => actual ?? previo?.value ?? null,
  });
}
