import { Component } from '@angular/core';

@Component({
  selector: 'app-skibus',
  imports: [],
  templateUrl: './skibus.component.html',
  styleUrl: './skibus.component.css',
})
export class SkibusComponent {
  schedule = [
    { stop: 'Habovka – Stodolisko',       departure: '8.20', arrival: '16.50' },
    { stop: 'Habovka – kostol',            departure: '8.25', arrival: '16.45' },
    { stop: 'Zuberec – kostol',            departure: '8.30', arrival: '16.40' },
    { stop: 'Zuberec – vyšný koniec',      departure: '8.32', arrival: '16.35' },
    { stop: 'Zuberec – hotel Tatrawest',   departure: '8.35', arrival: '16.30' },
    { stop: 'Lyžiarske stredisko Spálená', departure: 'príchod 8.50', arrival: 'odchod 16.15', isDestination: true },
  ];

  groupPrices = [
    { route: 'Zuberec – Lyžiarske stredisko Spálená', price: '35,– €' },
    { route: 'Habovka – Lyžiarske stredisko Spálená', price: '40,– €' },
    { route: 'Huty – Lyžiarske stredisko Spálená',    price: '50,– €' },
  ];
}
