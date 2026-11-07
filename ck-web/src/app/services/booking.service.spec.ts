import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { BookingService, CreateBookingPayload } from './booking.service';
import { CustomerAuthService } from './customer-auth.service';

describe('BookingService', () => {
  let service: BookingService;
  let httpMock: HttpTestingController;
  let customerAuth: CustomerAuthService;

  const payload: CreateBookingPayload = {
    departureId: 'd1',
    tourSlug: 'put-rim',
    email: 'guest@example.com',
    seats: 1,
    unitPriceCents: 1000,
    passengers: [{ firstName: 'A', lastName: 'B' }],
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    service = TestBed.inject(BookingService);
    httpMock = TestBed.inject(HttpTestingController);
    customerAuth = TestBed.inject(CustomerAuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('create() sends no Authorization header when there is no customer token (guest)', () => {
    service.create(payload).subscribe();

    const req = httpMock.expectOne('/api/booking');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('create() sends "Authorization: Bearer <customer_token>" when a customer is logged in', () => {
    localStorage.setItem('customer_token', 'customer-fake-token');

    service.create(payload).subscribe();

    const req = httpMock.expectOne('/api/booking');
    expect(req.request.headers.get('Authorization')).toBe('Bearer customer-fake-token');
    req.flush({});
  });

  it('create() never sends the admin token, even if one is present and no customer token is', () => {
    localStorage.setItem('admin_token', 'admin-fake-token');

    service.create(payload).subscribe();

    const req = httpMock.expectOne('/api/booking');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
