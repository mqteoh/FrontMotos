import { Rol } from '../api/modelos';
import { NombreIcono } from '../../shared/ui/icono/iconos';

export interface ItemMenu {
  etiqueta: string;
  ruta: string;
  icono: NombreIcono;
  exacta?: boolean;
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
const REPORTES: ItemMenu = { etiqueta: 'Reportes', ruta: '/reportes', icono: 'grafico' };
const VENTAS: ItemMenu = { etiqueta: 'Ventas', ruta: '/vendedor', icono: 'venta' };
const TALLER: ItemMenu = { etiqueta: 'Taller', ruta: '/tecnico', icono: 'taller' };

export const MENU_PANEL: Record<Rol, readonly ItemMenu[]> = {
  CLIENTE: [],
  DUENO: [ADMINISTRACION, REPORTES, VENTAS, TALLER],
  VENDEDOR: [
    { etiqueta: 'Reservas', ruta: '/vendedor', icono: 'reloj', exacta: true },
    { etiqueta: 'Clientes', ruta: '/vendedor/clientes', icono: 'usuario' },
    { etiqueta: 'Ventas', ruta: '/vendedor/ventas', icono: 'venta' },
  ],
  TECNICO: [
    { etiqueta: 'Reparaciones', ruta: '/tecnico', icono: 'taller', exacta: true },
    { etiqueta: 'Registrar', ruta: '/tecnico/nueva', icono: 'agregar' },
    { etiqueta: 'Historial', ruta: '/tecnico/historial', icono: 'buscar' },
  ],
};
