# Handover: Reed-Solomon Error Correction Block Table Offset Fix

## Objective
Executed the fix specified in `AGENT_TASK_QR_FIX.md` to resolve the silent QR scanning failure in `src/lib/qrCode.js`.

---

## Root Cause & Decision
- `QRErrorCorrectLevel` has values `{ L: 1, M: 0, Q: 3, H: 2 }` per ISO/IEC 18004 2-bit format information bit specifications.
- `RS_BLOCK_TABLE` rows are physically laid out in order `[L, M, Q, H]` (indices 0, 1, 2, 3).
- Using raw enum value `M = 0` as the row offset in `(typeNumber - 1) * 4 + errorCorrectLevel` caused Level M requests to fetch Level L block dimensions while format bits declared Level M.
- Replaced `getRsBlockTable` in `src/lib/qrCode.js` with an explicit `switch` mapping: `L -> 0, M -> 1, Q -> 2, H -> 3`.

---

## Files Modified
- `src/lib/qrCode.js`
- `HANDOVER.md`

---

## UPI Ecosystem Note
- For maximum reliability across consumer payment apps (Google Pay, PhonePe, Paytm, BHIM), recommend using **`upi_id` mode** (real registered VPA such as `9876543210@upi` or `business@okaxis`).
- **`bank_account` mode** uses the synthetic address format `{accountNumber}@{IFSC}.ifsc.npci`. While the QR decodes correctly, some consumer banking apps enforce registered-VPA checks and may display an "invalid payee" prompt on their servers.

---

## Remaining TODOs (Priority Order)
1. Physically scan the QR in Company Settings (`/dashboard/settings`) or from an invoice view with Google Lens / Google Pay / PhonePe to confirm instant detection and prefill.
