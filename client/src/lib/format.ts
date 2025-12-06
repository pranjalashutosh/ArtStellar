export function formatCurrency(amountCents: number, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

export function centsToNumber(amountCents: number): number {
  return amountCents / 100;
}

