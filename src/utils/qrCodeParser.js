/**
 * Smart QR code parser for IEEE Portal Event Scanner.
 * Accurately extracts attendee ticket IDs from multiple formats and detects
 * accidental scans of Activity Kiosk QR codes.
 */

const MONGO_ID_REGEX = /^[a-f\d]{24}$/i;

export function parseScannedQrPayload(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return { type: 'invalid', message: 'Empty or invalid QR code format', rawPayload: '' };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { type: 'invalid', message: 'Empty QR code', rawPayload: '' };
  }

  // 1. Check if it's a URL containing an Activity Kiosk check-in route
  // e.g., "https://portal.ieee.org/checkin/act_123" or "/checkin/act_123"
  const kioskMatch = trimmed.match(/\/checkin\/([a-zA-Z0-9_-]+)/i);
  if (kioskMatch) {
    const activityQrId = kioskMatch[1];
    return {
      type: 'activity_kiosk',
      activityQrId,
      message: 'This is an Activity Kiosk QR code (for self-service check-in), not an Attendee Ticket Pass.',
      rawPayload: trimmed,
    };
  }

  // 2. Check if JSON ticket payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);

      // Check if it's an activity object mistakenly encoded as QR
      if (parsed.checkInMode === 'self_service' || (parsed.qrId && !parsed.ticketId && !parsed.participantId)) {
        return {
          type: 'activity_kiosk',
          activityQrId: parsed.qrId || parsed._id || parsed.id,
          message: 'This is an Activity Kiosk QR code (for self-service check-in), not an Attendee Ticket Pass.',
          rawPayload: trimmed,
        };
      }

      const ticketId = parsed.ticketId || parsed.participantId || parsed._id || parsed.id;
      if (ticketId) {
        return {
          type: 'ticket',
          ticketId: String(ticketId).trim(),
          eventId: parsed.eventId ? String(parsed.eventId).trim() : null,
          attendeeName: parsed.name || parsed.attendeeName || null,
          attendeeEmail: parsed.email || null,
          rawPayload: trimmed,
          metadata: parsed,
        };
      }
    } catch {
      // Fall through to other checks
    }
  }

  // 3. Check for URL with query parameter (e.g., https://...?ticketId=65f... or ?id=65f...)
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const ticketParam = url.searchParams.get('ticketId') || url.searchParams.get('id') || url.searchParams.get('t');
      if (ticketParam) {
        return {
          type: 'ticket',
          ticketId: ticketParam.trim(),
          rawPayload: trimmed,
        };
      }

      // Check URL pathname for direct ticket ID e.g., /tickets/65f...
      const ticketPathMatch = url.pathname.match(/\/tickets?\/([a-f\d]{24})/i);
      if (ticketPathMatch) {
        return {
          type: 'ticket',
          ticketId: ticketPathMatch[1],
          rawPayload: trimmed,
        };
      }
    }
  } catch {
    // Non-URL string
  }

  // 4. Check for direct MongoDB ObjectId
  if (MONGO_ID_REGEX.test(trimmed)) {
    return {
      type: 'ticket',
      ticketId: trimmed,
      rawPayload: trimmed,
    };
  }

  // 5. Fallback: treat as direct ticket ID string
  return {
    type: 'ticket',
    ticketId: trimmed,
    rawPayload: trimmed,
  };
}
