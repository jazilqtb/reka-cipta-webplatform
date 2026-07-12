-- Fix supplier_salt_types_nonempty CHECK constraint (E5-CF-DB-01 bugfix).
--
-- array_length(arr, 1) returns NULL (not 0) for an empty array, and a
-- CHECK constraint treats a NULL result as PASSING (only an explicit
-- FALSE rejects the row). This meant an anon insert with
-- salt_types_available = ARRAY[]::TEXT[] was silently accepted instead
-- of rejected — caught during STOP GATE 1 manual RLS testing (Test #4).
--
-- cardinality() returns 0 (not NULL) for an empty array, so it correctly
-- evaluates to FALSE and rejects the row.

ALTER TABLE public.supplier_registrations
    DROP CONSTRAINT supplier_salt_types_nonempty;

ALTER TABLE public.supplier_registrations
    ADD CONSTRAINT supplier_salt_types_nonempty
    CHECK (cardinality(salt_types_available) >= 1);
