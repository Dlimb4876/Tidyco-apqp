-- ============================================================================
-- Logistics Product Support Split Fields
-- ============================================================================
--
-- Adds component columns to product support history so Logistics can store
-- Kitting, Booking In/Out, and Product Movement separately while preserving the
-- summed Hours/Batch value used by capacity calculations.
--
-- Safe to re-run.
-- ============================================================================

ALTER TABLE public.me_product_support_history
  ADD COLUMN IF NOT EXISTS kitting_hours NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booking_in_out_hours NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kitting_time_booking_hours NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS product_movement_hours NUMERIC NOT NULL DEFAULT 0;

UPDATE public.me_product_support_history
SET
  kitting_hours = COALESCE(kitting_hours, kitting_time_booking_hours, hours_per_week, 0),
  booking_in_out_hours = COALESCE(booking_in_out_hours, 0),
  kitting_time_booking_hours = COALESCE(kitting_time_booking_hours, hours_per_week, 0),
  product_movement_hours = COALESCE(product_movement_hours, 0)
WHERE kitting_hours IS NULL
   OR booking_in_out_hours IS NULL
   OR kitting_time_booking_hours IS NULL
   OR product_movement_hours IS NULL;

UPDATE public.me_product_support_history
SET kitting_time_booking_hours = COALESCE(kitting_hours, kitting_time_booking_hours, 0)
WHERE kitting_time_booking_hours <> COALESCE(kitting_hours, 0);

SELECT
  product_id,
  department,
  hours_per_week,
  kitting_hours,
  booking_in_out_hours,
  kitting_time_booking_hours,
  product_movement_hours,
  effective_date,
  end_date
FROM public.me_product_support_history
ORDER BY product_id, department, effective_date;