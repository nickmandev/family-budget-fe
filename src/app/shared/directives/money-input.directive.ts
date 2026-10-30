import {
  Directive,
  ElementRef,
  forwardRef,
  HostListener,
  Input,
  Renderer2,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export function parseMoneyInput(value: string, currency = 'EUR'): number | null {
  const input = value.trim().replace(',', '.');
  if (!input) {
    return null;
  }

  const match = /^([+-]?)(\d+)(?:\.(\d*))?$/.exec(input);
  if (!match) {
    return null;
  }

  let fractionDigits = 2;
  try {
    fractionDigits = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    fractionDigits = 2;
  }

  const fraction = match[3] ?? '';
  if (fraction.length > fractionDigits) {
    return null;
  }

  const scale = 10n ** BigInt(fractionDigits);
  const whole = BigInt(match[2]);
  const fractional = BigInt((fraction + '0'.repeat(fractionDigits)).slice(0, fractionDigits) || '0');
  const magnitude = whole * scale + fractional;
  if (magnitude > BigInt(Number.MAX_SAFE_INTEGER)) {
    return null;
  }

  const amount = Number(magnitude);
  return match[1] === '-' ? -amount : amount;
}

@Directive({
  selector: 'input[appMoneyInput]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MoneyInputDirective),
      multi: true,
    },
  ],
})
export class MoneyInputDirective implements ControlValueAccessor {
  @Input('appMoneyInput') moneyInput = 'EUR';

  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(
    private readonly element: ElementRef<HTMLInputElement>,
    private readonly renderer: Renderer2,
  ) {}

  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    this.onChange(parseMoneyInput(value, this.moneyInput));
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: number | null): void {
    const digits = this.fractionDigits();
    const scale = 10 ** digits;
    const rendered = value === null || value === undefined
      ? ''
      : `${value < 0 ? '-' : ''}${Math.trunc(Math.abs(value) / scale)}${digits ? `.${String(Math.abs(value) % scale).padStart(digits, '0')}` : ''}`;
    this.renderer.setProperty(this.element.nativeElement, 'value', rendered);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.renderer.setProperty(this.element.nativeElement, 'disabled', disabled);
  }

  private fractionDigits(): number {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.moneyInput,
      }).resolvedOptions().maximumFractionDigits ?? 2;
    } catch {
      return 2;
    }
  }
}
