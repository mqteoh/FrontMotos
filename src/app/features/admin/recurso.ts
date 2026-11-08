import { ValidatorFn } from '@angular/forms';
import { MensajesPropios } from '../../shared/formularios/mensajes';
import { NombreIcono } from '../../shared/ui/icono/iconos';
import { Columna } from '../../shared/ui/tabla/tabla';
import { CatalogosAdmin, NombreCatalogo } from './catalogos-admin';

export type Fila = Record<string, unknown>;
export type Valores = Record<string, unknown>;

export interface Opcion {
  valor: string;
  etiqueta: string;
  grupo?: string;
}

export interface ContextoOpciones {
  catalogos: CatalogosAdmin;
  idEditado: string | null;
}

export type FuenteOpciones = (contexto: ContextoOpciones) => readonly Opcion[] | undefined;

export type TipoCampo =
  | 'texto'
  | 'area'
  | 'numero'
  | 'fecha'
  | 'fecha-hora'
  | 'correo'
  | 'telefono'
  | 'contrasena'
  | 'seleccion'
  | 'telefonos'
  | 'correos';

export interface CampoRecurso {
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  obligatorio?: boolean | 'al-crear';
  ayuda?: string;
  ayudaAlEditar?: string;
  validadores?: ValidatorFn[];
  mensajes?: MensajesPropios;
  opciones?: FuenteOpciones;
  numerico?: boolean;
  sinValor?: string;
  visible?: (valores: Valores) => boolean;
  fijoAlEditar?: string;
  completo?: boolean;
  min?: number;
  max?: number;
  paso?: number | 'any';
  maximo?: number;
  autocompletar?: string;
  placa?: boolean;
}

export interface FiltroRecurso {
  clave: string;
  etiqueta: string;
  tipo?: 'seleccion' | 'fecha';
  todos?: string;
  opciones?: FuenteOpciones;
  local?: boolean;
}

export interface AccionRecurso {
  etiqueta: string;
  icono: NombreIcono;
  titulo: string;
  mensaje: string;
  url: string;
  resultado: (respuesta: unknown) => string;
}

export interface Recurso<T = Fila> {
  ruta: string;
  titulo: string;
  singular: string;
  genero: 'f' | 'm';
  descripcion: string;
  vacio: string;
  icono: NombreIcono;
  url: string;
  urlDe?: (id: string) => string;
  id: (fila: T) => string;
  nombre: (fila: T) => string;
  columnas: readonly Columna<Fila>[];
  vista?: (fila: T) => Fila;
  filtros?: readonly FiltroRecurso[];
  campos?: readonly CampoRecurso[];
  editable?: boolean;
  eliminable?: boolean;
  puedeEliminar?: (fila: T, idUsuario: number | undefined) => boolean;
  eliminar?: (fila: T) => { url: string; params?: Record<string, string> };
  avisoEliminar?: string;
  bloqueo?: string;
  catalogos?: readonly NombreCatalogo[];
  alimenta?: readonly NombreCatalogo[];
  aFormulario?: (fila: T) => Valores;
  aCuerpo?: (cuerpo: Valores) => Valores;
  accion?: AccionRecurso;
}

export interface GrupoRecursos {
  titulo: string;
  icono: NombreIcono;
  recursos: readonly Recurso[];
}

export function definir<T>(recurso: Recurso<T>): Recurso {
  return recurso as unknown as Recurso;
}

export function urlEliminar(
  recurso: Recurso,
  fila: Fila,
): { url: string; params?: Record<string, string> } {
  if (recurso.eliminar) {
    return recurso.eliminar(fila);
  }
  return { url: recurso.urlDe?.(recurso.id(fila)) ?? recurso.url };
}

export function conMayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function participio(
  recurso: Recurso,
  raiz: 'registrad' | 'actualizad' | 'eliminad',
): string {
  return `${raiz}${recurso.genero === 'f' ? 'a' : 'o'}`;
}

export function textoDe(valor: unknown): string {
  return valor === null || valor === undefined ? '' : String(valor);
}

export function opcionesDe<T>(
  lista: readonly T[] | undefined,
  valor: (item: T) => string | number,
  etiqueta: (item: T) => string,
  grupo?: (item: T) => string,
): Opcion[] | undefined {
  return lista
    ?.map((item) => ({
      valor: String(valor(item)),
      etiqueta: etiqueta(item),
      grupo: grupo?.(item),
    }))
    .sort(
      (a, b) =>
        (a.grupo ?? '').localeCompare(b.grupo ?? '', 'es') ||
        a.etiqueta.localeCompare(b.etiqueta, 'es', { numeric: true }),
    );
}

export function opcionesFijas(etiquetas: Record<string, string>): FuenteOpciones {
  const opciones = Object.entries(etiquetas).map(([valor, etiqueta]) => ({ valor, etiqueta }));
  return () => opciones;
}
