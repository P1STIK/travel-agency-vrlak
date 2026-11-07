import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import {
  AdminApiService,
  Bus,
  CalendarData,
  CalendarDeparture,
  CalendarScheduledRide,
  Driver,
} from '../admin-api.service';
import { AdminCalendarToolbarComponent, CalendarActiveTab, CalendarViewMode } from './admin-calendar-toolbar/admin-calendar-toolbar.component';
import { AdminCalendarGridViewComponent } from './admin-calendar-grid-view/admin-calendar-grid-view.component';
import { AdminCalendarDriversViewComponent } from './admin-calendar-drivers-view/admin-calendar-drivers-view.component';
import { AdminCalendarTimelineViewComponent } from './admin-calendar-timeline-view/admin-calendar-timeline-view.component';
import { AdminCalendarRidePanelComponent, EditState, NewRideState } from './admin-calendar-ride-panel/admin-calendar-ride-panel.component';
import { MONTHS, DAY_NAMES, toDateKey, weekStart } from '../../shared/utils/calendar-date.utils';
import { AdminAuthService } from '../admin-auth.service';

@Component({
  selector: 'app-admin-calendar',
  standalone: true,
  imports: [
    AdminCalendarToolbarComponent,
    AdminCalendarGridViewComponent,
    AdminCalendarDriversViewComponent,
    AdminCalendarTimelineViewComponent,
    AdminCalendarRidePanelComponent,
  ],
  templateUrl: './admin-calendar.component.html',
  styleUrl: './admin-calendar.component.css',
})
export class AdminCalendarComponent implements OnInit {
  private api = inject(AdminApiService);
  private auth = inject(AdminAuthService);

  activeTab = signal<CalendarActiveTab>('calendar');
  viewMode = signal<CalendarViewMode>('month');
  currentDate = signal(new Date());
  calendarData = signal<CalendarData | null>(null);
  drivers = signal<Driver[]>([]);
  buses = signal<Bus[]>([]);
  loading = signal(false);
  editState = signal<EditState | null>(null);
  newRideState = signal<NewRideState | null>(null);
  saving = signal(false);
  error = signal('');

  isAdmin = this.auth.isAdmin;
  myDriverId = this.auth.driverId;
  canCreateRide = computed(() => this.isAdmin() || this.myDriverId() !== null);

  headerLabel = computed(() => {
    const d = this.currentDate();
    if (this.activeTab() === 'timeline') {
      return `${DAY_NAMES[d.getDay()]} ${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }
    if (this.viewMode() === 'month' && this.activeTab() === 'calendar') {
      return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }
    const mon = weekStart(d);
    const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
    if (mon.getMonth() === sun.getMonth()) {
      return `${mon.getDate()}. – ${sun.getDate()}. ${MONTHS[mon.getMonth()]} ${mon.getFullYear()}`;
    }
    return `${mon.getDate()}. ${MONTHS[mon.getMonth()]} – ${sun.getDate()}. ${MONTHS[sun.getMonth()]} ${sun.getFullYear()}`;
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

  private loadCalendar(d: Date, mode: CalendarViewMode, tab: CalendarActiveTab) {
    let from: Date, to: Date;
    if (tab === 'timeline') {
      from = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      to   = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    } else if (mode === 'week' || tab === 'drivers') {
      from = weekStart(d);
      to = new Date(from); to.setDate(from.getDate() + 6);
    } else {
      from = new Date(d.getFullYear(), d.getMonth(), 1);
      to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }
    this.loading.set(true);
    this.api.getCalendar(toDateKey(from), toDateKey(to)).subscribe({
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
  setViewMode(mode: CalendarViewMode) { this.viewMode.set(mode); }

  switchTab(tab: CalendarActiveTab) {
    if (tab === 'drivers' && this.viewMode() === 'month') {
      this.viewMode.set('week');
    }
    this.activeTab.set(tab);
    this.closePanel();
  }

  private canEdit(ownerDriverId: string | null): boolean {
    if (this.isAdmin()) return true;
    const myId = this.myDriverId();
    return myId !== null && ownerDriverId === myId;
  }

  openEditDeparture(dep: CalendarDeparture) {
    this.newRideState.set(null);
    const editable = this.canEdit(dep.driverId);
    this.editState.set({
      type: 'departure', data: dep, driverId: dep.driverId ?? '', busId: dep.busId ?? '', time: dep.time ?? '', timeTo: dep.timeTo ?? '',
      rideLabel: '', rideNote: '', readonly: !editable, lockDriver: !this.isAdmin(),
    });
  }

  openEditRide(ride: CalendarScheduledRide) {
    this.newRideState.set(null);
    const editable = this.canEdit(ride.driverId);
    this.editState.set({
      type: 'ride', data: ride, driverId: ride.driverId ?? '', busId: ride.busId ?? '', time: ride.time ?? '', timeTo: ride.timeTo ?? '',
      rideLabel: ride.label, rideNote: ride.note ?? '', readonly: !editable, lockDriver: !this.isAdmin(),
    });
  }

  openNewRide(d: Date) {
    if (!this.canCreateRide()) return;
    this.editState.set(null);
    const myId = this.myDriverId();
    this.newRideState.set({
      date: toDateKey(d), label: '', time: '', timeTo: '', busId: '', note: '',
      driverId: this.isAdmin() ? '' : (myId ?? ''), lockDriver: !this.isAdmin(),
    });
  }

  closePanel() { this.editState.set(null); this.newRideState.set(null); this.error.set(''); }

  saveEdit() {
    const es = this.editState();
    if (!es || es.readonly) return;
    this.saving.set(true);
    this.error.set('');
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
        error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Chyba pri ukladaní'); },
      });
    } else {
      const ride = es.data as CalendarScheduledRide;
      this.api.updateScheduledRide(ride.id, {
        driverId, busId, time, timeTo,
        label: es.rideLabel.trim() || ride.label,
        note: es.rideNote || null,
      }).subscribe({
        next: updated => { this.patchRide(ride.id, updated); this.saving.set(false); this.closePanel(); },
        error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Chyba pri ukladaní'); },
      });
    }
  }

  saveNewRide() {
    const nr = this.newRideState();
    if (!nr || !nr.label.trim()) return;
    this.saving.set(true);
    this.error.set('');
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
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Chyba pri ukladaní'); },
    });
  }

  deleteRide() {
    const es = this.editState();
    if (!es || es.type !== 'ride' || es.readonly) return;
    const ride = es.data as CalendarScheduledRide;
    if (!confirm(`Zmazať jazdu "${ride.label}"?`)) return;
    this.saving.set(true);
    this.error.set('');
    this.api.deleteScheduledRide(ride.id).subscribe({
      next: () => {
        const data = this.calendarData();
        if (data) this.calendarData.set({ ...data, scheduledRides: data.scheduledRides.filter(r => r.id !== ride.id) });
        this.saving.set(false); this.closePanel();
      },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Chyba pri mazaní'); },
    });
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
