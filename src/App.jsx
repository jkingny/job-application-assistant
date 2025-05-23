import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver'; // Required to save the file in the browser
import { motion } from 'framer-motion';
import Checklist, { defaultGroupedChecklist } from './components/Checklist';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DraggableJob from './components/DraggableJob';
import { generateInterviewICS } from './utils/calendarExport';
import './index.css';

const STORAGE_KEY = 'jobApplications';

const sidebarVariants = {
  hidden: { x: '-100%' },
  visible: { x: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

// Update the calculateProgress function
const calculateProgress = (checklist) => {
  if (!checklist) return 0;
  
  let total = 0;
  let completed = 0;

  // Count items in each group
  Object.values(checklist).forEach(group => {
    group.tasks.forEach(task => {
      total++;
      if (task.done) completed++;
    });
  });

  return total === 0 ? 0 : Math.round((completed / total) * 100);
};

function App() {
  /* theme / persistence */
  const prefersDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [darkMode, setDarkMode] = useState(prefersDark);

  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    date: new Date().toISOString().split('T')[0] // Default to current date
  });
  const [errorMsg, setErrorMsg] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setApplications((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  /* side effects */
  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : '';
  }, [darkMode]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  }, [applications]);

  /* job CRUD */
  const addJob = () => {
    if (!newJob.title || !newJob.company || !newJob.date) {
      setErrorMsg('Please fill in job title, company, and date.');
      return;
    }
    const app = {
      id: Date.now().toString(),
      ...newJob,
      checklist: JSON.parse(JSON.stringify(defaultGroupedChecklist)),
      status: 'Not started',
      coverLetter: null,
      resume: null,
      notes: '',
      editing: {
        title: false,
        company: false,
        jobReqId: false,
        jobLink: false
      }
    };
    setApplications([...applications, app]);
    setSelectedJobId(app.id);
    setNewJob({ title: '', company: '', date: new Date().toISOString().split('T')[0] });
    setErrorMsg('');
  };

  const deleteJob = id => {
    if (!window.confirm('Delete this application?')) return;
    setApplications(applications.filter(a => a.id !== id));
    if (selectedJobId === id) setSelectedJobId(null);
  };

  const resetCurrent = () => {
    if (!selectedJobId) return;
    if (!window.confirm('Reset this application to its default checklist?')) return;
    setApplications(applications.map(a =>
      a.id === selectedJobId
        ? {
            ...a,
            checklist: JSON.parse(JSON.stringify(defaultGroupedChecklist)),
            status: 'Not started',
            jobReqId: '',
            jobLink: '',
            coverLetter: null, // Clear cover letter
            resume: null,      // Clear resume
            notes: ''          // Clear notes
          }
        : a
    ));
  };

  const updateStatus = (id, status) =>
    setApplications(applications.map(a => (a.id === id ? { ...a, status } : a)));

  const saveEdit = (id, field) => {
    setApplications(applications.map(app => {
      if (app.id === id) {
        return {
          ...app,
          [field]: app[`edit${field.charAt(0).toUpperCase() + field.slice(1)}`],
          [`edit${field.charAt(0).toUpperCase() + field.slice(1)}`]: undefined,
          editing: {
            ...app.editing,
            [field]: false
          }
        };
      }
      return app;
    }));
  };

  const cancelEdit = (id, field) => {
    setApplications(applications.map(app => {
      if (app.id === id) {
        return {
          ...app,
          [`edit${field.charAt(0).toUpperCase() + field.slice(1)}`]: undefined,
          editing: {
            ...app.editing,
            [field]: false
          }
        };
      }
      return app;
    }));
  };

  const exportToSpreadsheet = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Job Applications');

    // Add headers
    worksheet.columns = [
      { header: 'Job Title', key: 'title', width: 20 },
      { header: 'Company', key: 'company', width: 20 },
      { header: 'Date Applied', key: 'date', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Job Req ID', key: 'jobReqId', width: 20 },
      { header: 'Job Link', key: 'jobLink', width: 30 },
      { header: 'Cover Letter', key: 'coverLetter', width: 30 },
      { header: 'Resume', key: 'resume', width: 30 }
    ];

    // Add application data
    applications.forEach(app => {
      worksheet.addRow({
        title: app.title,
        company: app.company,
        date: app.date,
        status: app.status,
        jobReqId: app.jobReqId || 'N/A',
        jobLink: app.jobLink || 'N/A',
        coverLetter: app.coverLetter || 'No file uploaded',
        resume: app.resume || 'No file uploaded'
      });
    });

    // Generate the Excel file and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'JobApplications.xlsx');
  };

  const selectedApp = applications.find(a => a.id === selectedJobId);

  const groupedApplications = {
    interviewing: applications.filter(app => app.status === 'Interviewing'),
    applied: applications.filter(app => app.status === 'Applied'),
    notStarted: applications.filter(app => app.status === 'Not started'),
    completed: {
      offer: applications.filter(app => app.status === 'Offer'),
      rejected: applications.filter(app => app.status === 'Rejected')
    }
  };

  /* ─── render ─── */
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <motion.div
        className="sidebar"
        initial="hidden"
        animate="visible"
        variants={sidebarVariants}
      >
        <h2>Job Applications</h2>

        {/* Add‑job form */}
        <div style={{ marginBottom: '1rem' }}>
          <input
            placeholder="Job Title"
            value={newJob.title}
            onChange={e => setNewJob({ ...newJob, title: e.target.value })}
            style={{ width: '100%', marginBottom: 5 }}
          />
          <input
            placeholder="Company"
            value={newJob.company}
            onChange={e => setNewJob({ ...newJob, company: e.target.value })}
            style={{ width: '100%', marginBottom: 5 }}
          />
          <input
            type="date"
            value={newJob.date}
            onChange={e => setNewJob({ ...newJob, date: e.target.value })}
            style={{ width: '100%', marginBottom: 5 }}
          />
          {errorMsg && <div style={{ color: 'red', marginBottom: 8 }}>{errorMsg}</div>}
          <button onClick={addJob} style={{ width: '100%' }}>Add Job</button>
        </div>

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={applications.map(app => app.id)}
            strategy={verticalListSortingStrategy}
          >
            {/* Active Applications */}
            <h3 className="sidebar-section-header">Interviewing ({groupedApplications.interviewing.length})</h3>
            {groupedApplications.interviewing.map(app => (
              <DraggableJob
                key={app.id}
                id={app.id}
                app={app}
                selectedJobId={selectedJobId}
                onSelect={setSelectedJobId}
                onDelete={deleteJob}
                progress={app.checklist ? calculateProgress(app.checklist) : 0}
                onStatusChange={updateStatus}
              />
            ))}
            
            <h3 className="sidebar-section-header">Applied ({groupedApplications.applied.length})</h3>
            {groupedApplications.applied.map(app => (
              <DraggableJob
                key={app.id}
                id={app.id}
                app={app}
                selectedJobId={selectedJobId}
                onSelect={setSelectedJobId}
                onDelete={deleteJob}
                progress={app.checklist ? calculateProgress(app.checklist) : 0}
                onStatusChange={updateStatus}
              />
            ))}
            
            <h3 className="sidebar-section-header">Not Started ({groupedApplications.notStarted.length})</h3>
            {groupedApplications.notStarted.map(app => (
              <DraggableJob
                key={app.id}
                id={app.id}
                app={app}
                selectedJobId={selectedJobId}
                onSelect={setSelectedJobId}
                onDelete={deleteJob}
                progress={app.checklist ? calculateProgress(app.checklist) : 0}
                onStatusChange={updateStatus}
              />
            ))}

            {/* Completed Applications */}
            <div className="completed-applications">
              <h3 className="sidebar-section-header">Completed</h3>
              <h4>Offers ({groupedApplications.completed.offer.length})</h4>
              {groupedApplications.completed.offer.map(app => (
                <DraggableJob
                  key={app.id}
                  id={app.id}
                  app={app}
                  selectedJobId={selectedJobId}
                  onSelect={setSelectedJobId}
                  onDelete={deleteJob}
                  progress={app.checklist ? calculateProgress(app.checklist) : 0}
                  onStatusChange={updateStatus}
                />
              ))}
              
              <h4>Rejected ({groupedApplications.completed.rejected.length})</h4>
              {groupedApplications.completed.rejected.map(app => (
                <DraggableJob
                  key={app.id}
                  id={app.id}
                  app={app}
                  selectedJobId={selectedJobId}
                  onSelect={setSelectedJobId}
                  onDelete={deleteJob}
                  progress={app.checklist ? calculateProgress(app.checklist) : 0}
                  onStatusChange={updateStatus}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Theme toggle */}
        <button onClick={() => setDarkMode(!darkMode)} style={{ marginTop: 12 }}>
          Toggle {darkMode ? 'Light' : 'Dark'} Mode
        </button>

        {/* Export to spreadsheet */}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={exportToSpreadsheet}
            style={{
              padding: '10px 20px',
              background: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Export to Spreadsheet
          </button>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="main-content">
        <div className="container">
          <h1>
            {selectedApp ? `${selectedApp.company} — ${selectedApp.title}` : 'Job Application Assistant'}
          </h1>

          {selectedApp ? (
            <>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label>Job Title:</label>{' '}
                <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedApp.editing.title ? (
                    <input
                      type="text"
                      value={selectedApp.editTitle ?? selectedApp.title}
                      onChange={e => setApplications(applications.map(a => 
                        a.id === selectedApp.id ? { ...a, editTitle: e.target.value } : a
                      ))}
                      style={{ flexGrow: 1, padding: '4px 8px' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(selectedApp.id, 'title');
                        if (e.key === 'Escape') cancelEdit(selectedApp.id, 'title');
                      }}
                    />
                  ) : (
                    <>
                      <span style={{ flexGrow: 1 }}>{selectedApp.title}</span>
                      <button
                        onClick={() => setApplications(applications.map(a => 
                          a.id === selectedApp.id ? {
                            ...a,
                            editing: { ...a.editing, title: true }
                          } : a
                        ))}
                        style={{
                          padding: '4px 8px',
                          background: '#3498db',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label>Company:</label>{' '}
                <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedApp.editing.company ? (
                    <input
                      type="text"
                      value={selectedApp.editCompany ?? selectedApp.company}
                      onChange={e => setApplications(applications.map(a => 
                        a.id === selectedApp.id ? { ...a, editCompany: e.target.value } : a
                      ))}
                      style={{ flexGrow: 1, padding: '4px 8px' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(selectedApp.id, 'company');
                        if (e.key === 'Escape') cancelEdit(selectedApp.id, 'company');
                      }}
                    />
                  ) : (
                    <>
                      <span style={{ flexGrow: 1 }}>{selectedApp.company}</span>
                      <button
                        onClick={() => setApplications(applications.map(a => 
                          a.id === selectedApp.id ? {
                            ...a,
                            editing: { ...a.editing, company: true }
                          } : a
                        ))}
                        style={{
                          padding: '4px 8px',
                          background: '#3498db',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label>Status:</label>{' '}
                <select
                  value={selectedApp.status}
                  onChange={e => updateStatus(selectedApp.id, e.target.value)}
                >
                  {['Not started', 'Applied', 'Interviewing', 'Offer', 'Rejected'].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={resetCurrent}
                  style={{
                    marginLeft: 12,
                    padding: '6px 10px',
                    background: '#e67e22',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Reset This Application
                </button>
              </div>

              {/* Job Req ID Section */}
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label>Job Req ID:</label>{' '}
                <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedApp.editing.jobReqId ? (
                    <input
                      type="text"
                      value={selectedApp.editJobReqId ?? selectedApp.jobReqId}
                      onChange={e => setApplications(applications.map(a => 
                        a.id === selectedApp.id ? { ...a, editJobReqId: e.target.value } : a
                      ))}
                      style={{ flexGrow: 1, padding: '4px 8px' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(selectedApp.id, 'jobReqId');
                        if (e.key === 'Escape') cancelEdit(selectedApp.id, 'jobReqId');
                      }}
                    />
                  ) : (
                    <>
                      <span style={{ flexGrow: 1 }}>{selectedApp.jobReqId || 'N/A'}</span>
                      <button
                        onClick={() => setApplications(applications.map(a => 
                          a.id === selectedApp.id ? {
                            ...a,
                            editing: { ...a.editing, jobReqId: true }
                          } : a
                        ))}
                        style={{
                          padding: '4px 8px',
                          background: '#3498db',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Job Link Section */}
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label>Job Listing Link:</label>{' '}
                <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedApp.editing.jobLink ? (
                    <input
                      type="text"
                      value={selectedApp.editJobLink ?? selectedApp.jobLink}
                      onChange={e => setApplications(applications.map(a => 
                        a.id === selectedApp.id ? { ...a, editJobLink: e.target.value } : a
                      ))}
                      style={{ flexGrow: 1, padding: '4px 8px' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(selectedApp.id, 'jobLink');
                        if (e.key === 'Escape') cancelEdit(selectedApp.id, 'jobLink');
                      }}
                    />
                  ) : (
                    <>
                      <a 
                        href={selectedApp.jobLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ flexGrow: 1 }}
                      >
                        {selectedApp.jobLink ? new URL(selectedApp.jobLink).hostname : 'N/A'}
                      </a>
                      <button
                        onClick={() => setApplications(applications.map(a => 
                          a.id === selectedApp.id ? {
                            ...a,
                            editing: { ...a.editing, jobLink: true }
                          } : a
                        ))}
                        style={{
                          padding: '4px 8px',
                          background: '#3498db',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>

              <Checklist
                jobId={selectedApp.id}
                checklist={selectedApp.checklist}
                setChecklist={updated => {
                  setApplications(applications.map(a =>
                    a.id === selectedApp.id ? { ...a, checklist: updated } : a
                  ));
                }}
                onProgressUpdate={() => {
                  // Force re-render of the sidebar items
                  setApplications([...applications]);
                }}
              />

              {/* File Attachments */}
              <div style={{ marginBottom: 16, marginTop: 24 }}>
                <label>Cover Letter:</label>{' '}
                {selectedApp.coverLetter ? (
                  <a
                    href={selectedApp.coverLetter}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Cover Letter
                  </a>
                ) : (
                  <span>No file uploaded</span>
                )}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const fileURL = URL.createObjectURL(file);
                      setApplications(applications.map(a =>
                        a.id === selectedApp.id ? { ...a, coverLetter: fileURL } : a
                      ));
                    }
                  }}
                  style={{ display: 'block', marginTop: 8 }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label>Resume:</label>{' '}
                {selectedApp.resume ? (
                  <a
                    href={selectedApp.resume}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Resume
                  </a>
                ) : (
                  <span>No file uploaded</span>
                )}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const fileURL = URL.createObjectURL(file);
                      setApplications(applications.map(a =>
                        a.id === selectedApp.id ? { ...a, resume: fileURL } : a
                      ));
                    }
                  }}
                  style={{ display: 'block', marginTop: 8 }}
                />
              </div>

              {/* Notes Section */}
              <div style={{ marginBottom: 16 }}>
                <label>Notes:</label>
                <textarea
                  value={selectedApp.notes}
                  onChange={e =>
                    setApplications(applications.map(a =>
                      a.id === selectedApp.id ? { ...a, notes: e.target.value } : a
                    ))
                  }
                  placeholder="Add notes about this application..."
                  style={{
                    width: '100%',
                    height: '100px',
                    padding: '8px',
                    fontSize: '0.9rem',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Interview Details Section */}
              <div style={{ marginBottom: 16 }}>
                <h3>Interview Details</h3>
                
                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
                  <div>
                    <label>Interview Date:</label>
                    <input
                      type="date"
                      value={selectedApp.interview?.date || ''}
                      onChange={e => setApplications(applications.map(a =>
                        a.id === selectedApp.id ? {
                          ...a,
                          interview: {
                            ...a.interview || {},
                            date: e.target.value
                          }
                        } : a
                      ))}
                      style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                  </div>

                  <div>
                    <label>Interview Time:</label>
                    <input
                      type="time"
                      value={selectedApp.interview?.time || ''}
                      onChange={e => setApplications(applications.map(a =>
                        a.id === selectedApp.id ? {
                          ...a,
                          interview: {
                            ...a.interview || {},
                            time: e.target.value
                          }
                        } : a
                      ))}
                      style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label>Interview Type:</label>
                  <select
                    value={selectedApp.interview?.locationType || 'remote'}
                    onChange={e => setApplications(applications.map(a =>
                      a.id === selectedApp.id ? {
                        ...a,
                        interview: {
                          ...a.interview || {},
                          locationType: e.target.value,
                          location: {
                            remote: '',
                            inPerson: ''
                          }
                        }
                      } : a
                    ))}
                    style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                  >
                    <option value="remote">Remote</option>
                    <option value="inPerson">In Person</option>
                  </select>
                </div>

                {/* Location Input based on type */}
                <div style={{ marginTop: '16px' }}>
                  {selectedApp.interview?.locationType === 'remote' ? (
                    <div>
                      <label>Meeting Link:</label>
                      <input
                        type="url"
                        placeholder="Paste video conference link (e.g., Zoom, Teams)"
                        value={selectedApp.interview?.location?.remote || ''}
                        onChange={e => setApplications(applications.map(a =>
                          a.id === selectedApp.id ? {
                            ...a,
                            interview: {
                              ...a.interview || {},
                              location: {
                                ...a.interview?.location || {},
                                remote: e.target.value
                              }
                            }
                          } : a
                        ))}
                        style={{ width: '100%', padding: '8px', marginTop: '4px', marginBottom: '8px' }}
                      />
                      {selectedApp.interview?.location?.remote && (
                        <a
                          href={selectedApp.interview.location.remote}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            color: '#3498db',
                            textDecoration: 'none',
                            marginTop: '8px'
                          }}
                        >
                          Join Meeting →
                        </a>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label>Office Address:</label>
                      <input
                        type="text"
                        placeholder="Enter interview location address"
                        value={selectedApp.interview?.location?.inPerson || ''}
                        onChange={e => setApplications(applications.map(a =>
                          a.id === selectedApp.id ? {
                            ...a,
                            interview: {
                              ...a.interview || {},
                              location: {
                                ...a.interview?.location || {},
                                inPerson: e.target.value
                              }
                            }
                          } : a
                        ))}
                        style={{ width: '100%', padding: '8px', marginTop: '4px', marginBottom: '8px' }}
                      />
                      {selectedApp.interview?.location?.inPerson && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedApp.interview.location.inPerson)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            color: '#3498db',
                            textDecoration: 'none',
                            marginTop: '8px'
                          }}
                        >
                          Open in Google Maps →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Interview Actions */}
              <div className="interview-actions">
                <button 
                  onClick={() => generateInterviewICS(selectedApp)}
                  disabled={!selectedApp.interview?.date || !selectedApp.interview?.time}
                  className="calendar-export-btn"
                >
                  Add to Calendar
                </button>
              </div>
            </>
          ) : (
            <p>Select a job application to begin.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
