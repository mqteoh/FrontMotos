import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { NOMBRE_APP } from '../../core/app-info';
import { mensajeDeError } from '../../core/api/errores';
import { MotoDetalle } from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { API_PUBLICO, direccionSede } from '../../core/api/publico-api';
import { AuthService } from '../../core/auth/auth.service';
import { NumeroPipe } from '../../shared/formato/numero.pipe';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { nombreTipoMoto } from '../../shared/formato/tipos-moto';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { FotoMoto } from '../../shared/ui/foto-moto/foto-moto';
import { Icono } from '../../shared/ui/icono/icono';
import { Placa } from '../../shared/ui/placa/placa';
import { UltimaBusqueda } from './ultima-busqueda';

@Component({
  selector: 'app-ficha-moto',
  imports: [
    RouterLink,
    Esqueleto,
    EstadoError,
    EstadoVacio,
    FotoMoto,
    Icono,
    Placa,
    NumeroPipe,
    PesosPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ficha-moto.html',
})
export default class FichaMoto {
  readonly placa = input.required<string>();

  private readonly auth = inject(AuthService);
  protected readonly volver = inject(UltimaBusqueda).url;
  protected readonly moto = httpResource<MotoDetalle>(
    () => `${API_PUBLICO}/motos/${encodeURIComponent(this.placa())}`,
  );
  protected readonly detalle = computed(() => valorDe(this.moto));
  protected readonly noDisponible = computed(() => {
    const error = this.moto.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  protected readonly mensajeError = computed(() => mensajeDeError(this.moto.error()));
  protected readonly tipo = computed(() => nombreTipoMoto(this.detalle()?.tipoMoto ?? ''));
  protected readonly direccion = computed(() => {
    const moto = this.detalle();
    return moto ? direccionSede(moto.sucursal) : '';
  });
  protected readonly perfil = computed<'invitado' | 'cliente' | 'empleado'>(() => {
    const usuario = this.auth.usuario();
    if (!usuario) {
      return 'invitado';
    }
    return usuario.rol === 'CLIENTE' ? 'cliente' : 'empleado';
  });

  constructor() {
    const titulo = inject(Title);
    effect(() => {
      const moto = this.detalle();
      if (moto) {
        titulo.setTitle(`${moto.marca} ${moto.modelo}, placa ${moto.placa} | ${NOMBRE_APP}`);
      }
    });
  }
}
