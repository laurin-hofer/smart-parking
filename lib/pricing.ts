const RATE_CENTS_PER_MINUTE = 5;
const MINIMUM_CENTS = 50;

export function calculatePriceCents(enteredAt: Date | string, now: Date = new Date()): number {
  const start = new Date(enteredAt).getTime();
  const minutes = Math.max(1, Math.ceil((now.getTime() - start) / 60_000));
  return Math.max(MINIMUM_CENTS, minutes * RATE_CENTS_PER_MINUTE);
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function priceLabel(enteredAt: Date | string): string {
  return formatCents(calculatePriceCents(enteredAt));
}
