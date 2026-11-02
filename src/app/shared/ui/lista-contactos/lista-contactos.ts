import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
} from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { mensajeError } from '../../formularios/mensajes';
import { Icono } from '../icono/icono';

export const MAXIMO_CONTACTOS = 5;

type TipoContacto = 'telefono' | 'correo';

const CONFIGURACION: Record<
  TipoContacto,
  { titulo: string; etiqueta: string; ayuda: string; tipo: string; modo: string }
> = {
  telefono: {
    titulo: 'Teléfonos',
    etiqueta: 'Teléfono',
    ayuda: `Hasta ${MAXIMO_CONTACTOS} números, solo dígitos.`,
    tipo: 'tel',
    modo: 'numeric',
  },
  correo: {
    titulo: 'Correos de contacto',
    etiqueta: 'Correo',
    ayuda: `Hasta ${MAXIMO_CONTACTOS} correos.`,
    tipo: 'email',
    modo: 'email',
  },
};

export function controlContacto(tipo: TipoContacto, valor = ''): FormControl<string> {
  const validadores =
    tipo === 'telefono'
      ? [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]
      : [Validators.required, Validators.email, Validators.maxLength(120)];
  return new FormControl(valor, { nonNullable: true, validators: validadores });
}

@Component({
  selector: 'app-lista-contactos',
  imports: [ReactiveFormsModule, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grupo', role: 'group', '[attr.aria-labelledby]': "'titulo-' + tipo()" },
  template: `
    <p class="lista-contactos__titulo" [id]="'titulo-' + tipo()">{{ config().titulo }}</p>
    <p class="campo__ayuda">{{ ayuda() ?? config().ayuda }}</p>
    @if (lista().length === 0) {
      <p class="muted">Sin {{ config().titulo.toLowerCase() }} guardados.</p>
    }
    <ul class="contactos">
      @for (control of lista().controls; track control; let i = $index) {
        <li class="campo">
          <label class="campo__etiqueta" [for]="tipo() + '-' + i">
            {{ config().etiqueta }} {{ i + 1 }}
          </label>
          <div class="contactos__fila">
            <input
              class="control"
              [class.dato]="tipo() === 'telefono'"
              [type]="config().tipo"
              [attr.inputmode]="config().modo"
              [id]="tipo() + '-' + i"
              [formControl]="control"
              [attr.aria-invalid]="error(i) ? 'true' : null"
              [attr.aria-describedby]="error(i) ? 'error-' + tipo() + '-' + i : null"
            />
            <button
              type="button"
              class="btn btn--icono"
              [attr.aria-label]="'Quitar ' + config().etiqueta.toLowerCase() + ' ' + (i + 1)"
              (click)="quitar(i)"
            >
              <app-icono nombre="quitar" />
            </button>
          </div>
          @if (error(i); as mensaje) {
            <p class="campo__error" [id]="'error-' + tipo() + '-' + i">
              <app-icono nombre="error" />{{ mensaje }}
            </p>
          }
        </li>
      }
    </ul>
    <button
      type="button"
      class="btn btn--secundario"
      [id]="'agregar-' + tipo()"
      [disabled]="lista().length >= maximo"
      (click)="agregar()"
    >
      <app-icono nombre="agregar" />Agregar {{ config().etiqueta.toLowerCase() }}
    </button>
  `,
})
export class ListaContactos {
  readonly lista = input.required<FormArray<FormControl<string>>>();
  readonly tipo = input.required<TipoContacto>();
  readonly ayuda = input<string>();

  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  protected readonly maximo = MAXIMO_CONTACTOS;

  protected config() {
    return CONFIGURACION[this.tipo()];
  }

  protected error(indice: number): string | null {
    return mensajeError(this.lista().at(indice), {
      pattern: 'Escribe solo números, entre 7 y 15 dígitos.',
    });
  }

  protected agregar(): void {
    this.lista().push(controlContacto(this.tipo()));
    this.enfocar(this.lista().length - 1);
  }

  protected quitar(indice: number): void {
    this.lista().removeAt(indice);
    this.lista().markAsDirty();
    this.enfocar(Math.max(indice - 1, 0));
  }

  private enfocar(indice: number): void {
    afterNextRender(
      () => {
        const raiz = this.elemento.nativeElement;
        const destino =
          raiz.querySelector<HTMLElement>(`#${this.tipo()}-${indice}`) ??
          raiz.querySelector<HTMLElement>(`#agregar-${this.tipo()}`);
        destino?.focus();
      },
      { injector: this.injector },
    );
  }
}
