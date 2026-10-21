/**
 * Calendar export helper for Google Calendar and Apple / Outlook iCal (.ics)
 */

function formatIcsDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Generate Google Calendar URL for an event
 */
export function createGoogleCalendarUrl({
  title,
  description = "",
  location = "",
  startDate,
  endDate,
}) {
  const start = startDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const end = endDate
    ? endDate.toISOString().replace(/-|:|\.\d\d\d/g, "")
    : start;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: description,
    location: location,
    dates: `${start}/${end}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Trigger download of an .ics file for importing into Apple Calendar, Google Calendar, or Outlook
 */
export function downloadIcsFile({
  title,
  description = "",
  location = "",
  startDate,
  endDate,
  filename = "event.ics",
}) {
  const dtStart = formatIcsDate(startDate);
  const dtEnd = endDate ? formatIcsDate(endDate) : dtStart;
  const now = formatIcsDate(new Date());

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rara & Faiz//Date and Moments//ID",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@rarafaiz.love`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title.replace(/\n/g, " ")}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `LOCATION:${location.replace(/\n/g, " ")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
