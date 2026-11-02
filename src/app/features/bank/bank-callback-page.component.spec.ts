import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { BankCallbackPageComponent } from './bank-callback-page.component';

describe('BankCallbackPageComponent', () => {
  async function render(queryParams: Record<string, string> = {}): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [BankCallbackPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(BankCallbackPageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    TestBed.resetTestingModule();
    return element;
  }

  it('shows the completed result', async () => {
    const page = await render({ status: 'COMPLETED' });
    expect(page.textContent).toContain('Bank connected');
    expect(page.textContent).toContain('Transactions will appear in Suggestions after review.');
  });

  it('shows the denied result', async () => {
    expect((await render({ status: 'denied' })).textContent).toContain('Consent was cancelled at the bank');
  });

  it('shows the failed result', async () => {
    expect((await render({ status: 'failed' })).textContent).toContain('The bank connection could not be completed');
  });

  it('shows the invalid result', async () => {
    expect((await render({ status: 'invalid' })).textContent).toContain('This connection link is no longer valid');
  });

  it('ignores callback parameters other than status', async () => {
    const page = await render({
      status: 'completed',
      code: 'SECRET_CODE',
      state: 'SECRET_STATE',
      error: 'SECRET_ERROR',
      error_description: 'SECRET_DESCRIPTION',
    });
    expect(page.textContent).toContain('Bank connected');
    expect(page.textContent).not.toContain('SECRET_CODE');
    expect(page.textContent).not.toContain('SECRET_STATE');
    expect(page.textContent).not.toContain('SECRET_ERROR');
    expect(page.textContent).not.toContain('SECRET_DESCRIPTION');
  });

  it('uses the invalid result for an unknown or missing status', async () => {
    expect((await render({ status: 'other' })).textContent).toContain('This connection link is no longer valid');
    expect((await render()).textContent).toContain('This connection link is no longer valid');
  });
});
