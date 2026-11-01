import { paginasVisibles } from '../../shared/ui/paginacion/paginacion';
import {
  BUSQUEDA_INICIAL,
  aParametrosUrl,
  contarFiltros,
  leerBusqueda,
  solicitudMotos,
} from './publico-api';

describe('Búsqueda del catálogo', () => {
  it('lee los filtros de la URL y descarta valores que no sirven', () => {
    expect(
      leerBusqueda({
        texto: '  nmax ',
        marca: 'Yamaha',
        sede: '2',
        precioMin: 'barato',
        precioMax: '20000000',
        orden: 'ALFABETICO',
        pagina: '-3',
      }),
    ).toEqual({
      ...BUSQUEDA_INICIAL,
      texto: 'nmax',
      marca: 'Yamaha',
      sede: 2,
      precioMax: 20000000,
    });
  });

  it('solo pone en la URL lo que cambia frente a los valores por defecto', () => {
    expect(aParametrosUrl(BUSQUEDA_INICIAL)).toEqual({});
    expect(
      aParametrosUrl({ ...BUSQUEDA_INICIAL, tipo: 'SCOOTER', orden: 'PRECIO_ASC', pagina: 2 }),
    ).toEqual({ tipo: 'SCOOTER', orden: 'PRECIO_ASC', pagina: 2 });
  });

  it('traduce la búsqueda a los parámetros del back', () => {
    expect(
      solicitudMotos({ ...BUSQUEDA_INICIAL, sede: 3, precioMin: 5000000, pagina: 2 }),
    ).toEqual({
      url: '/api/publico/motos',
      params: { pagina: 1, tamano: 12, orden: 'MARCA', idSucursal: 3, precioMin: 5000000 },
    });
  });

  it('cuenta el rango de precio como un solo filtro', () => {
    expect(
      contarFiltros({ ...BUSQUEDA_INICIAL, marca: 'KTM', precioMin: 1, precioMax: 2 }),
    ).toBe(2);
  });

  it('muestra todas las páginas si son pocas y recorta con saltos si son muchas', () => {
    expect(paginasVisibles(2, 4)).toEqual([1, 2, 3, 4]);
    expect(paginasVisibles(6, 12)).toEqual([1, null, 5, 6, 7, null, 12]);
    expect(paginasVisibles(1, 12)).toEqual([1, 2, null, 12]);
  });
});
