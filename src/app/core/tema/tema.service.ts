import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';

export type Tema = 'dark' | 'light';

const CLAVE_TEMA = 'tema';

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly raiz = inject(DOCUMENT).documentElement;
  private readonly actual = signal<Tema>(
    this.raiz.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
  );
  readonly tema = this.actual.asReadonly();

  constructor() {
    effect(() => this.raiz.setAttribute('data-theme', this.actual()));
  }

  alternar(): void {
    const nuevo: Tema = this.actual() === 'dark' ? 'light' : 'dark';
    this.actual.set(nuevo);
    try {
      localStorage.setItem(CLAVE_TEMA, nuevo);
    } catch {
      return;
    }
  }
}
