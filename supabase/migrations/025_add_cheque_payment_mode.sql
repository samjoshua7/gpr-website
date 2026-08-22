-- Migration 025: Add 'cheque' to receipts and payments mode check constraints

-- 1. Update receipts mode check constraint
ALTER TABLE public.receipts DROP CONSTRAINT IF EXISTS receipts_mode_check;
ALTER TABLE public.receipts ADD CONSTRAINT receipts_mode_check 
    CHECK (mode IN ('cash', 'upi', 'bank', 'cheque'));

-- 2. Update payments mode check constraint
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_mode_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_mode_check 
    CHECK (mode IN ('cash', 'upi', 'bank', 'cheque'));
