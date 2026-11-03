import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { FocoAlNavegar } from './foco-al-navegar';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Página</p>`,
})
class Pagina {}

@Component({
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input id="buscador" />
    <main id="contenido" tabindex="-1"><router-outlet /></main>
  `,
})
class Marco {}

describe('Foco al navegar', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'a', component: Pagina },
          { path: 'b', component: Pagina },
        ]),
      ],
    });
  });

  it('lleva el foco al contenido al cambiar de página, pero no al cambiar solo la consulta', async () => {
    const fixture = TestBed.createComponent(Marco);
    document.body.appendChild(fixture.nativeElement);
    TestBed.inject(FocoAlNavegar).iniciar();
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/a');
    await fixture.whenStable();
    expect(document.activeElement?.id).not.toBe('contenido');

    await router.navigateByUrl('/b');
    await fixture.whenStable();
    expect(document.activeElement?.id).toBe('contenido');

    const buscador = document.getElementById('buscador');
    buscador?.focus();
    await router.navigateByUrl('/b?q=honda');
    await fixture.whenStable();
    expect(document.activeElement?.id).toBe('buscador');

    fixture.nativeElement.remove();
  });
});
