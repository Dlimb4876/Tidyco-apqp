/* ============================================================
   cap-data-utils.js — Shared Data Utilities

   Generic normalize/dedupe/sort functions extracted from
   department data layers for use across all capacity portals.
   ============================================================ */

// ── Department Tag Normalization ────────────────────────────
window.capNormalizeDepartmentTag = function(value, fallback = 'ME') {
  const normalized = (value || fallback || 'ME').toString().trim().toUpperCase();
  if (normalized === 'PM') return 'PM';
  if (normalized === 'LOG') return 'LOG';
  if (normalized === 'UNIT6') return 'UNIT6';
  return 'ME';
};

// ── UUID Generation ─────────────────────────────────────────
window.capUUID = function() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ── Date Normalization ──────────────────────────────────────
window.capNormalizeDateOnly = function(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
};

window.capNormalizeIsoDate = function(dateValue, fallbackDate) {
  if (!dateValue) return fallbackDate;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return fallbackDate;
  return parsed.toISOString().split('T')[0];
};

window.capNormalizeDateRange = function(startDate, endDate, fallbackDate) {
  let safeStart = capNormalizeIsoDate(startDate, fallbackDate);
  let safeEnd = capNormalizeIsoDate(endDate, fallbackDate);

  if (safeEnd < safeStart) {
    safeEnd = safeStart;
  }

  return { safeStart, safeEnd };
};

window.capGetDateMinusOneDay = function(dateValue) {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  parsed.setDate(parsed.getDate() - 1);
  return parsed.toISOString().split('T')[0];
};

// ── Product Support Breakdown Normalization ─────────────────
window.capNormalizeProductSupportBreakdown = function(source, fallbackHoursPerWeek) {
  const rawTotal = Number(
    fallbackHoursPerWeek ??
    (source && (source.hoursPerWeek ?? source.hours_per_week)) ??
    0
  );
  const rawLegacyKittingBooking = Number(source && (source.kittingTimeBookingHours ?? source.kitting_time_booking_hours));
  const rawKitting = Number(source && (source.kittingHours ?? source.kitting_hours));
  const rawBookingInOut = Number(source && (source.bookingInOutHours ?? source.booking_in_out_hours));
  const rawMovement = Number(source && (source.productMovementHours ?? source.product_movement_hours));
  const hasSplitBreakdown = Number.isFinite(rawKitting) || Number.isFinite(rawBookingInOut);
  const hasBreakdown = hasSplitBreakdown || Number.isFinite(rawLegacyKittingBooking) || Number.isFinite(rawMovement);

  const kittingHours = hasSplitBreakdown
    ? Math.max(0, Number.isFinite(rawKitting) ? rawKitting : 0)
    : (hasBreakdown
      ? Math.max(0, Number.isFinite(rawLegacyKittingBooking) ? rawLegacyKittingBooking : 0)
      : Math.max(0, Number.isFinite(rawTotal) ? rawTotal : 0));
  const bookingInOutHours = hasSplitBreakdown
    ? Math.max(0, Number.isFinite(rawBookingInOut) ? rawBookingInOut : 0)
    : 0;
  const productMovementHours = hasBreakdown
    ? Math.max(0, Number.isFinite(rawMovement) ? rawMovement : 0)
    : 0;
  const hoursPerWeek = hasBreakdown
    ? kittingHours + bookingInOutHours + productMovementHours
    : Math.max(0, Number.isFinite(rawTotal) ? rawTotal : 0);

  return {
    hoursPerWeek,
    kittingHours,
    bookingInOutHours,
    // Backward-compatible alias for legacy references.
    kittingTimeBookingHours: kittingHours,
    productMovementHours
  };
};

// ── Holiday Record Normalization ────────────────────────────
window.capNormalizeHolidayRecord = function(holiday) {
  if (!holiday || typeof holiday !== 'object') return null;

  const personId = holiday.personId || holiday.person_id;
  const date = holiday.date || '';
  const type = holiday.type === 'half' ? 'half' : 'full';

  if (!personId || !date) return null;

  return {
    id: holiday.id || capUUID(),
    userId: holiday.userId || holiday.user_id || null,
    personId,
    date,
    type,
    department: capNormalizeDepartmentTag(holiday.department, 'ME'),
    createdAt: holiday.createdAt || holiday.created_at || new Date().toISOString()
  };
};

// ── Holiday Deduplication ───────────────────────────────────
window.capNormalizeAndDedupeHolidays = function(holidays) {
  if (!Array.isArray(holidays)) return [];

  const byPersonDate = new Map();
  holidays.forEach(rawHoliday => {
    const normalized = capNormalizeHolidayRecord(rawHoliday);
    if (!normalized) return;
    byPersonDate.set(`${normalized.personId}|${normalized.date}`, normalized);
  });

  return Array.from(byPersonDate.values());
};

// ── Support History Record Normalization ────────────────────
window.capNormalizeSupportHistoryRecord = function(record, fallbackDepartment = 'ME') {
  if (!record || typeof record !== 'object') return null;

  const productId = record.productId || record.product_id;
  const effectiveDate = capNormalizeDateOnly(record.effectiveDate || record.effective_date);
  if (!productId || !effectiveDate) return null;

  const breakdown = capNormalizeProductSupportBreakdown(record);

  return {
    id: record.id || capUUID(),
    productId,
    hoursPerWeek: breakdown.hoursPerWeek,
    kittingHours: breakdown.kittingHours,
    bookingInOutHours: breakdown.bookingInOutHours,
    kittingTimeBookingHours: breakdown.kittingHours,
    productMovementHours: breakdown.productMovementHours,
    effectiveDate,
    endDate: capNormalizeDateOnly(record.endDate || record.end_date) || '',
    changeReason: record.changeReason || record.change_reason || '',
    notes: record.notes || '',
    department: capNormalizeDepartmentTag(record.department, fallbackDepartment),
    createdAt: record.createdAt || record.created_at || new Date().toISOString(),
    updatedAt: record.updatedAt || record.updated_at || ''
  };
};

// ── Support History Deduplication ───────────────────────────
window.capNormalizeAndDedupeSupportHistory = function(rows) {
  if (!Array.isArray(rows)) return [];

  function supportHistoryTimestamp(row) {
    if (!row || typeof row !== 'object') return 0;
    const updated = Date.parse(row.updatedAt || row.updated_at || '');
    if (Number.isFinite(updated)) return updated;
    const created = Date.parse(row.createdAt || row.created_at || '');
    if (Number.isFinite(created)) return created;
    return 0;
  }

  function pickPreferredRecord(existingRecord, nextRecord) {
    if (!existingRecord) return nextRecord;
    if (!nextRecord) return existingRecord;

    const existingTime = supportHistoryTimestamp(existingRecord);
    const nextTime = supportHistoryTimestamp(nextRecord);
    if (nextTime >= existingTime) return nextRecord;
    return existingRecord;
  }

  const deduped = new Map();
  rows.forEach(raw => {
    const normalized = capNormalizeSupportHistoryRecord(raw);
    if (!normalized) return;
    const key = `${normalized.productId}|${normalized.effectiveDate}|${normalized.department}`;
    const existing = deduped.get(key);
    deduped.set(key, pickPreferredRecord(existing, normalized));
  });

  return capSortSupportHistoryByDate(Array.from(deduped.values()));
};

// ── Support History Sorting ─────────────────────────────────
window.capSortSupportHistoryByDate = function(historyRows) {
  return (historyRows || []).slice().sort((a, b) => {
    const aDate = capNormalizeDateOnly(a.effectiveDate || a.effective_date);
    const bDate = capNormalizeDateOnly(b.effectiveDate || b.effective_date);
    if (aDate === bDate) return 0;
    return aDate < bDate ? -1 : 1;
  });
};
