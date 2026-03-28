/* ============================================================
   me-data-normalize.js — ME Capacity Normalization Helpers
   Shared pure helpers extracted from me-data.js
   ============================================================ */

function meNormalizeDepartmentTag(value, fallback = 'ME') {
  if (typeof window.capNormalizeDepartmentTag === 'function') {
    return window.capNormalizeDepartmentTag(value, fallback);
  }

  const normalized = (value || fallback || 'ME').toString().trim().toUpperCase();
  if (normalized === 'PM') return 'PM';
  if (normalized === 'LOG') return 'LOG';
  if (normalized === 'UNIT6') return 'UNIT6';
  return 'ME';
}

function meNormalizeMeTableDepartment(value) {
  void value;
  return 'ME';
}

function meNormalizeHolidayRecord(holiday) {
  if (typeof window.capNormalizeHolidayRecord === 'function') {
    return window.capNormalizeHolidayRecord(holiday);
  }

  if (!holiday || typeof holiday !== 'object') return null;

  const personId = holiday.personId || holiday.person_id;
  const date = holiday.date || '';
  const type = holiday.type === 'half' ? 'half' : 'full';

  if (!personId || !date) return null;

  return {
    id: holiday.id || meUUID(),
    userId: holiday.userId || holiday.user_id || null,
    personId,
    date,
    type,
    department: meNormalizeDepartmentTag(holiday.department, 'ME'),
    createdAt: holiday.createdAt || holiday.created_at || new Date().toISOString()
  };
}

function meNormalizeAndDedupeHolidays(holidays) {
  if (typeof window.capNormalizeAndDedupeHolidays === 'function') {
    return window.capNormalizeAndDedupeHolidays(holidays);
  }

  if (!Array.isArray(holidays)) return [];

  const byPersonDate = new Map();
  holidays.forEach(rawHoliday => {
    const normalized = meNormalizeHolidayRecord(rawHoliday);
    if (!normalized) return;
    byPersonDate.set(`${normalized.personId}|${normalized.date}`, normalized);
  });

  return Array.from(byPersonDate.values());
}

function meNormalizeDateOnly(value) {
  if (typeof window.capNormalizeDateOnly === 'function') {
    return window.capNormalizeDateOnly(value);
  }

  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
}

function meNormalizeProductSupportBreakdown(source, fallbackHoursPerWeek) {
  if (typeof window.capNormalizeProductSupportBreakdown === 'function') {
    return window.capNormalizeProductSupportBreakdown(source, fallbackHoursPerWeek);
  }

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
    kittingTimeBookingHours: kittingHours,
    productMovementHours
  };
}

function meGetDateMinusOneDay(dateValue) {
  if (typeof window.capGetDateMinusOneDay === 'function') {
    return window.capGetDateMinusOneDay(dateValue);
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  parsed.setDate(parsed.getDate() - 1);
  return parsed.toISOString().split('T')[0];
}

function meNormalizeSupportHistoryRecord(record, fallbackDepartment = 'ME') {
  if (typeof window.capNormalizeSupportHistoryRecord === 'function') {
    return window.capNormalizeSupportHistoryRecord(record, fallbackDepartment);
  }

  if (!record || typeof record !== 'object') return null;

  const productId = record.productId || record.product_id;
  const effectiveDate = meNormalizeDateOnly(record.effectiveDate || record.effective_date);
  if (!productId || !effectiveDate) return null;

  const breakdown = meNormalizeProductSupportBreakdown(record);

  return {
    id: record.id || meUUID(),
    productId,
    hoursPerWeek: breakdown.hoursPerWeek,
    kittingHours: breakdown.kittingHours,
    bookingInOutHours: breakdown.bookingInOutHours,
    kittingTimeBookingHours: breakdown.kittingHours,
    productMovementHours: breakdown.productMovementHours,
    effectiveDate,
    endDate: meNormalizeDateOnly(record.endDate || record.end_date) || '',
    changeReason: record.changeReason || record.change_reason || '',
    notes: record.notes || '',
    department: meNormalizeDepartmentTag(record.department, fallbackDepartment),
    createdAt: record.createdAt || record.created_at || new Date().toISOString(),
    updatedAt: record.updatedAt || record.updated_at || ''
  };
}

function meSortSupportHistoryByDate(historyRows) {
  if (typeof window.capSortSupportHistoryByDate === 'function') {
    return window.capSortSupportHistoryByDate(historyRows);
  }

  return (historyRows || []).slice().sort((a, b) => {
    const aDate = meNormalizeDateOnly(a.effectiveDate || a.effective_date);
    const bDate = meNormalizeDateOnly(b.effectiveDate || b.effective_date);
    if (aDate === bDate) return 0;
    return aDate < bDate ? -1 : 1;
  });
}

function meSupportHistoryTimestamp(row) {
  if (!row || typeof row !== 'object') return 0;
  const updated = Date.parse(row.updatedAt || row.updated_at || '');
  if (Number.isFinite(updated)) return updated;
  const created = Date.parse(row.createdAt || row.created_at || '');
  if (Number.isFinite(created)) return created;
  return 0;
}

function mePickPreferredSupportHistoryRecord(existingRecord, nextRecord) {
  if (!existingRecord) return nextRecord;
  if (!nextRecord) return existingRecord;

  const existingTime = meSupportHistoryTimestamp(existingRecord);
  const nextTime = meSupportHistoryTimestamp(nextRecord);
  if (nextTime >= existingTime) return nextRecord;
  return existingRecord;
}

function meNormalizeAndDedupeSupportHistory(rows) {
  if (typeof window.capNormalizeAndDedupeSupportHistory === 'function') {
    return window.capNormalizeAndDedupeSupportHistory(rows);
  }

  if (!Array.isArray(rows)) return [];

  const deduped = new Map();
  rows.forEach(raw => {
    const normalized = meNormalizeSupportHistoryRecord(raw);
    if (!normalized) return;
    const key = `${normalized.productId}|${normalized.effectiveDate}|${normalized.department}`;
    const existing = deduped.get(key);
    deduped.set(key, mePickPreferredSupportHistoryRecord(existing, normalized));
  });

  return meSortSupportHistoryByDate(Array.from(deduped.values()));
}