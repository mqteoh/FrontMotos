import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { Rol } from '../api/modelos';
import { AuthService } from './auth.service';
import { INICIO_ROL } from './roles';

export function conRol(...roles: Rol[]): CanActivateFn {
  return (_ruta, estado) => {
    const usuario = inject(AuthService).usuario();
    const router = inject(Router);
    if (!usuario) {
      return router.createUrlTree(['/ingresar'], { queryParams: { volver: estado.url } });
    }
    if (roles.includes(usuario.rol)) {
      return true;
    }
    return new RedirectCommand(router.parseUrl('/sin-permiso'), { browserUrl: estado.url });
  };
}

export const soloInvitado: CanActivateFn = () => {
  const usuario = inject(AuthService).usuario();
  return usuario ? inject(Router).parseUrl(INICIO_ROL[usuario.rol]) : true;
};
