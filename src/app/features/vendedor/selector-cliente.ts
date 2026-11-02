import { HttpErrorResponse, httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api/errores';
import { ClienteSede } from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { nombreCliente, solicitudBusquedaClientes } from '../../core/api/vendedor-api';
import { Icono } from '../../shared/ui/icono/icono';

let siguienteSelector = 0;

@Component({
  selector: 'app-selector-cliente',
  imports: [RouterLink, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'selector-cliente', role: 'group', '[attr.aria-labelledby]': 'idTitulo' },
  template: `
    <p class="campo__etiqueta" [id]="idTitulo">
      Cliente <span class="campo__obligatorio" aria-hidden="true">*</span>
    </p>
    @if (cliente(); as elegido) {
      <div class="selector-cliente__elegido">
        <div>
          <p class="selector-cliente__nombre">{{ nombre(elegido) }}</p>
          <p class="muted pequeno">
            Documento <span class="dato">{{ elegido.documento }}</span>
            @if (elegido.telefonos[0]) {
              · Tel. <span class="dato">{{ elegido.telefonos[0] }}</span>
            }
          </p>
        </div>
        @if (bloqueado()) {
          <p class="muted pequeno">{{ motivoBloqueo() }}</p>
        } @else {
          <button type="button" class="btn btn--secundario" (click)="cambiar()">
            Cambiar<span class="sr-only"> de cliente</span>
          </button>
        }
      </div>
    } @else {
      <div class="busqueda" role="search" aria-label="Buscar cliente">
        <label class="pequeno" [for]="idCampo">Busca por documento o por nombre</label>
        <div class="busqueda__fila">
          <input
            #campo
            class="control"
            type="search"
            autocomplete="off"
            [id]="idCampo"
            [attr.aria-invalid]="error() ? 'true' : null"
            [attr.aria-describedby]="error() ? idError : null"
            (keydown.enter)="buscar($event, campo.value)"
          />
          <button type="button" class="btn btn--secundario" (click)="buscar($event, campo.value)">
            <app-icono nombre="buscar" />Buscar
          </button>
        </div>
      </div>
      @if (error()) {
        <p class="campo__error" [id]="idError"><app-icono nombre="error" />{{ error() }}</p>
      }
      @if (consulta()) {
        @if (resultados.isLoading()) {
          <p class="muted" role="status">Buscando clientes…</p>
        } @else if (resultados.error() && !sinDocumento()) {
          <p class="alerta" role="alert"><app-icono nombre="error" />{{ mensajeError() }}</p>
        } @else if (lista().length === 0) {
          <p class="muted" role="status">
            No hay clientes con «{{ consulta() }}».
            <a routerLink="/vendedor/clientes/nuevo" [queryParams]="parametrosNuevo()">
              Registrar cliente nuevo
            </a>
          </p>
        } @else {
          <ul class="selector-cliente__resultados" aria-label="Clientes encontrados">
            @for (opcion of lista(); track opcion.idCliente) {
              <li>
                <span>
                  {{ nombre(opcion) }}
                  <span class="muted pequeno dato">{{ opcion.documento }}</span>
                </span>
                <button type="button" class="btn btn--secundario" (click)="elegir(opcion)">
                  Elegir<span class="sr-only"> a {{ nombre(opcion) }}</span>
                </button>
              </li>
            }
          </ul>
        }
      }
    }
  `,
})
export class SelectorCliente {
  readonly cliente = model<ClienteSede | null>(null);
  readonly bloqueado = input(false);
  readonly motivoBloqueo = input('');
  readonly error = input<string | null>(null);

  private readonly router = inject(Router);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly idTitulo = `selector-cliente-${++siguienteSelector}`;
  protected readonly idCampo = `${this.idTitulo}-campo`;
  protected readonly idError = `${this.idTitulo}-error`;
  protected readonly consulta = signal('');
  protected readonly resultados = httpResource<ClienteSede[]>(() =>
    solicitudBusquedaClientes(this.consulta()),
  );
  protected readonly lista = computed(() => valorDe(this.resultados) ?? []);
  protected readonly sinDocumento = computed(() => {
    const error = this.resultados.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  protected readonly mensajeError = computed(() => mensajeDeError(this.resultados.error()));
  protected readonly parametrosNuevo = computed(() => ({
    volver: this.router.url,
    ...(/^[0-9]+$/.test(this.consulta()) ? { documento: this.consulta() } : {}),
  }));
  protected readonly nombre = nombreCliente;

  protected buscar(evento: Event, valor: string): void {
    evento.preventDefault();
    this.consulta.set(valor.trim());
  }

  protected elegir(cliente: ClienteSede): void {
    this.cliente.set(cliente);
    this.consulta.set('');
  }

  protected cambiar(): void {
    this.cliente.set(null);
    afterNextRender(
      () => this.elemento.nativeElement.querySelector<HTMLElement>(`#${this.idCampo}`)?.focus(),
      { injector: this.injector },
    );
  }
}
