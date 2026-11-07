import { Component, computed, input } from '@angular/core';
import { CalendarData, Driver } from '../../admin-api.service';
import { AdminCalendarLegendComponent } from '../admin-calendar-legend/admin-calendar-legend.component';
import { WEEK_DAYS, buildWeekDays, isToday, toDateKey } from '../../../shared/utils/calendar-date.utils';

export interface DriverTrip {
  type: 'departure' | 'ride';
  id: string;
  label: string;
  time: string;
  busColor: string;
  busPlate: string;
}

export interface DriverScheduleRow {
  driver: Driver;
  dayTrips: Map<string, DriverTrip[]>;
  total: number;
}

@Component({
  selector: 'app-admin-calendar-drivers-view',
  standalone: true,
  imports: [AdminCalendarLegendComponent],
  templateUrl: './admin-calendar-drivers-view.component.html',
  styleUrl: './admin-calendar-drivers-view.component.css',
})
export class AdminCalendarDriversViewComponent {
  calendarData = input<CalendarData | null>(null);
  drivers = input<Driver[]>([]);
  currentDate = input.required<Date>();

  readonly WEEK_DAYS = WEEK_DAYS;
  isToday = isToday;

  scheduleWeekDays = computed<Date[]>(() => buildWeekDays(this.currentDate()));

  driverSchedule = computed<DriverScheduleRow[]>(() => {
    const data = this.calendarData();
    const allDrivers = this.drivers();
    if (!data) return allDrivers.map(d => ({ driver: d, dayTrips: new Map(), total: 0 }));

    return allDrivers.map(driver => {
      const dayTrips = new Map<string, DriverTrip[]>();

      for (const dep of data.departures.filter(d => d.driverId === driver.id)) {
        const key = dep.date.slice(0, 10);
        if (!dayTrips.has(key)) dayTrips.set(key, []);
        dayTrips.get(key)!.push({ type: 'departure', id: dep.id, label: dep.tour.title, time: dep.time ?? '', busColor: dep.bus?.color ?? '', busPlate: dep.bus?.licensePlate ?? '' });
      }
      for (const ride of data.scheduledRides.filter(r => r.driverId === driver.id)) {
        const key = ride.date.slice(0, 10);
        if (!dayTrips.has(key)) dayTrips.set(key, []);
        dayTrips.get(key)!.push({ type: 'ride', id: ride.id, label: ride.label, time: ride.time ?? '', busColor: ride.bus?.color ?? '', busPlate: ride.bus?.licensePlate ?? '' });
      }
      for (const trips of dayTrips.values()) {
        trips.sort((a, b) => a.time.localeCompare(b.time));
      }

      const total = [...dayTrips.values()].reduce((s, t) => s + t.length, 0);
      return { driver, dayTrips, total };
    });
  });

  getDriverDayTrips(row: DriverScheduleRow, day: Date): DriverTrip[] {
    return row.dayTrips.get(toDateKey(day)) ?? [];
  }
}
