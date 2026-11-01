import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const RUTAS_CON_TOKEN = ['/api/', '/auth/yo'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!RUTAS_CON_TOKEN.some((ruta) => req.url.startsWith(ruta))) {
    return next(req);
  }
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 && token) {
          auth.sesionVencida();
        } else if (error.status === 403 && req.method === 'GET') {
          void router.navigateByUrl('/sin-permiso', { skipLocationChange: true });
        }
      }
      return throwError(() => error);
    }),
  );
};
