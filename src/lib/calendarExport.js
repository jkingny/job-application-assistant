import { saveAs } from 'file-saver'

function pad(n) {
  return String(n).padStart(2, '0')
}

// Formats a local date/time as a UTC-less floating ICS timestamp (YYYYMMDDTHHMMSS).
function formatICSDate(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-')
  const [hh, mm] = (timeStr || '00:00').split(':')
  return `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`
}

export function generateInterviewICS(app, round) {
  const date = round?.date || app.interview?.date
  const time = round?.time || app.interview?.time
  if (!date || !time) return

  const location =
    round?.locationType === 'inPerson'
      ? round?.location?.inPerson
      : round?.location?.remote || app.jobLink || ''

  const summary = `Interview: ${app.company} \u2014 ${app.title}`
  const description = [
    round?.interviewerName ? `Interviewer: ${round.interviewerName}` : null,
    round?.interviewerContact ? `Contact: ${round.interviewerContact}` : null,
    app.jobLink ? `Listing: ${app.jobLink}` : null,
  ]
    .filter(Boolean)
    .join('\\n')

  const dtStart = formatICSDate(date, time)
  const startDate = new Date(`${date}T${time}`)
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // default 1hr
  const dtEnd = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(
    endDate.getHours()
  )}${pad(endDate.getMinutes())}00`

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dossier Job Tracker//EN',
    'BEGIN:VEVENT',
    `UID:${app.id}-${Date.now()}@dossier`,
    `DTSTAMP:${dtStart}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    location ? `LOCATION:${location}` : null,
    description ? `DESCRIPTION:${description}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  saveAs(blob, `${app.company}-interview.ics`.replace(/\s+/g, '-'))
}
