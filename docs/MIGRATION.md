# Storage migration report

## Keys

| Purpose | Key |
| --- | --- |
| Active Fitimart state | `fitimart-marketplace-v2` |
| Legacy Mini Market source | `mini-market-demo-v1` |
| Language preference | `fitimart-language` |
| Legacy language preference | `mini-market-language` |
| Migration raw backups | `fitimart-migration-backup-*` |
| Raw feed cache | IndexedDB `fitimart-feed-cache` |
| Translation cache | IndexedDB `fitimart-translation-cache` |

## Version 1 → version 2 mapping

| Legacy field | Version 2 field |
| --- | --- |
| `credits: number` | `wallet.balanceAtomic: string` |
| order `total` | order `totalAtomic` |
| order `balanceAfter` | order `balanceAfterAtomic` |
| order item `unitPrice` | order item `unitPriceAtomic` |
| transaction `creditsSpent` | transaction `amountAtomic` |
| top-up `amount` | top-up `amountAtomic` |
| backing `credits` | backing `amountAtomic` |
| `conceptBackingTotals` numbers | atomic string values |
| concept `demoPrice` | concept `priceAtomic` |
| concept `backingCredits` | concept `backingAtomic` |
| no currency settings | default USD, precision 2, display pattern `{amount} {currency}` |
| no feed data | empty versioned feed registry |

## Preserved data

- Wallet balance
- Orders and line-item snapshots
- Transactions
- Top-ups
- Favorites
- Watched concepts
- Library / acquired collection
- User-created concepts
- Concept backings and totals
- Cart items and quantities
- Language preference through the language-specific migration

## Recovery behavior

1. If active v2 state exists, it is used.
2. Otherwise legacy v1 is read and normalized.
3. A raw legacy string is backed up under `fitimart-migration-backup-*` before the first v2 write.
4. If JSON parsing fails, the raw string is backed up and a safe initial state is shown without deleting the backup.
5. Partially malformed records are skipped individually where recoverable; other records remain.
6. Order totals are recomputed from line items; a mismatch produces a migration warning.
7. Invalid currency settings fall back to safe defaults rather than crashing.
8. Explicit **Reset all local data** removes the active state, legacy source, and migration backups after user confirmation.

## Export and import

Settings provide a JSON export and import:

```json
{
  "format": "fitimart-marketplace-export",
  "schemaVersion": 2,
  "exportedAt": "2026-11-07T00:00:00.000Z",
  "state": {
    "schemaVersion": 2,
    "wallet": { "initialized": true, "balanceAtomic": "1000000000000000000" }
  }
}
```

All monetary values remain strings. Import accepts either the wrapped export object or a state object and runs the same normalization path.

## Verified migration

Browser acceptance created a legacy profile containing a balance, an order, a transaction, a top-up, a favorite, a watched concept, a library entry, and a backing. After reload, Fitimart created v2 state under `fitimart-marketplace-v2` and preserved each record as exact atomic values.

Deterministic unit tests also cover migration of user-created concepts and malformed fields.
