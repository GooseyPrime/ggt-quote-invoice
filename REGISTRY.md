# Registry stub — Quote & Invoice

| Field | Value |
| --- | --- |
| **id** | `quote-invoice` |
| **path** | `/tools/quote-invoice` |
| **name** | Quote & Invoice |
| **accent** | Moss `#7d9b7a` |
| **price** | `$9` once (device-local unlock) — display via `NEXT_PUBLIC_PRICE_LABEL` |
| **live** | `false` until Brandon lists on the shop |
| **sale product / toolId** | `quote-invoice` |
| **shop PR owner** | Groundwork |
| **checkout gate** | Default ON after desk #43; set `NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE=false|0|off` to disable |

## Notes

- Free pass: unlimited quotes; print gets GGT 8pt footer only.
- Paid: branded print footer (logo + business details). Upgrade UI after 3rd saved quote, never on the document.
- Desk allowlist includes `quote-invoice` (shop #43). Tool SALE_LIVE defaults on.
- Shop registry `live` stays `false` until Brandon lists.
