import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'logo' },
  template: `
    <img
      class="logo__img logo__img--claro"
      src="/marca/logo-claro.png"
      alt=""
      width="242"
      height="120"
    />
    <img
      class="logo__img logo__img--oscuro"
      src="/marca/logo-oscuro.png"
      alt=""
      width="242"
      height="120"
    />
  `,
})
export class Logo {}
