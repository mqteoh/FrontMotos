import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { mensajeDeError } from '../../core/api/errores';
import { Reparacion } from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { PLACA } from '../../core/api/publico-api';
import { API_TECNICO, totalReparaciones } from '../../core/api/tecnico-api';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Icono } from '../../shared/ui/icono/icono';
import { Placa } from '../../shared/ui/placa/placa';
import { TarjetaReparacion } from './tarjeta-reparacion';

@Component({
  selector: 'app-historial',
  imports: [Esqueleto, EstadoError, EstadoVacio, Icono, Placa, TarjetaReparacion, PesosPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina' },
  template: `
    <h1>Historial de una moto</h1>
    <form
      class="busqueda"
      role="search"
      aria-label="Buscar moto por placa"
      (submit)="buscar($event, campo.value)"
    >
      <label class="campo__etiqueta" for="buscar-placa">Placa</label>
      <p class="campo__ayuda" id="buscar-placa-ayuda">
        Tres letras, dos números y una letra, por ejemplo ABC12D.
      </p>
      <div class="busqueda__fila">
        <input
          #campo
          id="buscar-placa"
          class="control dato"
          type="search"
          maxlength="6"
          autocapitalize="characters"
          autocomplete="off"
          [value]="placa()"
          [attr.aria-invalid]="errorPlaca() ? 'true' : null"
          [attr.aria-describedby]="
            errorPlaca() ? 'buscar-placa-ayuda error-placa' : 'buscar-placa-ayuda'
          "
        />
        <button type="submit" class="btn btn--primario"><app-icono nombre="buscar" />Buscar</button>
      </div>
      @if (errorPlaca()) {
        <p id="error-placa" class="campo__error"><app-icono nombre="error" />{{ errorPlaca() }}</p>
      }
    </form>

    <p class="sr-only" role="status">{{ anuncio() }}</p>
    @if (placa()) {
      @if (historial.isLoading()) {
        <app-esqueleto etiqueta="Cargando el historial" forma="filas" [cantidad]="3" />
      } @else if (historial.error()) {
        <app-estado-error
          titulo="No se pudo cargar el historial."
          [mensaje]="mensajeError()"
          (reintentar)="historial.reload()"
        />
      } @else if (lista().length === 0) {
        <app-estado-vacio
          titulo="Esa moto no tiene reparaciones registradas."
          mensaje="Revisa la placa. Solo tienen historial las motos vendidas aquí que ya pasaron por el taller."
          icono="taller"
        />
      } @else {
        <section class="cuenta__seccion" aria-labelledby="titulo-historial-moto">
          <div class="historial__cabecera">
            <app-placa [placa]="placa()" [grande]="true" />
            <h2 id="titulo-historial-moto">{{ lista()[0].marca }} {{ lista()[0].modelo }}</h2>
          </div>
          <p class="muted">
            {{ lista().length }} {{ lista().length === 1 ? 'visita' : 'visitas' }} al taller ·
            <span class="dato">{{ totalGastado() | pesos }}</span> en reparaciones
          </p>
          <ol class="tarjetas-cuenta">
            @for (reparacion of lista(); track reparacion.idReparacion) {
              <li><app-tarjeta-reparacion [reparacion]="reparacion" [mostrarSede]="true" /></li>
            }
          </ol>
        </section>
      }
    }
  `,
})
export default class Historial {
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly placa = toSignal(
    this.ruta.queryParamMap.pipe(map((params) => (params.get('placa') ?? '').trim().toUpperCase())),
    { initialValue: '' },
  );
  protected readonly errorPlaca = signal<string | null>(null);
  protected readonly historial = httpResource<Reparacion[]>(() =>
    PLACA.test(this.placa()) ? `${API_TECNICO}/historial/${this.placa()}` : undefined,
  );
  protected readonly lista = computed(() =>
    [...(valorDe(this.historial) ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha)),
  );
  protected readonly mensajeError = computed(() => mensajeDeError(this.historial.error()));
  protected readonly anuncio = computed(() => {
    if (!this.placa() || this.historial.isLoading() || this.historial.error()) {
      return '';
    }
    const cantidad = this.lista().length;
    if (cantidad === 0) {
      return 'Esa moto no tiene reparaciones registradas.';
    }
    return cantidad === 1
      ? '1 visita al taller encontrada.'
      : `${cantidad} visitas al taller encontradas.`;
  });
  protected readonly totalGastado = computed(() => totalReparaciones(this.lista()));

  protected buscar(evento: Event, valor: string): void {
    evento.preventDefault();
    const placa = valor.trim().toUpperCase();
    if (!PLACA.test(placa)) {
      this.errorPlaca.set('Escribe la placa completa, por ejemplo ABC12D.');
      return;
    }
    this.errorPlaca.set(null);
    void this.router.navigate([], { relativeTo: this.ruta, queryParams: { placa } });
  }
}
