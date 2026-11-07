import { Component, computed, input } from '@angular/core';
import { CalendarData, Driver } from '../../admin-api.service';
import { AdminCalendarLegendComponent } from '../admin-calendar-legend/admin-calendar-legend.component';

export interface TimelineTrip {
  type: 'departure' | 'ride';
  id: string;
  label: string;
  startMin: number;
  endMin: number;
  busColor: string;
  busPlate: string;
  lane: number;
}

export interface TimelineRow {
  driver: Driver;
  trips: TimelineTrip[];
  laneCount: number;
}

@Component({
  selector: 'app-admin-calendar-timeline-view',
  standalone: true,
  imports: [AdminCalendarLegendComponent],
  templateUrl: './admin-calendar-timeline-view.component.html',
  styleUrl: './admin-calendar-timeline-view.component.css',
})
export class AdminCalendarTimelineViewComponent {
  calendarData = input<CalendarData | null>(null);
  drivers = input<Driver[]>([]);

  // Timeline: 05:00 – 22:00, 1.5 px per minute
  readonly TL_START = 5 * 60;
  readonly TL_END   = 22 * 60;
  readonly TL_PX    = 1.5;
  readonly TL_W     = (this.TL_END - this.TL_START) * this.TL_PX; // 1530px
  readonly TL_HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5..22

  timelineRows = computed<TimelineRow[]>(() => {
    const data = this.calendarData();
    const allDrivers = this.drivers();
    if (!data) return allDrivers.map(d => ({ driver: d, trips: [], laneCount: 1 }));

    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

    return allDrivers.map(driver => {
      const raw: Omit<TimelineTrip, 'lane'>[] = [];

      for (const dep of data.departures.filter(d => d.driverId === driver.id && d.time)) {
        const startMin = toMin(dep.time!);
        const endMin   = dep.timeTo ? toMin(dep.timeTo) : startMin + 60;
        raw.push({ type: 'departure', id: dep.id, label: dep.tour.title, startMin, endMin, busColor: dep.bus?.color ?? '', busPlate: dep.bus?.licensePlate ?? '' });
      }
      for (const ride of data.scheduledRides.filter(r => r.driverId === driver.id && r.time)) {
        const startMin = toMin(ride.time!);
        const endMin   = ride.timeTo ? toMin(ride.timeTo) : startMin + 60;
        raw.push({ type: 'ride', id: ride.id, label: ride.label, startMin, endMin, busColor: ride.bus?.color ?? '', busPlate: ride.bus?.licensePlate ?? '' });
      }

      // Assign lanes (greedy interval scheduling)
      const sorted = [...raw].sort((a, b) => a.startMin - b.startMin);
      const laneEnds: number[] = [];
      const trips: TimelineTrip[] = sorted.map(trip => {
        let lane = laneEnds.findIndex(end => end <= trip.startMin);
        if (lane === -1) { lane = laneEnds.length; laneEnds.push(0); }
        laneEnds[lane] = trip.endMin;
        return { ...trip, lane };
      });

      return { driver, trips, laneCount: Math.max(1, laneEnds.length) };
    });
  });

  tlLeft(startMin: number): string {
    return `${Math.max(0, (startMin - this.TL_START) * this.TL_PX)}px`;
  }

  tlWidth(startMin: number, endMin: number): string {
    const s = Math.max(startMin, this.TL_START);
    const e = Math.min(endMin, this.TL_END);
    return `${Math.max(this.TL_PX * 15, (e - s) * this.TL_PX)}px`; // min 15min visible
  }

  tlHourLeft(hour: number): string {
    return `${(hour * 60 - this.TL_START) * this.TL_PX}px`;
  }

  tlRowHeight(laneCount: number): string {
    return `${laneCount * 32 + 8}px`;
  }

  tlBarTop(lane: number): string {
    return `${lane * 32 + 4}px`;
  }
}
