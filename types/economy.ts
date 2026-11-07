export type AtomicAmount = string;

export type CurrencyKind = "ISO" | "CUSTOM";

export interface EconomySettings {
  /** Virtual credit applied only when a new wallet is initialized. Stored as atomic units. */
  initialCreditAtomic: AtomicAmount;
  currencyCode: string;
  currencyLabel: string;
  currencyKind: CurrencyKind;
  /** Display precision only. Accounting always uses six atomic decimal places. */
  displayPrecision: number;
  /** Display pattern with {amount} and {currency} placeholders. */
  displayPattern: string;
}

export interface WalletState {
  initialized: boolean;
  balanceAtomic: AtomicAmount;
}
