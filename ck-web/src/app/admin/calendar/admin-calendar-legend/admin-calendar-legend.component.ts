import { Component, input } from '@angular/core';
import { Driver } from '../../admin-api.service';

export type CalendarLegendVariant = 'calendar' | 'drivers' | 'timeline';

@Component({
  selector: 'app-admin-calendar-legend',
  standalone: true,
  templateUrl: './admin-calendar-legend.component.html',
  styleUrl: './admin-calendar-legend.component.css',
})
export class AdminCalendarLegendComponent {
  drivers = input<Driver[]>([]);
  variant = input.required<CalendarLegendVariant>();
}
