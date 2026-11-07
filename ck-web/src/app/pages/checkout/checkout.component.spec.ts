import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CheckoutComponent } from './checkout.component';
import { CustomerAuthService, CustomerProfile } from '../../services/customer-auth.service';

const fakeCustomer: CustomerProfile = {
  id: 'c1',
  email: 'customer@example.com',
  firstName: 'Zuzana',
  lastName: 'Zakaznicka',
  phone: '0900111222',
  street: 'Hlavna 1',
  city: 'Zuberec',
  zip: '02742',
  createdAt: '2026-01-01T00:00:00.000Z',
};

// No tourSlug/departureId/price in query params -> ngOnInit skips the tours HTTP call entirely,
// keeping this test focused on prefillFromCustomer() without extra HTTP mocking.
const emptyRouteStub = {
  snapshot: { queryParamMap: convertToParamMap({}) },
};

describe('CheckoutComponent prefillFromCustomer', () => {
  function setup(loggedInCustomer: CustomerProfile | null) {
    TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: emptyRouteStub },
      ],
    });

    const customerAuth = TestBed.inject(CustomerAuthService);
    if (loggedInCustomer) customerAuth.setCustomer(loggedInCustomer);

    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit -> prefillFromCustomer()
    return { component, fixture };
  }

  afterEach(() => localStorage.clear());

  it('does nothing when no customer is logged in', () => {
    const { component } = setup(null);
    expect(component.form.get('email')!.value).toBe('');
    expect(component.passengers.at(0).get('firstName')!.value).toBe('');
  });

  it('fills empty email and first passenger fields from the logged-in customer', () => {
    const { component } = setup(fakeCustomer);

    expect(component.form.get('email')!.value).toBe(fakeCustomer.email);

    const first = component.passengers.at(0);
    expect(first.get('firstName')!.value).toBe(fakeCustomer.firstName);
    expect(first.get('lastName')!.value).toBe(fakeCustomer.lastName);
    expect(first.get('phone')!.value).toBe(fakeCustomer.phone);
    expect(first.get('street')!.value).toBe(fakeCustomer.street);
    expect(first.get('city')!.value).toBe(fakeCustomer.city);
    expect(first.get('zip')!.value).toBe(fakeCustomer.zip);
    expect(first.get('email')!.value).toBe(fakeCustomer.email);
  });

  it('never prefills birthDate or nationalId from the customer profile', () => {
    const { component } = setup(fakeCustomer);
    const first = component.passengers.at(0);
    expect(first.get('birthDate')!.value).toBe('');
    expect(first.get('nationalId')!.value).toBe('');
  });

  it('does not overwrite an email the user already typed', () => {
    TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: emptyRouteStub },
      ],
    });
    const customerAuth = TestBed.inject(CustomerAuthService);
    customerAuth.setCustomer(fakeCustomer);

    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;

    // Simulate ngOnInit building the form, then the user typing something, by calling
    // ngOnInit a first time (via detectChanges) is not possible before overriding email mid-flight,
    // so instead we re-run prefill after manually setting a pre-existing value on a fresh form.
    fixture.detectChanges();
    component.form.get('email')!.setValue('already-typed@example.com');
    (component as any)['prefillFromCustomer']();

    expect(component.form.get('email')!.value).toBe('already-typed@example.com');
  });
});
