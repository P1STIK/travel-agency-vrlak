import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { LoginComponent } from './login.component';
import { CustomerAuthService } from '../../services/customer-auth.service';

function activatedRouteStub(returnUrl: string | null) {
  return {
    snapshot: { queryParamMap: convertToParamMap(returnUrl !== null ? { returnUrl } : {}) },
  };
}

describe('LoginComponent returnUrl handling', () => {
  function setup(returnUrl: string | null) {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteStub(returnUrl) },
      ],
    });

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    const auth = TestBed.inject(CustomerAuthService);
    const router = TestBed.inject(Router);
    spyOn(auth, 'login').and.returnValue(of({} as any));
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
    return { component, router };
  }

  it('navigates to an accepted relative returnUrl ("/checkout?x=1")', () => {
    const { component, router } = setup('/checkout?x=1');
    component.email = 'a@b.com';
    component.password = 'hunter22';
    component.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/checkout?x=1');
  });

  it('rejects a protocol-relative returnUrl ("//evil.com") and falls back to /moj-ucet', () => {
    const { component, router } = setup('//evil.com');
    component.email = 'a@b.com';
    component.password = 'hunter22';
    component.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/moj-ucet');
  });

  it('rejects an absolute returnUrl ("https://evil.com") and falls back to /moj-ucet', () => {
    const { component, router } = setup('https://evil.com');
    component.email = 'a@b.com';
    component.password = 'hunter22';
    component.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/moj-ucet');
  });

  it('falls back to /moj-ucet when there is no returnUrl', () => {
    const { component, router } = setup(null);
    component.email = 'a@b.com';
    component.password = 'hunter22';
    component.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/moj-ucet');
  });
});
