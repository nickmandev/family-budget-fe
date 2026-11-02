import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type CallbackStatus = 'completed' | 'denied' | 'failed' | 'invalid';

@Component({
  selector: 'app-bank-callback-page',
  imports: [RouterLink],
  templateUrl: './bank-callback-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankCallbackPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly status = this.readStatus(this.route.snapshot.queryParamMap.get('status'));

  protected readonly heading = this.status === 'completed'
    ? 'Bank connected'
    : this.status === 'denied'
      ? 'Consent was cancelled at the bank'
      : this.status === 'failed'
        ? 'The bank connection could not be completed'
        : 'This connection link is no longer valid';

  protected readonly note = this.status === 'completed'
    ? 'Transactions will appear in Suggestions after review.'
    : '';

  private readStatus(value: string | null): CallbackStatus {
    switch (value?.toLocaleLowerCase()) {
      case 'completed':
      case 'denied':
      case 'failed':
      case 'invalid':
        return value.toLocaleLowerCase() as CallbackStatus;
      default:
        return 'invalid';
    }
  }
}
