import { Routes } from '@angular/router';
import { AreaPendiente } from '../../shared/ui/area-pendiente/area-pendiente';

export default [
  {
    path: '',
    title: 'Panel del dueño',
    component: AreaPendiente,
    data: {
      titulo: 'Panel del dueño',
      descripcion: 'Aquí estará la administración de todas las tablas y los reportes de gestión.',
      fase: 'F8 y F9',
    },
  },
] satisfies Routes;
