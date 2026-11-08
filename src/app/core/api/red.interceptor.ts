import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { TimeoutError, catchError, retry, throwError, timeout, timer } from 'rxjs';

export const ESPERA_MAXIMA_MS = 45_000;
export const REINTENTOS = 2;
const PAUSA_BASE_MS = 1_000;
const ESTADOS_REINTENTABLES = [0, 502, 503, 504];

export const MENSAJE_ESPERA_LECTURA =
  'El servidor tardó demasiado en responder. Inténtalo de nuevo en un momento.';
export const MENSAJE_ESPERA_CAMBIO =
  'El servidor tardó demasiado en responder. Revisa si el cambio quedó guardado antes de repetirlo.';

function reintentable(error: unknown): boolean {
  return error instanceof HttpErrorResponse && ESTADOS_REINTENTABLES.includes(error.status);
}

export const redInterceptor: HttpInterceptorFn = (req, next) => {
  const lectura = req.method === 'GET';
  return next(req).pipe(
    timeout(ESPERA_MAXIMA_MS),
    retry({
      count: lectura ? REINTENTOS : 0,
      delay: (error, intento) =>
        reintentable(error) ? timer(PAUSA_BASE_MS * intento) : throwError(() => error),
    }),
    catchError((error: unknown) => {
      if (!(error instanceof TimeoutError)) {
        return throwError(() => error);
      }
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 408,
            statusText: 'Tiempo de espera agotado',
            url: req.urlWithParams,
            error: {
              estado: 408,
              mensaje: lectura ? MENSAJE_ESPERA_LECTURA : MENSAJE_ESPERA_CAMBIO,
              campos: [],
            },
          }),
      );
    }),
  );
};
