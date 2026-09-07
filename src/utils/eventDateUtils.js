/**
 * IEEE MSB — Event Date Range, Registration Cutoff, & Capacity Helpers
 */

/**
 * Formats start and end dates as a single unified string:
 * - Single day: "Oct 15, 2026"
 * - Multi-day, same month: "Oct 7–9, 2026"
 * - Multi-day, cross months: "Oct 28 – Nov 3, 2026"
 * - Multi-day, cross years: "Dec 30, 2026 – Jan 2, 2027"
 */
export function formatEventDateRange(startDateStr, endDateStr, fallbackDateStr) {
  const startRaw = startDateStr || fallbackDateStr;
  const endRaw = endDateStr;

  if (!startRaw && !endRaw) {
    return 'Date Announced Soon';
  }

  const start = startRaw ? new Date(startRaw) : null;
  const end = endRaw ? new Date(endRaw) : null;

  if (start && isNaN(start.getTime())) {
    return 'Invalid Date';
  }
  if (end && isNaN(end.getTime())) {
    return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // If no end date or start and end are on the exact same calendar day
  if (!end || (start && start.toDateString() === end.toDateString())) {
    const d = start || end;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // If only end date is given
  if (!start && end) {
    return end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  // Same month and same year: e.g. "Oct 7–9, 2026"
  if (startYear === endYear && startMonth === endMonth) {
    return `${startMonth} ${startDay}–${endDay}, ${startYear}`;
  }

  // Different months, same year: e.g. "Oct 28 – Nov 3, 2026"
  if (startYear === endYear) {
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${startYear}`;
  }

  // Spanning different years: e.g. "Dec 30, 2026 – Jan 2, 2027"
  return `${startMonth} ${startDay}, ${startYear} – ${endMonth} ${endDay}, ${endYear}`;
}

/**
 * Determines whether registration is currently active based on:
 * 1. isRegistrationOpen flag (must be true)
 * 2. Calendar-day cutoff: Midnight (00:00) on the day before the event End Date
 */
export function getEventRegistrationState(event) {
  if (!event) {
    return { isOpen: true, label: 'Registration Open', badgeClass: 'badge-accent' };
  }

  if (event.isRegistrationOpen === false) {
    return {
      isOpen: false,
      label: 'Registration Closed',
      badgeClass: 'badge-danger',
      reason: 'Registration has been closed by organizers.',
    };
  }

  // Check calendar-day cutoff: Midnight (00:00) on the day prior to endDate (or startDate if no endDate)
  const targetDateStr = event.endDate || event.startDate;
  if (targetDateStr) {
    const targetDate = new Date(targetDateStr);
    if (!isNaN(targetDate.getTime())) {
      const cutoff = new Date(targetDate);
      cutoff.setDate(cutoff.getDate() - 1);
      cutoff.setHours(0, 0, 0, 0);

      if (Date.now() >= cutoff.getTime()) {
        return {
          isOpen: false,
          label: 'Registration Closed',
          badgeClass: 'badge-danger',
          reason: 'Registration closed 1 day prior to the event.',
        };
      }
    }
  }

  return {
    isOpen: true,
    label: 'Registration Open',
    badgeClass: 'badge-accent',
  };
}

/**
 * Format capacity: if -1 or null, returns '∞ Unlimited'
 */
export function formatCapacity(capacity) {
  if (capacity === -1 || capacity === '-1' || capacity === null || capacity === undefined) {
    return '∞ Unlimited';
  }
  return String(capacity);
}

/**
 * Determines whether an event's date has passed:
 * An event is only considered past once the entire calendar day (23:59:59)
 * of its endDate (or startDate / date if single day) has completely ended.
 */
export function isEventPast(event) {
  if (!event) return false;
  const targetDateStr = event.endDate || event.startDate || event.date;
  if (!targetDateStr) return false;

  const targetDate = new Date(targetDateStr);
  if (isNaN(targetDate.getTime())) return false;

  // End of the target calendar day (23:59:59.999)
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  return Date.now() > endOfDay.getTime();
}

/**
 * Returns dynamic lifecycle status: 'archived' | 'past' | 'active'
 */
export function getEventLifecycleStatus(event) {
  if (!event) return 'active';
  if (event.status === 'archived') return 'archived';
  if (isEventPast(event)) return 'past';
  return 'active';
}
