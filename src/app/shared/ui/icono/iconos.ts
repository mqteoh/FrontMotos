import arrowLeft from '@phosphor-icons/core/regular/arrow-left.svg';
import arrowClockwise from '@phosphor-icons/core/regular/arrow-clockwise.svg';
import arrowsDownUp from '@phosphor-icons/core/regular/arrows-down-up.svg';
import calendarCheck from '@phosphor-icons/core/regular/calendar-check.svg';
import caretDown from '@phosphor-icons/core/regular/caret-down.svg';
import caretUp from '@phosphor-icons/core/regular/caret-up.svg';
import chartBar from '@phosphor-icons/core/regular/chart-bar.svg';
import checkCircle from '@phosphor-icons/core/regular/check-circle.svg';
import clock from '@phosphor-icons/core/regular/clock.svg';
import downloadSimple from '@phosphor-icons/core/regular/download-simple.svg';
import eyeSlash from '@phosphor-icons/core/regular/eye-slash.svg';
import eye from '@phosphor-icons/core/regular/eye.svg';
import handshake from '@phosphor-icons/core/regular/handshake.svg';
import hourglass from '@phosphor-icons/core/regular/hourglass.svg';
import info from '@phosphor-icons/core/regular/info.svg';
import list from '@phosphor-icons/core/regular/list.svg';
import magnifyingGlass from '@phosphor-icons/core/regular/magnifying-glass.svg';
import moon from '@phosphor-icons/core/regular/moon.svg';
import motorcycle from '@phosphor-icons/core/regular/motorcycle.svg';
import receipt from '@phosphor-icons/core/regular/receipt.svg';
import scooter from '@phosphor-icons/core/regular/scooter.svg';
import signIn from '@phosphor-icons/core/regular/sign-in.svg';
import signOut from '@phosphor-icons/core/regular/sign-out.svg';
import storefront from '@phosphor-icons/core/regular/storefront.svg';
import sun from '@phosphor-icons/core/regular/sun.svg';
import table from '@phosphor-icons/core/regular/table.svg';
import userCircle from '@phosphor-icons/core/regular/user-circle.svg';
import warningCircle from '@phosphor-icons/core/regular/warning-circle.svg';
import wrench from '@phosphor-icons/core/regular/wrench.svg';
import pencilSimple from '@phosphor-icons/core/regular/pencil-simple.svg';
import plus from '@phosphor-icons/core/regular/plus.svg';
import trash from '@phosphor-icons/core/regular/trash.svg';
import xCircle from '@phosphor-icons/core/regular/x-circle.svg';
import x from '@phosphor-icons/core/regular/x.svg';

export const ICONOS = {
  agendada: calendarCheck,
  agregar: plus,
  atras: arrowLeft,
  cancelado: xCircle,
  buscar: magnifyingGlass,
  caretAbajo: caretDown,
  caretArriba: caretUp,
  cerrar: x,
  editar: pencilSimple,
  concretada: handshake,
  descargar: downloadSimple,
  entrar: signIn,
  error: warningCircle,
  exito: checkCircle,
  grafico: chartBar,
  info,
  luna: moon,
  menu: list,
  moto: motorcycle,
  ocultar: eyeSlash,
  ordenar: arrowsDownUp,
  quitar: trash,
  reintentar: arrowClockwise,
  reloj: clock,
  salir: signOut,
  scooter,
  sede: storefront,
  sol: sun,
  tabla: table,
  taller: wrench,
  usuario: userCircle,
  vencido: hourglass,
  venta: receipt,
  ver: eye,
} as const;

export type NombreIcono = keyof typeof ICONOS;
