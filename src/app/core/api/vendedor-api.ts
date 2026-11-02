import { METODOS_PAGO, TIPOS_FACTURA } from './cliente-api';
import { ClienteSede, MetodoPago, TipoFactura } from './modelos';

export const API_VENDEDOR = '/api/vendedor';

export function solicitudBusquedaClientes(
  consulta: string,
): { url: string; params: Record<string, string> } | undefined {
  const limpia = consulta.trim();
  if (limpia.length < 2) {
    return undefined;
  }
  const params: Record<string, string> = /^[0-9]+$/.test(limpia)
    ? { documento: limpia }
    : { texto: limpia };
  return { url: `${API_VENDEDOR}/clientes`, params };
}

export function nombreCliente(cliente: Pick<ClienteSede, 'nombres' | 'apellidos'>): string {
  return `${cliente.nombres} ${cliente.apellidos}`;
}

export function totalAccesorios(
  items: { cantidad: number | null; precioUnitario: number | null }[],
): number {
  return items.reduce(
    (total, item) => total + (item.cantidad ?? 0) * (item.precioUnitario ?? 0),
    0,
  );
}

export function textoPago(pago: {
  metodoPago: MetodoPago | '';
  tipoFactura: TipoFactura | '';
}): string {
  return [
    pago.metodoPago ? METODOS_PAGO[pago.metodoPago] : '',
    pago.tipoFactura ? TIPOS_FACTURA[pago.tipoFactura] : '',
  ]
    .filter(Boolean)
    .join(' · ');
}
