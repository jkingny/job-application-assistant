import React from 'react';

const InterviewCalendar = ({ applications }) => {
  const upcomingInterviews = applications
    .filter(app => app.interview?.date && new Date(app.interview.date) >= new Date())
    .sort((a, b) => new Date(a.interview.date) - new Date(b.interview.date));

  return (
    <div className="interview-calendar">
      <h2>Upcoming Interviews</h2>
      <div className="calendar-grid">
        {upcomingInterviews.map(app => (
          <div key={app.id} className="interview-card">
            <div className="interview-date">
              {new Date(app.interview.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </div>
            <div className="interview-time">{app.interview.time}</div>
            <div className="interview-company">{app.company}</div>
            <div className="interview-title">{app.title}</div>
            <div className="interview-type">
              {app.interview.locationType === 'remote' 
                ? `Remote (${new URL(app.interview.location.remote).hostname})`
                : `In Person: ${app.interview.location.inPerson}`
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewCalendar;