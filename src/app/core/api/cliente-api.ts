import { MetodoPago, TipoFactura } from './modelos';

export const API_CLIENTE = '/api/cliente';

export const METODOS_PAGO: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA_DEBITO: 'Tarjeta débito',
  TARJETA_CREDITO: 'Tarjeta crédito',
  TRANSFERENCIA: 'Transferencia',
};

export const TIPOS_FACTURA: Record<TipoFactura, string> = {
  ELECTRONICA: 'Factura electrónica',
  POS: 'Factura POS',
};

export const DIAS_RESERVA = 7;

export function sumarDias(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

export function fechaIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function diasHasta(fechaIsoDestino: string, hoy = new Date()): number {
  const [anio, mes, dia] = fechaIsoDestino.split('-').map(Number);
  const destino = new Date(anio, mes - 1, dia);
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((destino.getTime() - inicio.getTime()) / 86_400_000);
}

export function textoVencimiento(fechaVencimiento: string, hoy = new Date()): string {
  const dias = diasHasta(fechaVencimiento, hoy);
  if (dias <= 0) {
    return 'vence hoy';
  }
  return dias === 1 ? 'vence mañana' : `vence en ${dias} días`;
}
