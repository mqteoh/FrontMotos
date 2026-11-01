import { HttpResourceRequest } from '@angular/common/http';
import { Params } from '@angular/router';
import { OrdenCatalogo } from './modelos';

export const API_PUBLICO = '/api/publico';
export const TAMANO_PAGINA = 12;

export const ORDENES: { valor: OrdenCatalogo; etiqueta: string }[] = [
  { valor: 'MARCA', etiqueta: 'Marca y modelo' },
  { valor: 'PRECIO_ASC', etiqueta: 'Precio: menor a mayor' },
  { valor: 'PRECIO_DESC', etiqueta: 'Precio: mayor a menor' },
  { valor: 'CILINDRAJE', etiqueta: 'Cilindraje: mayor a menor' },
];

export interface Busqueda {
  texto: string;
  marca: string;
  tipo: string;
  sede: number | null;
  precioMin: number | null;
  precioMax: number | null;
  orden: OrdenCatalogo;
  pagina: number;
}

export const BUSQUEDA_INICIAL: Busqueda = {
  texto: '',
  marca: '',
  tipo: '',
  sede: null,
  precioMin: null,
  precioMax: null,
  orden: 'MARCA',
  pagina: 1,
};

function entero(valor: string | null): number | null {
  if (valor === null || valor.trim() === '') {
    return null;
  }
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 0 ? numero : null;
}

export function leerBusqueda(params: Params): Busqueda {
  const texto = (clave: string) => (typeof params[clave] === 'string' ? params[clave].trim() : '');
  const orden = ORDENES.find((o) => o.valor === params['orden'])?.valor ?? 'MARCA';
  return {
    texto: texto('texto'),
    marca: texto('marca'),
    tipo: texto('tipo'),
    sede: entero(texto('sede')),
    precioMin: entero(texto('precioMin')),
    precioMax: entero(texto('precioMax')),
    orden,
    pagina: Math.max(entero(texto('pagina')) ?? 1, 1),
  };
}

export function aParametrosUrl(busqueda: Busqueda): Params {
  const params: Params = {};
  if (busqueda.texto) params['texto'] = busqueda.texto;
  if (busqueda.marca) params['marca'] = busqueda.marca;
  if (busqueda.tipo) params['tipo'] = busqueda.tipo;
  if (busqueda.sede !== null) params['sede'] = busqueda.sede;
  if (busqueda.precioMin !== null) params['precioMin'] = busqueda.precioMin;
  if (busqueda.precioMax !== null) params['precioMax'] = busqueda.precioMax;
  if (busqueda.orden !== 'MARCA') params['orden'] = busqueda.orden;
  if (busqueda.pagina > 1) params['pagina'] = busqueda.pagina;
  return params;
}

export function contarFiltros(busqueda: Busqueda): number {
  return [
    busqueda.texto,
    busqueda.marca,
    busqueda.tipo,
    busqueda.sede !== null,
    busqueda.precioMin !== null || busqueda.precioMax !== null,
  ].filter(Boolean).length;
}

export function hayFiltros(busqueda: Busqueda): boolean {
  return contarFiltros(busqueda) > 0;
}

export function solicitudMotos(busqueda: Busqueda): HttpResourceRequest {
  const params: Record<string, string | number> = {
    pagina: busqueda.pagina - 1,
    tamano: TAMANO_PAGINA,
    orden: busqueda.orden,
  };
  if (busqueda.texto) params['texto'] = busqueda.texto;
  if (busqueda.marca) params['marca'] = busqueda.marca;
  if (busqueda.tipo) params['tipo'] = busqueda.tipo;
  if (busqueda.sede !== null) params['idSucursal'] = busqueda.sede;
  if (busqueda.precioMin !== null) params['precioMin'] = busqueda.precioMin;
  if (busqueda.precioMax !== null) params['precioMax'] = busqueda.precioMax;
  return { url: `${API_PUBLICO}/motos`, params };
}

export function direccionSede(sede: {
  calle: string;
  numeroDireccion: string;
  barrio: string;
  ciudad: string;
}): string {
  return `${sede.calle} # ${sede.numeroDireccion}, ${sede.barrio}, ${sede.ciudad}`;
}
