import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { NOMBRE_APP } from '../app-info';

@Injectable({ providedIn: 'root' })
export class TituloPorRuta extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const titulo = this.buildTitle(snapshot);
    this.title.setTitle(titulo ? `${titulo} | ${NOMBRE_APP}` : NOMBRE_APP);
  }
}
