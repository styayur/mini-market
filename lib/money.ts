import type { AtomicAmount, EconomySettings } from "@/types/economy";

/** Six decimal places keeps all ISO 4217 minor units exact and allows micro-unit virtual pricing. */
export const ATOMIC_DECIMALS = 6;
export const ATOMIC_FACTOR = 10n ** BigInt(ATOMIC_DECIMALS);
export const MAX_DISPLAY_PRECISION = ATOMIC_DECIMALS;
export const DEFAULT_INITIAL_CREDIT = "1000000000000";
export const DEFAULT_INITIAL_CREDIT_ATOMIC = "1000000000000000000";

const DECIMAL_PATTERN = /^\d+(?:\.\d+)?$/;

function expandExponential(value: string): string {
  if (!/e/i.test(value)) return value;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) throw new Error("Invalid monetary number.");
  return numeric.toLocaleString("en-US", {
    useGrouping: false,
    maximumFractionDigits: 20,
  });
}

/** Parse a human-readable non-negative decimal string into fixed-point atomic units. */
export function parseAmountToAtomic(value: string | number): AtomicAmount {
  const source = typeof value === "number" ? expandExponential(String(value)) : value.trim();
  if (!DECIMAL_PATTERN.test(source)) {
    throw new Error("Enter a non-negative amount using digits and an optional decimal point.");
  }
  const [whole, fraction = ""] = source.split(".");
  if (fraction.length > ATOMIC_DECIMALS) {
    throw new Error(`Use no more than ${ATOMIC_DECIMALS} decimal places.`);
  }
  const paddedFraction = fraction.padEnd(ATOMIC_DECIMALS, "0");
  return (BigInt(whole || "0") * ATOMIC_FACTOR + BigInt(paddedFraction || "0")).toString();
}

export function isValidAtomicAmount(value: unknown): value is AtomicAmount {
  return typeof value === "string" && /^\d+$/.test(value);
}

export function toAtomicBigInt(value: AtomicAmount): bigint {
  if (!isValidAtomicAmount(value)) throw new Error("Invalid atomic monetary amount.");
  return BigInt(value);
}

export function addAtomic(...values: AtomicAmount[]): AtomicAmount {
  return values.reduce((total, value) => total + toAtomicBigInt(value), 0n).toString();
}

export function subtractAtomic(value: AtomicAmount, deduction: AtomicAmount): AtomicAmount {
  const result = toAtomicBigInt(value) - toAtomicBigInt(deduction);
  return (result < 0n ? 0n : result).toString();
}

export function multiplyAtomic(value: AtomicAmount, quantity: number): AtomicAmount {
  if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error("Invalid quantity.");
  return (toAtomicBigInt(value) * BigInt(quantity)).toString();
}

export function compareAtomic(a: AtomicAmount, b: AtomicAmount): number {
  const left = toAtomicBigInt(a);
  const right = toAtomicBigInt(b);
  return left === right ? 0 : left > right ? 1 : -1;
}

export function isZeroAtomic(value: AtomicAmount): boolean {
  return toAtomicBigInt(value) === 0n;
}

export function atomicToDecimalString(value: AtomicAmount): string {
  const amount = toAtomicBigInt(value);
  const whole = amount / ATOMIC_FACTOR;
  const fraction = (amount % ATOMIC_FACTOR).toString().padStart(ATOMIC_DECIMALS, "0");
  return `${whole}.${fraction}`;
}

function roundForDisplay(value: string, precision: number): bigint {
  const safePrecision = Math.max(0, Math.min(MAX_DISPLAY_PRECISION, Math.trunc(precision)));
  const amount = toAtomicBigInt(value);
  if (safePrecision === ATOMIC_DECIMALS) return amount;
  const divisor = 10n ** BigInt(ATOMIC_DECIMALS - safePrecision);
  return (amount + divisor / 2n) / divisor;
}

function localeDecimalSeparator(locale: string): string {
  return (
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
      .formatToParts(1.1)
      .find((part) => part.type === "decimal")?.value ?? "."
  );
}

export interface MoneyFormatOptions {
  precision?: number;
  includeCurrency?: boolean;
  locale?: string;
}

/** Format exact atomic units for display without converting through an unsafe floating-point value. */
export function formatAtomicMoney(
  value: AtomicAmount,
  economy: Pick<EconomySettings, "currencyCode" | "currencyLabel" | "displayPrecision" | "displayPattern">,
  options: MoneyFormatOptions = {},
): string {
  const locale = options.locale ?? "en";
  const precision = Math.max(
    0,
    Math.min(MAX_DISPLAY_PRECISION, Math.trunc(options.precision ?? economy.displayPrecision)),
  );
  const rounded = roundForDisplay(value, precision);
  const scale = 10n ** BigInt(precision);
  const whole = rounded / scale;
  const fraction = precision ? (rounded % scale).toString().padStart(precision, "0") : "";
  const integer = new Intl.NumberFormat(locale, {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(whole);
  const amount = precision
    ? `${integer}${localeDecimalSeparator(locale)}${fraction}`
    : integer;
  if (options.includeCurrency === false) return amount;
  const currency = economy.currencyLabel || economy.currencyCode;
  return economy.displayPattern
    .replaceAll("{amount}", amount)
    .replaceAll("{currency}", currency);
}

export function isValidIsoCurrency(code: string): boolean {
  if (!/^[A-Z]{3}$/.test(code)) return false;
  try {
    new Intl.NumberFormat("en", { style: "currency", currency: code });
    return true;
  } catch {
    return false;
  }
}

export function defaultPrecisionForCurrency(code: string): number {
  if (!isValidIsoCurrency(code)) return 2;
  const resolved = new Intl.NumberFormat("en", {
    style: "currency",
    currency: code,
  }).resolvedOptions();
  return Math.max(0, Math.min(MAX_DISPLAY_PRECISION, resolved.maximumFractionDigits ?? 2));
}
