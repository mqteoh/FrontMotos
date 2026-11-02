import { Routes } from '@angular/router';
import { RECURSOS_ADMIN } from './recursos';

const lista = () => import('./lista-admin');
const formulario = () => import('./formulario-admin');

export default [
  { path: '', title: 'Administración', loadComponent: () => import('./inicio-admin') },
  ...RECURSOS_ADMIN.flatMap((recurso) => {
    const data = { recurso };
    const rutas: Routes = [
      { path: recurso.ruta, title: recurso.titulo, data, loadComponent: lista },
    ];
    if (recurso.campos) {
      rutas.push({
        path: `${recurso.ruta}/nuevo`,
        title: `Registrar ${recurso.singular}`,
        data,
        loadComponent: formulario,
      });
    }
    if (recurso.campos && recurso.editable !== false) {
      rutas.push({
        path: `${recurso.ruta}/:id`,
        title: `Editar ${recurso.singular}`,
        data,
        loadComponent: formulario,
      });
    }
    return rutas;
  }),
] satisfies Routes;
