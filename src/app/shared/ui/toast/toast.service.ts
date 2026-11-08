import { Injectable, signal } from '@angular/core';

export type TipoToast = 'exito' | 'error' | 'info';

export interface Toast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
}

export const DURACION_TOAST_MS = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private siguiente = 0;
  private readonly lista = signal<Toast[]>([]);
  readonly toasts = this.lista.asReadonly();

  exito(mensaje: string): void {
    this.mostrar('exito', mensaje);
  }

  error(mensaje: string): void {
    this.mostrar('error', mensaje);
  }

  info(mensaje: string): void {
    this.mostrar('info', mensaje);
  }

  cerrar(id: number): void {
    this.lista.update((lista) => lista.filter((toast) => toast.id !== id));
  }

  private mostrar(tipo: TipoToast, mensaje: string): void {
    const id = ++this.siguiente;
    this.lista.update((lista) => [...lista, { id, tipo, mensaje }]);
    setTimeout(() => this.cerrar(id), DURACION_TOAST_MS);
  }
}
