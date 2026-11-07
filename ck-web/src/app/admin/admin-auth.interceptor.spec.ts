import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { adminAuthInterceptor } from './admin-auth.interceptor';
import { AdminAuthService } from './admin-auth.service';
import { environment } from '../../enviroments/enviroments';

describe('adminAuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let adminAuth: AdminAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([adminAuthInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    adminAuth = TestBed.inject(AdminAuthService);
    spyOn(adminAuth, 'logout');
  });

  afterEach(() => httpMock.verify());

  it('does NOT call AdminAuthService.logout on a 401 from /me', () => {
    http.get(`${environment.api}/me`).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.api}/me`);
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(adminAuth.logout).not.toHaveBeenCalled();
  });

  it('calls AdminAuthService.logout on a 401 from /admin/...', () => {
    http.get(`${environment.api}/admin/customers`).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.api}/admin/customers`);
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(adminAuth.logout).toHaveBeenCalled();
  });
});
