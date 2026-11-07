import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { customerAuthInterceptor } from './customer-auth.interceptor';
import { CustomerAuthService } from './customer-auth.service';
import { environment } from '../../enviroments/enviroments';

describe('customerAuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let customerAuth: CustomerAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([customerAuthInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    customerAuth = TestBed.inject(CustomerAuthService);
    spyOn(customerAuth, 'clearSession');
  });

  afterEach(() => httpMock.verify());

  it('clears the customer session on a 401 from /me', () => {
    http.get(`${environment.api}/me`).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.api}/me`);
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(customerAuth.clearSession).toHaveBeenCalled();
  });

  it('does NOT clear the customer session on a 401 from /admin/...', () => {
    http.get(`${environment.api}/admin/customers`).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.api}/admin/customers`);
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(customerAuth.clearSession).not.toHaveBeenCalled();
  });
});
