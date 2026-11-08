import { Injectable, signal } from '@angular/core';
import { UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class UltimaBusqueda {
  readonly url = signal<UrlTree | string>('/');
}
