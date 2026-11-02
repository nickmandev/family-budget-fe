import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BankRedirector {
  assign(url: string): void {
    window.location.assign(url);
  }
}
