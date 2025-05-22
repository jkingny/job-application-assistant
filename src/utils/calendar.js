export const generateICSFile = (applications) => {
  const events = applications
    .filter(app => app.status === 'Interviewing' && app.interview.date)
    .map(app => {
      const [year, month, day] = app.interview.date.split('-').map(Number);
      const [hours, minutes] = app.interview.time ? app.interview.time.split(':').map(Number) : [9, 0];
      
      return [
        'BEGIN:VEVENT',
        `DTSTART:${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}00`,
        `DTEND:${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}T${String(hours + 1).padStart(2, '0')}${String(minutes).padStart(2, '0')}00`,
        `SUMMARY:Interview with ${app.company} - ${app.title}`,
        `LOCATION:${app.interview.location || 'TBD'}`,
        `DESCRIPTION:${app.interview.notes || ''}`,
        'END:VEVENT'
      ].join('\n');
    });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR'
  ].join('\n');
};