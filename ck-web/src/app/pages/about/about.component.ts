import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  imports: [],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {
  services = [
    'Zájazdy',
    'Letisko',
    'Svadby',
    'Školenia',
    'Dovolenky',
    'Služobné cesty',
    'Jednodňové výlety',
    'Nákupy doma aj v zahraničí',
    'Športové a kultúrne podujatia',
    'Ski-bus k lyžiarskym strediskám',
  ];
}
