import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    @if (!isAdmin()) { <app-header /> }
    <router-outlet />
    @if (!isAdmin()) { <app-footer /> }
  `,
})
export class AppComponent {
  private url = toSignal(
    inject(Router).events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: inject(Router).url },
  );

  isAdmin = computed(() => this.url().startsWith('/admin'));
}
