import { Injectable, signal } from '@angular/core';

export interface PedidoConfirmacion {
  titulo: string;
  mensaje: string;
  accion: string;
  peligro?: boolean;
  volver?: string;
}

export interface ConfirmacionPendiente extends PedidoConfirmacion {
  responder: (confirmado: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  private readonly pendiente = signal<ConfirmacionPendiente | null>(null);
  readonly actual = this.pendiente.asReadonly();

  confirmar(pedido: PedidoConfirmacion): Promise<boolean> {
    this.responder(false);
    return new Promise((responder) => this.pendiente.set({ ...pedido, responder }));
  }

  responder(confirmado: boolean): void {
    const pendiente = this.pendiente();
    if (!pendiente) {
      return;
    }
    this.pendiente.set(null);
    pendiente.responder(confirmado);
  }
}
