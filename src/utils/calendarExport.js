import { createEvent } from 'ics';

export const generateInterviewICS = (application) => {
  const { interview, company, title } = application;
  const [year, month, day] = interview.date.split('-').map(Number);
  const [hours, minutes] = interview.time.split(':').map(Number);

  const event = {
    start: [year, month, day, hours, minutes],
    duration: { hours: 1 }, // Default 1-hour interview
    title: `Interview with ${company}`,
    description: `Job Interview for ${title} position\n\n${
      interview.locationType === 'remote'
        ? `Meeting Link: ${interview.location.remote}`
        : `Location: ${interview.location.inPerson}`
    }`,
    location: interview.locationType === 'remote' ? 'Remote Interview' : interview.location.inPerson,
    status: 'CONFIRMED',
    busyStatus: 'BUSY'
  };

  createEvent(event, (error, value) => {
    if (error) {
      console.error(error);
      return;
    }

    const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `interview-${company.toLowerCase().replace(/\s+/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
};