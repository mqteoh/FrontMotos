import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-no-encontrada',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pagina" aria-labelledby="titulo-no-encontrada">
      <h1 id="titulo-no-encontrada">Esta página no existe</h1>
      <p>
        No encontramos nada en <span class="dato">{{ ruta }}</span>. Revisa la dirección o vuelve
        al listado de motos.
      </p>
      <a class="enlace-accion" routerLink="/">Ver motos disponibles</a>
    </section>
  `,
})
export class NoEncontrada {
  protected readonly ruta = inject(Router).url;
}
