import { Rol } from '../api/modelos';
import { NombreIcono } from '../../shared/ui/icono/iconos';

export interface ItemMenu {
  etiqueta: string;
  ruta: string;
  icono: NombreIcono;
}

export const NOMBRE_ROL: Record<Rol, string> = {
  CLIENTE: 'Cliente',
  DUENO: 'Dueño',
  VENDEDOR: 'Vendedor',
  TECNICO: 'Técnico',
};

export const INICIO_ROL: Record<Rol, string> = {
  CLIENTE: '/cliente',
  DUENO: '/admin',
  VENDEDOR: '/vendedor',
  TECNICO: '/tecnico',
};

const ADMINISTRACION: ItemMenu = { etiqueta: 'Administración', ruta: '/admin', icono: 'tabla' };
const VENTAS: ItemMenu = { etiqueta: 'Ventas', ruta: '/vendedor', icono: 'venta' };
const TALLER: ItemMenu = { etiqueta: 'Taller', ruta: '/tecnico', icono: 'taller' };

export const MENU_PANEL: Record<Rol, readonly ItemMenu[]> = {
  CLIENTE: [],
  DUENO: [ADMINISTRACION, VENTAS, TALLER],
  VENDEDOR: [VENTAS],
  TECNICO: [TALLER],
};
