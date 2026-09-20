# Registry stub — Quote & Invoice

| Field | Value |
| --- | --- |
| **id** | `quote-invoice` |
| **path** | `/tools/quote-invoice` |
| **name** | Quote & Invoice |
| **accent** | Moss `#7d9b7a` |
| **price** | `$9` once (device-local unlock) — display via `NEXT_PUBLIC_PRICE_LABEL` |
| **live** | `false` until Cos says smoke clear |
| **sale product / toolId** | `quote-invoice` |
| **shop PR owner** | Groundwork |
| **checkout gate** | `NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE=true` |

## Notes

- Free pass: unlimited quotes; print gets GGT 8pt footer only.
- Paid: branded print footer (logo + business details). Upgrade UI after 3rd saved quote, never on the document.
- Do not enable shop allowlist or flip `live` until Cos smoke-clears.
- Groundwork owns merging `quote-invoice` onto the shop sale desk allowlist.
