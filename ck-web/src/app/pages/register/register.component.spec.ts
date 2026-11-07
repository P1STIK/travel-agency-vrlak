import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';
import { CustomerAuthService } from '../../services/customer-auth.service';

function activatedRouteStub(returnUrl: string | null) {
  return {
    snapshot: { queryParamMap: convertToParamMap(returnUrl !== null ? { returnUrl } : {}) },
  };
}

describe('RegisterComponent returnUrl handling', () => {
  function setup(returnUrl: string | null) {
    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteStub(returnUrl) },
      ],
    });

    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    const auth = TestBed.inject(CustomerAuthService);
    const router = TestBed.inject(Router);
    spyOn(auth, 'register').and.returnValue(of({} as any));
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
    return { component, router };
  }

  function fillValidForm(component: RegisterComponent) {
    component.form.email = 'a@b.com';
    component.form.password = 'hunter22a';
    component.form.confirmPassword = 'hunter22a';
    component.form.firstName = 'A';
    component.form.lastName = 'B';
  }

  it('navigates to an accepted relative returnUrl ("/checkout?x=1")', () => {
    const { component, router } = setup('/checkout?x=1');
    fillValidForm(component);
    component.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/checkout?x=1');
  });

  it('rejects a protocol-relative returnUrl ("//evil.com") and falls back to /moj-ucet', () => {
    const { component, router } = setup('//evil.com');
    fillValidForm(component);
    component.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/moj-ucet');
  });

  it('rejects an absolute returnUrl ("https://evil.com") and falls back to /moj-ucet', () => {
    const { component, router } = setup('https://evil.com');
    fillValidForm(component);
    component.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/moj-ucet');
  });
});
