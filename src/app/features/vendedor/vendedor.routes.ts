import { Routes } from '@angular/router';
import { AreaPendiente } from '../../shared/ui/area-pendiente/area-pendiente';

export default [
  {
    path: '',
    title: 'Panel del vendedor',
    component: AreaPendiente,
    data: {
      titulo: 'Panel del vendedor',
      descripcion: 'Aquí estarán las reservas de la sede, la búsqueda de clientes y el registro de ventas.',
      fase: 'F6',
    },
  },
] satisfies Routes;
