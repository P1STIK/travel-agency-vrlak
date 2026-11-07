import { Pipe, PipeTransform } from '@angular/core';

export function formatPrice(
  cents: number | null | undefined,
  currency: string = 'EUR',
): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) {
    return '';
  }

  const amount = cents / 100;
  const fractionDigits = cents % 100 === 0 ? 0 : 2;

  const formatted = new Intl.NumberFormat('sk-SK', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);

  const symbol = currency === 'EUR' ? '€' : currency;

  return `${formatted} ${symbol}`;
}

@Pipe({
  name: 'price',
  standalone: true,
  pure: true,
})
export class PricePipe implements PipeTransform {
  transform(cents: number | null | undefined, currency: string = 'EUR'): string {
    return formatPrice(cents, currency);
  }
}
