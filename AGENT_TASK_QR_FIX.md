# Agent Task Brief — Fix: UPI QR Code Not Scanning (2026-08-10)

**To: Antigravity Agent**

Your previous QR pass added real, correct improvements (4-module quiet zone, integer-pixel scaling, 8-mask penalty selection are all genuinely ISO/IEC 18004-compliant and should stay exactly as they are). But the QR still doesn't scan because of a **separate, specific bug** in the Reed-Solomon error-correction block-size lookup in `src/lib/qrCode.js`. This is a precise root cause, not a guess — fix exactly this, don't rewrite the rest of the file.

## Root cause

`QRErrorCorrectLevel` is defined as:
```js
const QRErrorCorrectLevel = { L: 1, M: 0, Q: 3, H: 2 };
```
These specific numeric values are **not arbitrary** — they're mandated by the ISO/IEC 18004 format-info bit encoding (the 2-bit ECC-level field in a QR's format information is `M=00, L=01, H=10, Q=11`), and `setupTypeInfo()` uses them directly to build the format-info bits via `getBCHTypeInfo()`. **Do not change these enum values** — that part is correct and required for spec compliance.

The bug is in `getRsBlockTable()`:
```js
getRsBlockTable: function (typeNumber, errorCorrectLevel) {
  const idx = (typeNumber - 1) * 4 + errorCorrectLevel;
  return QRRSBlock.RS_BLOCK_TABLE[idx];
},
```
This uses the raw enum value (`M=0, L=1, Q=3, H=2`) directly as an array offset into `RS_BLOCK_TABLE`, whose rows are physically laid out in **`L, M, Q, H`** order (0,1,2,3) per the table's own comment (`// L, M, Q, H`) and per the actual data — e.g. for Version 1 the table's first four rows are `[1,26,19]` (L: 19 data codewords), `[1,26,16]` (M: 16), `[1,26,13]` (Q: 13), `[1,26,9]` (H: 9), which are the well-known canonical Version-1 codeword counts in that exact order.

Since `generateQrDataUrl()` always requests `QRErrorCorrectLevel.M` (value `0`), the lookup does `idx = (typeNumber-1)*4 + 0`, which fetches **row 0 = the L row**, not the M row. So the actual data is encoded using **Level L's** block/codeword structure, while the format-info bits embedded in the same QR correctly declare "this is Level M" (because `setupTypeInfo` uses the raw value `0` correctly for the BCH bits). A spec-compliant scanner (Google Lens, GPay, PhonePe) reads the format bits, sees "Level M," and tries to decode/error-correct using Level M's known block structure — which doesn't match what was actually written. Decode fails. This is exactly the kind of bug that produces a QR that *looks* completely normal (correct finder patterns, correct quiet zone, correct visual density) but silently fails to decode.

## The fix

Replace `getRsBlockTable` with an explicit level→row-offset mapping instead of using the raw enum value as an array index:

```js
getRsBlockTable: function (typeNumber, errorCorrectLevel) {
  let offset;
  switch (errorCorrectLevel) {
    case QRErrorCorrectLevel.L: offset = 0; break;
    case QRErrorCorrectLevel.M: offset = 1; break;
    case QRErrorCorrectLevel.Q: offset = 2; break;
    case QRErrorCorrectLevel.H: offset = 3; break;
    default: return undefined;
  }
  return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + offset];
},
```
This is the only change needed in this function. `getRSBlocks()` (which calls this) and everything downstream (`createData`, `createBytes`) needs no other changes — they'll now correctly receive Level M's actual block sizes, matching what the format-info bits declare.

## Verification (do this, don't just claim it's fixed)

1. After the fix, generate a QR for a short, simple string first (e.g. `https://example.com`) and physically scan it with a phone camera/Google Lens to confirm basic decodability before testing the real UPI URI — this isolates whether the fix alone resolves it, independent of URI length/content.
2. Then generate the QR for an actual UPI URI (via `buildUpiPaymentUri`) as used on a real invoice and scan it with **at least two different apps** (e.g. Google Pay and PhonePe, or Google Lens plus one payment app) — the client specifically reported both failing before.
3. Test both `upi_mode` settings (`upi_id` and `bank_account`) since they produce different `pa=` values and therefore different payload lengths, which can select a different QR version/typeNumber — confirm both scan.

## Secondary check — bank account mode's `pa` format

While verifying, also flag this to the client rather than silently "fixing" it (it may not be a bug you can fix in code — it's a UPI ecosystem limitation): the `bank_account` mode constructs `pa` as `{accountNumber}@{IFSC}.ifsc.npci`. This synthetic address format isn't a real, universally-resolvable VPA the way `name@okaxis` or `phone@upi` are — most consumer UPI apps only resolve genuine registered VPAs, not arbitrary account+IFSC strings, regardless of whether the QR itself decodes correctly. If step 3 above shows `upi_id` mode scans fine but `bank_account` mode still doesn't get past the payment app's own "invalid payee" screen (as opposed to failing to scan at all), that's a separate, likely unfixable-in-code limitation — report it back rather than spending more time on it. Recommend the client primarily use `upi_id` mode (a real UPI ID/VPA) for reliability, and treat `bank_account` mode as best-effort.

## Do not touch
- The mask-penalty evaluation, quiet zone, integer-pixel scaling, and UTF-8 byte encoding logic — all correct, leave as-is.
- `QRErrorCorrectLevel` enum values — correct as-is, required for spec-compliant format bits.
- `setupTypeInfo` — correct as-is.

## Handover
Update `HANDOVER.md` with: confirmation of which apps you physically scanned successfully with after the fix, and the outcome of the `bank_account` mode secondary check.
