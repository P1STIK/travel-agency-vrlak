import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AdminToursComponent } from './admin-tours.component';
import { AdminApiService } from '../admin-api.service';

describe('AdminToursComponent', () => {
  let component: AdminToursComponent;
  let fixture: ComponentFixture<AdminToursComponent>;
  let apiSpy: jasmine.SpyObj<AdminApiService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('AdminApiService', ['getTours', 'createTour']);
    apiSpy.getTours.and.returnValue(of([]));
    apiSpy.createTour.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [AdminToursComponent],
      providers: [{ provide: AdminApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminToursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function setSingleDeparture(priceEur: number | null) {
    component.form.departures = [
      { date: '2026-05-01', returnDate: '', priceEur, capacity: 50 },
    ];
  }

  it('converts priceEur 429 to unitPriceCents 42900', () => {
    setSingleDeparture(429);
    component.submit();

    expect(apiSpy.createTour).toHaveBeenCalled();
    const payload = apiSpy.createTour.calls.mostRecent().args[0];
    expect(payload.departures![0].unitPriceCents).toBe(42900);
  });

  it('converts priceEur 429.99 to an integer unitPriceCents 42999', () => {
    setSingleDeparture(429.99);
    component.submit();

    const payload = apiSpy.createTour.calls.mostRecent().args[0];
    expect(payload.departures![0].unitPriceCents).toBe(42999);
    expect(Number.isInteger(payload.departures![0].unitPriceCents)).toBe(true);
  });

  it('converts priceEur 19.9 to unitPriceCents 1990', () => {
    setSingleDeparture(19.9);
    component.submit();

    const payload = apiSpy.createTour.calls.mostRecent().args[0];
    expect(payload.departures![0].unitPriceCents).toBe(1990);
  });

  it('converts priceEur 0.1 to unitPriceCents 10', () => {
    setSingleDeparture(0.1);
    component.submit();

    const payload = apiSpy.createTour.calls.mostRecent().args[0];
    expect(payload.departures![0].unitPriceCents).toBe(10);
  });

  it('sets an error and does not call createTour when priceEur is null on a row with a date', () => {
    setSingleDeparture(null);
    component.submit();

    expect(apiSpy.createTour).not.toHaveBeenCalled();
    expect(component.error()).toBe('Zadajte platnú cenu v eurách pre každý odchod');
  });

  it('sets an error and does not call createTour for a negative price', () => {
    setSingleDeparture(-5);
    component.submit();

    expect(apiSpy.createTour).not.toHaveBeenCalled();
    expect(component.error()).toBe('Zadajte platnú cenu v eurách pre každý odchod');
  });

  it('renders a price label with € and not centy', () => {
    component.showForm.set(true);
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('.departure-row .field__label');
    const allLabels = Array.from(
      fixture.nativeElement.querySelectorAll('.departure-row .field__label'),
    ) as HTMLElement[];
    const priceLabel = allLabels.find(l => l.textContent?.includes('Cena'));

    expect(priceLabel?.textContent).toContain('€');
    expect(priceLabel?.textContent?.toLowerCase()).not.toContain('centy');
  });
});
