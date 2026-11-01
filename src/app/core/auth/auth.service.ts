import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { Credenciales, RegistroCliente, RespuestaToken, Usuario } from '../api/modelos';

interface Sesion {
  token: string;
  expiraEn: number;
  usuario: Usuario;
}

const CLAVE_SESION = 'sesion';
const MAXIMO_TEMPORIZADOR_MS = 2_147_483_647;

function leerSesion(): Sesion | null {
  try {
    const guardada = localStorage.getItem(CLAVE_SESION);
    const sesion = guardada ? (JSON.parse(guardada) as Sesion) : null;
    return sesion && sesion.expiraEn > Date.now() ? sesion : null;
  } catch {
    return null;
  }
}

function escribirSesion(sesion: Sesion | null): void {
  try {
    if (sesion) {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } else {
      localStorage.removeItem(CLAVE_SESION);
    }
  } catch {
    return;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private readonly sesion = signal<Sesion | null>(leerSesion());
  readonly usuario = computed(() => this.sesion()?.usuario ?? null);

  constructor() {
    effect((alLimpiar) => {
      const sesion = this.sesion();
      escribirSesion(sesion);
      if (!sesion) {
        return;
      }
      const espera = Math.min(sesion.expiraEn - Date.now(), MAXIMO_TEMPORIZADOR_MS);
      const temporizador = setTimeout(() => this.sesionVencida(), espera);
      alLimpiar(() => clearTimeout(temporizador));
    });
  }

  token(): string | null {
    return this.sesion()?.token ?? null;
  }

  iniciarSesion(credenciales: Credenciales): Observable<Usuario> {
    return this.http
      .post<RespuestaToken>('/auth/login', credenciales)
      .pipe(map((respuesta) => this.guardar(respuesta)));
  }

  registrar(datos: RegistroCliente): Observable<Usuario> {
    return this.http
      .post<RespuestaToken>('/auth/registro', datos)
      .pipe(map((respuesta) => this.guardar(respuesta)));
  }

  cerrarSesion(destino = '/'): void {
    this.sesion.set(null);
    void this.router.navigateByUrl(destino);
  }

  sesionVencida(): void {
    if (!this.sesion()) {
      return;
    }
    const volver = this.router.url;
    this.sesion.set(null);
    this.toast.info('Tu sesión terminó. Vuelve a iniciar sesión para continuar.');
    void this.router.navigate(['/ingresar'], { queryParams: { volver } });
  }

  private guardar(respuesta: RespuestaToken): Usuario {
    this.sesion.set({
      token: respuesta.token,
      expiraEn: Date.now() + respuesta.expiraEnMs,
      usuario: respuesta.usuario,
    });
    return respuesta.usuario;
  }
}
