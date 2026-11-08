import { DOCUMENT } from '@angular/common';
import { Injectable, Injector, afterNextRender, inject } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

function rutaSinConsulta(url: string): string {
  return url.split(/[?#]/)[0];
}

@Injectable({ providedIn: 'root' })
export class FocoAlNavegar {
  private readonly router = inject(Router);
  private readonly documento = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private rutaAnterior: string | null = null;
  private desdeHistorial = false;

  iniciar(): void {
    this.router.events.subscribe((evento) => {
      if (evento instanceof NavigationStart) {
        this.desdeHistorial = evento.navigationTrigger === 'popstate';
      } else if (evento instanceof NavigationEnd) {
        this.alTerminar(rutaSinConsulta(evento.urlAfterRedirects));
      }
    });
  }

  private alTerminar(ruta: string): void {
    const anterior = this.rutaAnterior;
    this.rutaAnterior = ruta;
    if (anterior === null || anterior === ruta) {
      return;
    }
    const desdeHistorial = this.desdeHistorial;
    afterNextRender(
      () => {
        const principal = this.documento.getElementById('contenido');
        const activo = this.documento.activeElement;
        if (
          !principal ||
          (activo && activo !== this.documento.body && principal.contains(activo))
        ) {
          return;
        }
        if (!desdeHistorial) {
          this.documento.defaultView?.scrollTo(0, 0);
        }
        principal.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }
}
