import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Bus, CalendarDeparture, CalendarScheduledRide, Driver } from '../../admin-api.service';

export interface EditState {
  type: 'departure' | 'ride';
  data: CalendarDeparture | CalendarScheduledRide;
  driverId: string;
  busId: string;
  time: string;
  timeTo: string;
  rideLabel: string;
  rideNote: string;
  readonly: boolean;
  lockDriver: boolean;
}

export interface NewRideState {
  date: string;
  label: string;
  time: string;
  timeTo: string;
  busId: string;
  note: string;
  driverId: string;
  lockDriver: boolean;
}

@Component({
  selector: 'app-admin-calendar-ride-panel',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './admin-calendar-ride-panel.component.html',
  styleUrl: './admin-calendar-ride-panel.component.css',
})
export class AdminCalendarRidePanelComponent {
  editState = input<EditState | null>(null);
  newRideState = input<NewRideState | null>(null);
  drivers = input<Driver[]>([]);
  buses = input<Bus[]>([]);
  saving = input(false);
  error = input('');

  close = output<void>();
  saveEdit = output<void>();
  saveNewRide = output<void>();
  deleteRide = output<void>();

  asDeparture(es: EditState): CalendarDeparture { return es.data as CalendarDeparture; }
  asRide(es: EditState): CalendarScheduledRide { return es.data as CalendarScheduledRide; }
}
