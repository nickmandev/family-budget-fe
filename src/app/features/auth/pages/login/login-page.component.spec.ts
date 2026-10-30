import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Store } from '@ngrx/store';

import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let dispatch: jasmine.Spy;

  beforeEach(async () => {
    dispatch = jasmine.createSpy('dispatch');
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: Store,
          useValue: {
            selectSignal: () => () => false,
            dispatch,
          },
        },
      ],
    }).compileComponents();
  });

  it('renders the sign-in form and validates required fields', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h2')?.textContent).toContain('Sign in to your account');
    expect(element.querySelector('#login-email')).toBeTruthy();
    expect(element.querySelector('#login-password')).toBeTruthy();

    (element.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element.textContent).toContain('Email is required.');
    expect(element.textContent).toContain('Password is required.');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('validates malformed email and passwords shorter than eight characters', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const email = element.querySelector('#login-email') as HTMLInputElement;
    const password = element.querySelector('#login-password') as HTMLInputElement;

    email.value = 'not-an-email';
    email.dispatchEvent(new Event('input'));
    password.value = 'short';
    password.dispatchEvent(new Event('input'));
    (element.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element.textContent).toContain('Enter a valid email address.');
    expect(element.textContent).toContain('Password must be at least 8 characters.');
    expect(dispatch).not.toHaveBeenCalled();
  });
});
