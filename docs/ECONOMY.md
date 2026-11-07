# Virtual economy and monetary precision

Fitimart is a simulation. Virtual credit has no cash value, is not convertible, and does not represent a real financial claim.

## Default initial credit

```text
1,000,000,000,000 USD
```

This is exactly ten to the twelfth power. The implementation stores:

```text
1,000,000,000,000,000,000 atomic units
```

as the decimal string `"1000000000000000000"`.

## Atomic representation

- Fixed scale: **6 decimal places**.
- One display unit = `1,000,000` atomic units.
- Every persisted monetary amount is a non-negative integer string.
- Internal arithmetic uses `BigInt`.
- BigInt is never passed to `JSON.stringify`; `.toString()` is applied at every persistence boundary.
- Input is parsed from decimal strings with `parseAmountToAtomic`.
- More than six decimal places, exponent notation, grouping separators, and negative user input are rejected.

Examples:

| Input | Atomic string |
| --- | ---: |
| `0` | `0` |
| `0.01` | `10000` |
| `25` | `25000000` |
| `480.5` | `480500000` |
| `1000000000000` | `1000000000000000000` |

## Covered records

- Wallet balance
- Order line unit prices and totals
- Purchase receipts and post-purchase balances
- Transactions
- Top-ups
- Wallet reset adjustments
- Concept backing records and totals
- Product prices
- RSS subscription item prices

## Display settings

Users can configure:

- Initial credit for newly initialized wallets.
- ISO 4217 currency code or a custom virtual unit.
- Display label.
- Display precision from 0 to 6 decimal places.
- A pattern containing `{amount}` and `{currency}`.

Display precision rounds only the presented amount. Accounting remains exact at six decimals. No exchange rate is used.

Changing the currency code, label, precision, or pattern is display-only. It does not convert the wallet balance, historical orders, product prices, or backing totals.

## Initial credit and reset behavior

- Editing initial credit changes the value used by a future new wallet.
- Editing initial credit does not overwrite an existing wallet.
- **Reset wallet to initial credit** is a separate explicit action.
- Reset preserves orders, transactions, favorites, concepts, collections, and backings.
- Reset records both a wallet adjustment and an `ADJUSTMENT` transaction.

## Serialization and migration

Legacy numeric Mini Market amounts are converted to six-decimal atomic strings on migration. Existing decimal major-unit values are preserved exactly when representable at six decimals.

Export files contain strings only and can be imported again without a BigInt serialization step.

## Validated behavior

Automated tests cover one-trillion-unit initialization, exact addition/subtraction, multiplication by quantity, display rounding, custom patterns, large balances, insufficient funds, zero-price purchases, duplicate settlement, initial-credit edits, and explicit wallet reset.
