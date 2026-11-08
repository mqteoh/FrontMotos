import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Dialogo } from './dialogo';

@Component({
  imports: [Dialogo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" id="abrir" (click)="abierto.set(true)">Abrir</button>
    <app-dialogo titulo="Condiciones" [(abierto)]="abierto">
      <p>Texto</p>
    </app-dialogo>
  `,
})
class Anfitrion {
  abierto = signal(false);
}

describe('Dialogo', () => {
  const prototipo = HTMLDialogElement.prototype;
  const originales = { showModal: prototipo.showModal, close: prototipo.close };

  beforeAll(() => {
    prototipo.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    prototipo.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  });

  afterAll(() => Object.assign(prototipo, originales));

  async function montar() {
    const fixture = TestBed.createComponent(Anfitrion);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    const dialogo = raiz.querySelector('dialog') as HTMLDialogElement;
    const abrir = raiz.querySelector('#abrir') as HTMLButtonElement;
    return { fixture, raiz, dialogo, abrir };
  }

  afterEach(() => document.body.replaceChildren());

  it('se abre, se cierra con el botón y devuelve el foco', async () => {
    const { fixture, raiz, dialogo, abrir } = await montar();
    abrir.focus();
    abrir.click();
    await fixture.whenStable();
    expect(dialogo.open).toBe(true);
    expect(dialogo.getAttribute('aria-labelledby')).toBe(raiz.querySelector('h2')?.id);

    raiz.querySelector<HTMLButtonElement>('button[aria-label="Cerrar"]')?.click();
    await fixture.whenStable();
    expect(dialogo.open).toBe(false);
    expect(fixture.componentInstance.abierto()).toBe(false);
    expect(document.activeElement).toBe(abrir);
  });

  it('Escape cierra sin depender del evento close y se puede volver a abrir', async () => {
    const { fixture, dialogo, abrir } = await montar();
    for (let vuelta = 0; vuelta < 2; vuelta++) {
      abrir.click();
      await fixture.whenStable();
      expect(dialogo.open).toBe(true);
      const cancelar = new Event('cancel', { cancelable: true });
      dialogo.dispatchEvent(cancelar);
      await fixture.whenStable();
      expect(cancelar.defaultPrevented).toBe(true);
      expect(dialogo.open).toBe(false);
      expect(fixture.componentInstance.abierto()).toBe(false);
    }
  });
});
