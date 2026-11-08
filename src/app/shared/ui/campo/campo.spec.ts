import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Campo, Control } from './campo';

@Component({
  imports: [Campo, Control],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-campo etiqueta="Correo" ayuda="El de tu cuenta." [obligatorio]="true" [error]="error()">
      <input appControl type="email" />
    </app-campo>
  `,
})
class Anfitrion {
  error = signal<string | null>(null);
}

describe('Campo', () => {
  it('enlaza etiqueta, ayuda y error con el control', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    const input = raiz.querySelector('input') as HTMLInputElement;
    const label = raiz.querySelector('label') as HTMLLabelElement;

    expect(label.htmlFor).toBe(input.id);
    expect(input.classList).toContain('control');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-ayuda`);

    fixture.componentInstance.error.set('Escribe un correo válido.');
    await fixture.whenStable();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-ayuda ${input.id}-error`);
    expect(raiz.querySelector(`#${input.id}-error`)?.textContent?.trim()).toBe(
      'Escribe un correo válido.',
    );
  });
});
