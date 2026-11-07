import { NgStyle } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { CalendarData, CalendarDeparture, CalendarScheduledRide, Driver } from '../../admin-api.service';
import { AdminCalendarLegendComponent } from '../admin-calendar-legend/admin-calendar-legend.component';
import {
  WEEK_DAYS,
  buildMonthDays,
  buildWeekDays,
  hexToRgba,
  isToday,
  toDateKey,
} from '../../../shared/utils/calendar-date.utils';

export type CalendarViewMode = 'week' | 'month';

@Component({
  selector: 'app-admin-calendar-grid-view',
  standalone: true,
  imports: [NgStyle, AdminCalendarLegendComponent],
  templateUrl: './admin-calendar-grid-view.component.html',
  styleUrl: './admin-calendar-grid-view.component.css',
})
export class AdminCalendarGridViewComponent {
  calendarData = input<CalendarData | null>(null);
  drivers = input<Driver[]>([]);
  currentDate = input.required<Date>();
  viewMode = input.required<CalendarViewMode>();
  canCreateRide = input(true);

  openNewRide = output<Date>();
  openEditDeparture = output<CalendarDeparture>();
  openEditRide = output<CalendarScheduledRide>();

  readonly WEEK_DAYS = WEEK_DAYS;
  isToday = isToday;

  gridDays = computed<(Date | null)[]>(() =>
    this.viewMode() === 'week' ? buildWeekDays(this.currentDate()) : buildMonthDays(this.currentDate())
  );

  private dayMap = computed(() => {
    const data = this.calendarData();
    const map = new Map<string, { departures: CalendarDeparture[]; rides: CalendarScheduledRide[] }>();
    if (!data) return map;
    for (const dep of data.departures) {
      const key = dep.date.slice(0, 10);
      if (!map.has(key)) map.set(key, { departures: [], rides: [] });
      map.get(key)!.departures.push(dep);
    }
    for (const ride of data.scheduledRides) {
      const key = ride.date.slice(0, 10);
      if (!map.has(key)) map.set(key, { departures: [], rides: [] });
      map.get(key)!.rides.push(ride);
    }
    return map;
  });

  isCurrentMonth(d: Date | null): boolean {
    if (!d) return false;
    return d.getMonth() === this.currentDate().getMonth() && d.getFullYear() === this.currentDate().getFullYear();
  }

  getDayData(d: Date | null) {
    if (!d) return { departures: [] as CalendarDeparture[], rides: [] as CalendarScheduledRide[] };
    const entry = this.dayMap().get(toDateKey(d));
    const deps = [...(entry?.departures ?? [])].sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    const rides = [...(entry?.rides ?? [])].sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    return { departures: deps, rides };
  }

  chipStyle(driver: Driver | null): Record<string, string> {
    const color = driver?.color;
    if (!color) return { background: '#f3f4f6', 'border-left-color': '#d1d5db' };
    return { background: hexToRgba(color, 0.1), 'border-left-color': color };
  }

  formatTimeRange(from: string | null, to: string | null): string {
    if (from && to) return `${from} – ${to}`;
    if (from) return from;
    if (to) return `do ${to}`;
    return '';
  }
}
