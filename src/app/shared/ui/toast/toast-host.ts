import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Icono } from '../icono/icono';
import { NombreIcono } from '../icono/iconos';
import { TipoToast, ToastService } from './toast.service';

const PRESENTACION: Record<TipoToast, { icono: NombreIcono; prefijo: string }> = {
  exito: { icono: 'exito', prefijo: 'Listo:' },
  error: { icono: 'error', prefijo: 'Error:' },
  info: { icono: 'info', prefijo: 'Aviso:' },
};

@Component({
  selector: 'app-toast-host',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="toasts" aria-live="polite" aria-label="Avisos">
      @for (toast of servicio.toasts(); track toast.id) {
        <li
          class="toast"
          [class]="'toast--' + toast.tipo"
          animate.enter="toast--entra"
          animate.leave="toast--sale"
        >
          <app-icono class="toast__icono" [nombre]="presentacion[toast.tipo].icono" />
          <p class="toast__mensaje">
            <span class="sr-only">{{ presentacion[toast.tipo].prefijo }} </span>{{ toast.mensaje }}
          </p>
          <button
            type="button"
            class="btn btn--icono"
            aria-label="Cerrar aviso"
            (click)="servicio.cerrar(toast.id)"
          >
            <app-icono nombre="cerrar" />
          </button>
        </li>
      }
    </ul>
  `,
})
export class ToastHost {
  protected readonly servicio = inject(ToastService);
  protected readonly presentacion = PRESENTACION;
}
