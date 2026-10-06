import { DatePipe, NgStyle } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminApiService,
  Bus,
  CalendarData,
  CalendarDeparture,
  CalendarScheduledRide,
  Driver,
} from '../admin-api.service';

type ViewMode = 'week' | 'month';
type ActiveTab = 'calendar' | 'drivers' | 'timeline';

interface EditState {
  type: 'departure' | 'ride';
  data: CalendarDeparture | CalendarScheduledRide;
  driverId: string;
  busId: string;
  time: string;
  timeTo: string;
  rideLabel: string;
  rideNote: string;
}

interface NewRideState {
  date: string;
  label: string;
  time: string;
  timeTo: string;
  busId: string;
  note: string;
  driverId: string;
}

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
  selector: 'app-admin-calendar',
  standalone: true,
  imports: [FormsModule, DatePipe, NgStyle],
  templateUrl: './admin-calendar.component.html',
  styleUrl: './admin-calendar.component.css',
})
export class AdminCalendarComponent implements OnInit {
  private api = inject(AdminApiService);

  activeTab = signal<ActiveTab>('calendar');
  viewMode = signal<ViewMode>('month');
  currentDate = signal(new Date());
  calendarData = signal<CalendarData | null>(null);
  drivers = signal<Driver[]>([]);
  buses = signal<Bus[]>([]);
  loading = signal(false);
  editState = signal<EditState | null>(null);
  newRideState = signal<NewRideState | null>(null);
  saving = signal(false);

  readonly WEEK_DAYS = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];
  readonly MONTHS = ['Január','Február','Marec','Apríl','Máj','Jún','Júl','August','September','Október','November','December'];
  readonly DAY_NAMES = ['Nedeľa','Pondelok','Utorok','Streda','Štvrtok','Piatok','Sobota'];

  // Timeline: 05:00 – 22:00, 1.5 px per minute
  readonly TL_START = 5 * 60;
  readonly TL_END   = 22 * 60;
  readonly TL_PX    = 1.5;
  readonly TL_W     = (this.TL_END - this.TL_START) * this.TL_PX; // 1530px
  readonly TL_HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5..22

  gridDays = computed<(Date | null)[]>(() =>
    this.viewMode() === 'week' ? this.buildWeekDays(this.currentDate()) : this.buildMonthDays(this.currentDate())
  );

  scheduleWeekDays = computed<Date[]>(() => this.buildWeekDays(this.currentDate()));

  dayMap = computed(() => {
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

  headerLabel = computed(() => {
    const d = this.currentDate();
    if (this.activeTab() === 'timeline') {
      return `${this.DAY_NAMES[d.getDay()]} ${d.getDate()}. ${this.MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }
    if (this.viewMode() === 'month' && this.activeTab() === 'calendar') {
      return `${this.MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }
    const mon = this.weekStart(d);
    const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
    if (mon.getMonth() === sun.getMonth()) {
      return `${mon.getDate()}. – ${sun.getDate()}. ${this.MONTHS[mon.getMonth()]} ${mon.getFullYear()}`;
    }
    return `${mon.getDate()}. ${this.MONTHS[mon.getMonth()]} – ${sun.getDate()}. ${this.MONTHS[sun.getMonth()]} ${sun.getFullYear()}`;
  });

  constructor() {
    effect(() => {
      const d = this.currentDate();
      const mode = this.viewMode();
      const tab = this.activeTab();
      this.loadCalendar(d, mode, tab);
    });
  }

  ngOnInit() {
    this.api.getDrivers().subscribe(d => this.drivers.set(d));
    this.api.getBuses().subscribe(b => this.buses.set(b));
  }

  toKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private weekStart(d: Date): Date {
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diff);
    mon.setHours(0, 0, 0, 0);
    return mon;
  }

  buildWeekDays(d: Date): Date[] {
    const mon = this.weekStart(d);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(mon); day.setDate(mon.getDate() + i); return day;
    });
  }

  private buildMonthDays(d: Date): (Date | null)[] {
    const year = d.getFullYear(), month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;
    const days: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }

  private loadCalendar(d: Date, mode: ViewMode, tab: ActiveTab) {
    let from: Date, to: Date;
    if (tab === 'timeline') {
      from = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      to   = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    } else if (mode === 'week' || tab === 'drivers') {
      from = this.weekStart(d);
      to = new Date(from); to.setDate(from.getDate() + 6);
    } else {
      from = new Date(d.getFullYear(), d.getMonth(), 1);
      to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }
    this.loading.set(true);
    this.api.getCalendar(this.toKey(from), this.toKey(to)).subscribe({
      next: data => { this.calendarData.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  navigate(dir: -1 | 1) {
    const d = new Date(this.currentDate());
    const tab = this.activeTab();
    if (tab === 'timeline') d.setDate(d.getDate() + dir);
    else if (this.viewMode() === 'week' || tab === 'drivers') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    this.currentDate.set(d);
  }

  goToday() { this.currentDate.set(new Date()); }
  setViewMode(mode: ViewMode) { this.viewMode.set(mode); }

  switchTab(tab: ActiveTab) {
    if (tab === 'drivers' && this.viewMode() === 'month') {
      this.viewMode.set('week');
    }
    this.activeTab.set(tab);
    this.closePanel();
  }

  isToday(d: Date | null): boolean {
    if (!d) return false;
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  }

  isCurrentMonth(d: Date | null): boolean {
    if (!d) return false;
    const cur = this.currentDate();
    return d.getMonth() === cur.getMonth() && d.getFullYear() === cur.getFullYear();
  }

  getDayData(d: Date | null) {
    if (!d) return { departures: [] as CalendarDeparture[], rides: [] as CalendarScheduledRide[] };
    const entry = this.dayMap().get(this.toKey(d));
    const deps = [...(entry?.departures ?? [])].sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    const rides = [...(entry?.rides ?? [])].sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    return { departures: deps, rides };
  }

  getDriverDayTrips(row: DriverScheduleRow, day: Date): DriverTrip[] {
    return row.dayTrips.get(this.toKey(day)) ?? [];
  }

  openEditDeparture(dep: CalendarDeparture, e: Event) {
    e.stopPropagation();
    this.newRideState.set(null);
    this.editState.set({ type: 'departure', data: dep, driverId: dep.driverId ?? '', busId: dep.busId ?? '', time: dep.time ?? '', timeTo: dep.timeTo ?? '', rideLabel: '', rideNote: '' });
  }

  openEditRide(ride: CalendarScheduledRide, e: Event) {
    e.stopPropagation();
    this.newRideState.set(null);
    this.editState.set({ type: 'ride', data: ride, driverId: ride.driverId ?? '', busId: ride.busId ?? '', time: ride.time ?? '', timeTo: ride.timeTo ?? '', rideLabel: ride.label, rideNote: ride.note ?? '' });
  }

  openNewRide(d: Date, e: Event) {
    e.stopPropagation();
    this.editState.set(null);
    this.newRideState.set({ date: this.toKey(d), label: '', time: '', timeTo: '', busId: '', note: '', driverId: '' });
  }

  closePanel() { this.editState.set(null); this.newRideState.set(null); }

  asDeparture(es: EditState): CalendarDeparture { return es.data as CalendarDeparture; }
  asRide(es: EditState): CalendarScheduledRide { return es.data as CalendarScheduledRide; }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  chipStyle(driver: Driver | null): Record<string, string> {
    const color = driver?.color;
    if (!color) return { background: '#f3f4f6', 'border-left-color': '#d1d5db' };
    return { background: this.hexToRgba(color, 0.1), 'border-left-color': color };
  }

  formatTimeRange(from: string | null, to: string | null): string {
    if (from && to) return `${from} – ${to}`;
    if (from) return from;
    if (to) return `do ${to}`;
    return '';
  }

  saveEdit() {
    const es = this.editState();
    if (!es) return;
    this.saving.set(true);
    const driverId = es.driverId || null;
    const busId = es.busId || null;
    const time = es.time || null;
    const timeTo = es.timeTo || null;

    if (es.type === 'departure') {
      this.api.assignDepartureDriver((es.data as CalendarDeparture).id, { driverId, time, timeTo, busId }).subscribe({
        next: updated => {
          this.patchDeparture((es.data as CalendarDeparture).id, updated);
          this.saving.set(false); this.closePanel();
        },
        error: () => this.saving.set(false),
      });
    } else {
      const ride = es.data as CalendarScheduledRide;
      this.api.updateScheduledRide(ride.id, {
        driverId, busId, time, timeTo,
        label: es.rideLabel.trim() || ride.label,
        note: es.rideNote || null,
      }).subscribe({
        next: updated => { this.patchRide(ride.id, updated); this.saving.set(false); this.closePanel(); },
        error: () => this.saving.set(false),
      });
    }
  }

  saveNewRide() {
    const nr = this.newRideState();
    if (!nr || !nr.label.trim()) return;
    this.saving.set(true);
    this.api.createScheduledRide({
      date: nr.date,
      time: nr.time || undefined,
      timeTo: nr.timeTo || undefined,
      label: nr.label.trim(),
      busId: nr.busId || undefined,
      note: nr.note || undefined,
      driverId: nr.driverId || undefined,
    }).subscribe({
      next: ride => {
        const data = this.calendarData();
        if (data) this.calendarData.set({ ...data, scheduledRides: [...data.scheduledRides, ride] });
        this.saving.set(false); this.closePanel();
      },
      error: () => this.saving.set(false),
    });
  }

  deleteRide() {
    const es = this.editState();
    if (!es || es.type !== 'ride') return;
    const ride = es.data as CalendarScheduledRide;
    if (!confirm(`Zmazať jazdu "${ride.label}"?`)) return;
    this.saving.set(true);
    this.api.deleteScheduledRide(ride.id).subscribe({
      next: () => {
        const data = this.calendarData();
        if (data) this.calendarData.set({ ...data, scheduledRides: data.scheduledRides.filter(r => r.id !== ride.id) });
        this.saving.set(false); this.closePanel();
      },
      error: () => this.saving.set(false),
    });
  }

  // Timeline pixel helpers
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

  private patchDeparture(id: string, patch: Partial<CalendarDeparture>) {
    const data = this.calendarData();
    if (!data) return;
    this.calendarData.set({ ...data, departures: data.departures.map(d => d.id === id ? { ...d, ...patch } : d) });
  }

  private patchRide(id: string, patch: Partial<CalendarScheduledRide>) {
    const data = this.calendarData();
    if (!data) return;
    this.calendarData.set({ ...data, scheduledRides: data.scheduledRides.map(r => r.id === id ? { ...r, ...patch } : r) });
  }
}
