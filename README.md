# Golden Goose Tools — Quote & Invoice (`ggt-quote-invoice`)

Phone-first quotes and invoices that live in the browser. **Unlimited free quotes.** Print/PDF always works; free documents carry a single 8pt muted footer. Pay once on this device to replace that footer with your logo and business details. No screen mark, watermark, DRAFT stamp, or feature degradation on the free pass.

- **Accent:** Moss `#7d9b7a` via `--ggt-accent`
- **Design kit:** `ggt-design-kit` from `github:GooseyPrime/ggt-design-kit` (no Tailwind, no UI libs)
- **Storage:** `localStorage` only — clear backup warning + export/import JSON
- **Registry:** id `quote-invoice`, path `/tools/quote-invoice` — see `REGISTRY.md`
- **Payments:** shop sale desk only — **no Stripe secrets in this repo**

## Product rules

| Mode | Behavior |
| --- | --- |
| Free | Unlimited create/edit/convert/print. Print footer: `Prepared with Golden Goose Tools · goldengoosetools.com` (8pt muted). |
| Paid (once, device-local) | Same features; print footer becomes buyer logo + business profile from Settings. |
| Upgrade offer | In-app `ggt-paywall` / `ggt-trust` **after the third quote is saved**, never on `/print/[id]`. |

Price shown in UI comes from `NEXT_PUBLIC_PRICE_LABEL` (default `$9`). Never hardcode the paid amount in copy.

## Local

```bash
cp .env.example .env.local   # optional
npm i
npm run dev
```

Open http://localhost:3000

## Checks

```bash
npm run typecheck && npm test && npm run build
```

## Shop sale contract

Stripe lives **only** in the shop. This tool calls:

### Start checkout

`POST ${NEXT_PUBLIC_SHOP_ORIGIN}/api/sale`

```json
{
  "url": "https://goldengoosetools.com/tools/quote-invoice",
  "product": "quote-invoice",
  "toolId": "quote-invoice"
}
```

Redirect the buyer to the returned `url`.

### Verify after return

`GET ${NEXT_PUBLIC_SHOP_ORIGIN}/api/verify?session_id=`

Route: `/unlock?session_id=…` — unlock when `ok && paid` (or `$0` promo `paymentStatus: "no_payment_required"`). Persist unlock (+ optional business profile) in `localStorage`.

### Gate

Checkout is **refused** with `sku_not_live` until `NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE=true`. Never fall through to `seo-audit` / `accessibility` pricing.

Env defaults:

| Variable | Default |
| --- | --- |
| `NEXT_PUBLIC_SHOP_ORIGIN` | `https://goldengoosetools.com` |
| `NEXT_PUBLIC_PRICE_LABEL` | `$9` |
| `NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE` | unset / false |

## Design kit

```css
@import "ggt-design-kit/src/index.css";

:root {
  --ggt-accent: #7d9b7a;
}
```

Fonts (Fraunces + IBM Plex) load via `next/font` in `app/layout.tsx`. Prefer kit classes: `ggt-root`, `ggt-wrap`, `ggt-hero`, `ggt-eyebrow`, `ggt-lede`, `ggt-input`, `ggt-btn`, `ggt-result`, `ggt-paywall`, `ggt-trust`.

## Draft PRs

Draft PRs only. Brandon merges. Groundwork owns the shop allowlist PR for `quote-invoice`. Cos sets `live: true` after smoke is clear — see `REGISTRY.md`.

## License

Private tool package for Golden Goose Tools.
