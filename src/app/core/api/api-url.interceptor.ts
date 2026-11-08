import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const PREFIJOS_API = ['/api/', '/auth/'];

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (!PREFIJOS_API.some((prefijo) => req.url.startsWith(prefijo))) {
    return next(req);
  }
  return next(req.clone({ url: environment.apiUrl + req.url }));
};
