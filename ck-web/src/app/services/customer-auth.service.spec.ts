import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CustomerAuthService, CustomerProfile } from './customer-auth.service';
import { environment } from '../../enviroments/enviroments';

describe('CustomerAuthService', () => {
  let service: CustomerAuthService;
  let httpMock: HttpTestingController;

  const fakeCustomer: CustomerProfile = {
    id: 'c1',
    email: 'tester@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    street: null,
    city: null,
    zip: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    service = TestBed.inject(CustomerAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('login() stores customer_token and customer_profile in localStorage and updates the signal', () => {
    service.login('tester@example.com', 'hunter22').subscribe();

    const req = httpMock.expectOne(`${environment.api}/auth/customer/login`);
    req.flush({ access_token: 'fake-token-abc', customer: fakeCustomer });

    expect(localStorage.getItem('customer_token')).toBe('fake-token-abc');
    expect(JSON.parse(localStorage.getItem('customer_profile')!)).toEqual(fakeCustomer);
    expect(service.customer()).toEqual(fakeCustomer);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('register() stores customer_token and customer_profile in localStorage and updates the signal', () => {
    service.register({ email: 'tester@example.com', password: 'hunter22', firstName: 'Test', lastName: 'User' }).subscribe();

    const req = httpMock.expectOne(`${environment.api}/auth/customer/register`);
    req.flush({ access_token: 'fake-token-xyz', customer: fakeCustomer });

    expect(localStorage.getItem('customer_token')).toBe('fake-token-xyz');
    expect(JSON.parse(localStorage.getItem('customer_profile')!)).toEqual(fakeCustomer);
    expect(service.customer()).toEqual(fakeCustomer);
  });

  it('logout() clears customer_token and customer_profile but leaves admin_token untouched', () => {
    localStorage.setItem('customer_token', 'fake-token-abc');
    localStorage.setItem('customer_profile', JSON.stringify(fakeCustomer));
    localStorage.setItem('admin_token', 'admin-fake-token');

    service.logout();

    expect(localStorage.getItem('customer_token')).toBeNull();
    expect(localStorage.getItem('customer_profile')).toBeNull();
    expect(service.customer()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('admin_token')).toBe('admin-fake-token');
  });

  it('clearSession() clears customer session without touching admin_token', () => {
    localStorage.setItem('customer_token', 'fake-token-abc');
    localStorage.setItem('customer_profile', JSON.stringify(fakeCustomer));
    localStorage.setItem('admin_token', 'admin-fake-token');

    service.clearSession();

    expect(localStorage.getItem('customer_token')).toBeNull();
    expect(localStorage.getItem('customer_profile')).toBeNull();
    expect(localStorage.getItem('admin_token')).toBe('admin-fake-token');
  });
});
