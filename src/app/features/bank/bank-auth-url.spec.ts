import { isTrustedBankAuthUrl } from './bank-auth-url';

describe('isTrustedBankAuthUrl', () => {
  it('accepts trusted Enable Banking authorisation URLs', () => {
    expect(isTrustedBankAuthUrl('https://auth.enablebanking.com/ais/start?sessionid=x')).toBeTrue();
    expect(isTrustedBankAuthUrl('https://auth-sandbox.enablebanking.com/ais/start?sessionid=x')).toBeTrue();
    expect(isTrustedBankAuthUrl('https://enablebanking.com/ais/start')).toBeTrue();
  });

  it('rejects URLs outside the trusted HTTPS Enable Banking hosts', () => {
    expect(isTrustedBankAuthUrl('http://auth.enablebanking.com/ais/start')).toBeFalse();
    expect(isTrustedBankAuthUrl('https://evil-enablebanking.com/ais/start')).toBeFalse();
    expect(isTrustedBankAuthUrl('https://enablebanking.com.evil.example/ais/start')).toBeFalse();
    expect(isTrustedBankAuthUrl('https://auth.enablebanking.com@evil.example/')).toBeFalse();
    expect(isTrustedBankAuthUrl('https://auth.enablebanking.com:8443/ais/start')).toBeFalse();
    expect(isTrustedBankAuthUrl('not a url')).toBeFalse();
    expect(isTrustedBankAuthUrl('')).toBeFalse();
  });
});
