export type TipoMoto =
  | 'CALLE'
  | 'DEPORTIVA'
  | 'NAKED'
  | 'SCOOTER'
  | 'ENDURO'
  | 'TOURING'
  | 'DOBLE_PROPOSITO';

export type EstadoReserva = 'ACTIVA' | 'CONCRETADA' | 'CANCELADA' | 'VENCIDA';

export type EstadoReparacion = 'AGENDADA' | 'EN_PROCESO' | 'FINALIZADA' | 'CANCELADA';

export type Rol = 'CLIENTE' | 'DUENO' | 'VENDEDOR' | 'TECNICO';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  idSucursal: number | null;
}

export interface RespuestaToken {
  token: string;
  tipo: string;
  expiraEnMs: number;
  usuario: Usuario;
}

export interface Credenciales {
  correo: string;
  contrasena: string;
}

export interface RegistroCliente {
  documento: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  ciudad: string;
  barrio: string;
  calle: string;
  numeroDireccion: string;
  telefono: string | null;
  correo: string;
  contrasena: string;
}

export interface ErrorApi {
  estado: number;
  mensaje: string;
  campos: { campo: string; mensaje: string }[];
  ruta: string;
  fecha: string;
}

export type OrdenCatalogo = 'MARCA' | 'PRECIO_ASC' | 'PRECIO_DESC' | 'CILINDRAJE';

export interface Pagina<T> {
  contenido: T[];
  pagina: number;
  tamano: number;
  totalElementos: number;
  totalPaginas: number;
}

export interface Sucursal {
  idSucursal: number;
  nombre: string;
  ciudad: string;
  barrio: string;
  calle: string;
  numeroDireccion: string;
}

export interface FiltrosCatalogo {
  marcas: { valor: string; disponibles: number }[];
  tipos: { valor: string; disponibles: number }[];
  sedes: { idSucursal: number; nombre: string; ciudad: string; disponibles: number }[];
  precioMinimo: number | null;
  precioMaximo: number | null;
  totalDisponibles: number;
}

export interface MotoDetalle {
  placa: string;
  idMarca: number;
  marca: string;
  paisOrigenMarca: string;
  nroModelo: number;
  modelo: string;
  tipoMoto: TipoMoto;
  cilindraje: number;
  potenciaHp: number;
  capacidadTanque: number;
  anio: number;
  color: string;
  kilometraje: number;
  precio: number;
  sucursal: Sucursal;
}

export interface Accesorio {
  idAccesorio: number;
  nombre: string;
  marca: string;
  descripcion: string | null;
  precio: number;
}

export interface MotoCatalogo {
  placa: string;
  marca: string;
  modelo: string;
  tipoMoto: TipoMoto;
  cilindraje: number;
  anio: number;
  color: string;
  precio: number;
  idSucursal: number;
  sucursal: string;
  ciudad: string;
}
