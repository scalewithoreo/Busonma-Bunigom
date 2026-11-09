export interface CalendarEventData {
  title: string;
  description: string;
  location: string;
  startDate: string; // UTC ISO formatted e.g. 20261212T100000Z
  endDate: string;
  startLocal?: string;
  endLocal?: string;
  downloadFilename?: string;
}

export const WEDDING_EVENT: CalendarEventData = {
  title: "Miracle & Malvin's Wedding",
  description: "Join us in celebrating the joyful wedding of Miracle & Malvin! Church Wedding at 11:00 AM at Celebration Church Int'l (Celebr8 Centre HQ) followed by Reception at 2:00 PM at Celebration Church Int'l (Celebr8 Centre HQ) (Annex 2).",
  location: "Celebration Church Int'l (Celebr8 Centre HQ) (Annex 2), Vori Close, off Acme Road, Ogba, Lagos",
  startDate: "20270127T100000Z",
  endDate: "20270127T200000Z",
  startLocal: "2027-01-27T11:00:00",
  endLocal: "2027-01-27T21:00:00",
  downloadFilename: "wedding-event.ics",
};

export function getGoogleCalendarUrl(event: CalendarEventData = WEDDING_EVENT): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${event.startDate}/${event.endDate}`,
    details: event.description,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function getOutlookCalendarUrl(event: CalendarEventData = WEDDING_EVENT): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: event.startLocal || event.startDate,
    enddt: event.endLocal || event.endDate,
    body: event.description,
    location: event.location,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function downloadIcsFile(event: CalendarEventData = WEDDING_EVENT): void {
  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    `DTSTART:${event.startDate}`,
    `DTEND:${event.endDate}`,
    `STATUS:CONFIRMED`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', event.downloadFilename || `${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
