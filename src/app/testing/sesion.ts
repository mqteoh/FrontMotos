import { Rol, Usuario } from '../core/api/modelos';

export const USUARIOS_PRUEBA: Record<Rol, Usuario> = {
  CLIENTE: { id: 1, nombre: 'María Ramírez', correo: 'maria.ramirez@correo.test', rol: 'CLIENTE', idSucursal: null },
  DUENO: { id: 1, nombre: 'Ricardo Salazar', correo: 'ricardo.salazar@concesionario-motos.test', rol: 'DUENO', idSucursal: 1 },
  VENDEDOR: { id: 2, nombre: 'Laura Gómez', correo: 'laura.gomez@concesionario-motos.test', rol: 'VENDEDOR', idSucursal: 1 },
  TECNICO: { id: 5, nombre: 'Jhon Castaño', correo: 'jhon.castano@concesionario-motos.test', rol: 'TECNICO', idSucursal: 1 },
};

export function guardarSesionDePrueba(rol: Rol, token = 'token-de-prueba'): void {
  localStorage.setItem(
    'sesion',
    JSON.stringify({ token, expiraEn: Date.now() + 60_000, usuario: USUARIOS_PRUEBA[rol] }),
  );
}
