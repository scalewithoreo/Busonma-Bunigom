export const WEDDING_EVENT = {
  title: "Oreoluwa & Oluwadara's Wedding",
  description: "Join us in celebrating the joyful wedding of Oreoluwa & Oluwadara! Church Wedding at 11:00 AM at Celebration Church Int'l (Celebr8 Centre HQ) followed by Reception at 2:00 PM at Celebration Church Int'l (Celebr8 Centre HQ) (Annex 2).",
  location: "Celebration Church Int'l (Celebr8 Centre HQ) (Annex 2), Vori Close, off Acme Road, Ogba, Lagos",
  startDate: "20261212T070000Z", // 8:00 AM Lagos (WAT is UTC+1 -> 07:00 UTC) for Engagement start
  endDate: "20261212T200000Z",
  startLocal: "2026-12-12T08:00:00",
  endLocal: "2026-12-12T21:00:00",
};

export function getGoogleCalendarUrl(): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: WEDDING_EVENT.title,
    dates: `${WEDDING_EVENT.startDate}/${WEDDING_EVENT.endDate}`,
    details: WEDDING_EVENT.description,
    location: WEDDING_EVENT.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function getOutlookCalendarUrl(): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: WEDDING_EVENT.title,
    startdt: WEDDING_EVENT.startLocal,
    enddt: WEDDING_EVENT.endLocal,
    body: WEDDING_EVENT.description,
    location: WEDDING_EVENT.location,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function downloadIcsFile(): void {
  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Oreoluwa and Oluwadara//Wedding Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:${WEDDING_EVENT.title}`,
    `DESCRIPTION:${WEDDING_EVENT.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${WEDDING_EVENT.location}`,
    `DTSTART:${WEDDING_EVENT.startDate}`,
    `DTEND:${WEDDING_EVENT.endDate}`,
    `STATUS:CONFIRMED`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Oreoluwa-and-Oluwadara-Wedding.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
