import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { apiUrlInterceptor } from './api-url.interceptor';
import { environment } from '../../../environments/environment';

describe('apiUrlInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiUrlInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it.each(['/api/publico/marcas', '/auth/login'])('antepone la URL base a %s', (ruta) => {
    http.get(ruta).subscribe();
    backend.expectOne(environment.apiUrl + ruta).flush({});
  });

  it('no toca las rutas que no son de la API', () => {
    http.get('/favicon.ico').subscribe();
    backend.expectOne('/favicon.ico').flush('');
  });
});
