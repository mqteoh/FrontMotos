import { TestBed } from '@angular/core/testing';
import { ConfirmacionService } from './confirmacion.service';

describe('ConfirmacionService', () => {
  const pedido = { titulo: '¿Cancelar?', mensaje: 'No se puede deshacer.', accion: 'Cancelar' };

  it('resuelve con la respuesta y libera el pedido', async () => {
    const servicio = TestBed.inject(ConfirmacionService);
    const respuesta = servicio.confirmar(pedido);
    expect(servicio.actual()?.titulo).toBe('¿Cancelar?');
    servicio.responder(true);
    await expect(respuesta).resolves.toBe(true);
    expect(servicio.actual()).toBeNull();
  });

  it('un pedido nuevo responde que no al anterior', async () => {
    const servicio = TestBed.inject(ConfirmacionService);
    const primero = servicio.confirmar(pedido);
    const segundo = servicio.confirmar({ ...pedido, titulo: '¿Eliminar?' });
    await expect(primero).resolves.toBe(false);
    servicio.responder(true);
    await expect(segundo).resolves.toBe(true);
  });
});
