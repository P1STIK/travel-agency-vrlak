import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  private router = inject(Router);

  // top bar
  phone = '+421 900 000 000';
  email = 'info@v-trans.sk';

  // navbar
  openMobile = signal(false);
  openTours = signal(false); // dropdown „Zájazdy“

  nav = [
    { label: 'Domov', path: '/' },
    { label: 'O spoločnosti', path: '/o-nas' },
    // „Zájazdy“ má submenu, hlavný odkaz nech ostane tiež klikateľný:
    { label: 'Zájazdy', path: '/zajazdy', hasMenu: true },
    { label: 'Ski-bus', path: '/ski-bus' },
    { label: 'Galéria', path: '/galeria' },
  ];

  toursMenu = [
    { label: 'Všetky zájazdy',   category: null },
    { label: 'Letné dovolenky',  category: 'letne' },
    { label: 'Jednodňové výlety', category: 'jednodnove' },
    { label: 'Silvestr',         category: 'silvestr' },
    { label: 'Lyžovačky',        category: 'lyzovacky' },
    { label: 'Púte',             category: 'pute' },
  ];

  // transparentná hlavička len na / (home)
  isHome = computed(() => this.router.url === '/' || this.router.url === '/home');

  scrolled = signal(false);
  @HostListener('window:scroll') onScroll() {
    this.scrolled.set(window.scrollY > 10);
  }

  closeAllMenus() {
    this.openTours.set(false);
    this.openMobile.set(false);
  }
}