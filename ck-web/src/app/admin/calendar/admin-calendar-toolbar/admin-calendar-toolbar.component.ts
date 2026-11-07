import { Component, input, output } from '@angular/core';

export type CalendarActiveTab = 'calendar' | 'drivers' | 'timeline';
export type CalendarViewMode = 'week' | 'month';

@Component({
  selector: 'app-admin-calendar-toolbar',
  standalone: true,
  templateUrl: './admin-calendar-toolbar.component.html',
  styleUrl: './admin-calendar-toolbar.component.css',
})
export class AdminCalendarToolbarComponent {
  activeTab = input.required<CalendarActiveTab>();
  viewMode = input.required<CalendarViewMode>();
  headerLabel = input('');

  switchTab = output<CalendarActiveTab>();
  navigate = output<-1 | 1>();
  goToday = output<void>();
  setViewMode = output<CalendarViewMode>();
}
