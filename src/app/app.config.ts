import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { apiUrlInterceptor } from './core/api/api-url.interceptor';
import { authInterceptor } from './core/auth/auth.interceptor';
import { TituloPorRuta } from './core/titulo/titulo-por-ruta';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, apiUrlInterceptor])),
    { provide: TitleStrategy, useClass: TituloPorRuta },
  ],
};
