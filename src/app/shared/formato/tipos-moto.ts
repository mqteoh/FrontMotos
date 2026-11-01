import { TipoMoto } from '../../core/api/modelos';

export const TIPOS_MOTO: Record<TipoMoto, string> = {
  CALLE: 'Calle',
  DEPORTIVA: 'Deportiva',
  NAKED: 'Naked',
  SCOOTER: 'Scooter',
  ENDURO: 'Enduro',
  TOURING: 'Touring',
  DOBLE_PROPOSITO: 'Doble propósito',
};

export function nombreTipoMoto(tipo: string): string {
  return TIPOS_MOTO[tipo as TipoMoto] ?? tipo;
}
