import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver'; // Required to save the file in the browser
import { motion } from 'framer-motion';
import Checklist, { defaultGroupedChecklist } from './components/Checklist';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DraggableJob from './components/DraggableJob';
import './index.css';

const STORAGE_KEY = 'jobApplications';

const sidebarVariants = {
  hidden: { x: '-100%' },
  visible: { x: 0, transition: { duration: 0.5, ease: 'easeOut' } }
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
      coverLetter: null,  // Will now store {url, name} object when file is uploaded
      resume: null,       // Will now store {url, name} object when file is uploaded
      notes: '',
      interview: {
        locationType: 'remote',
        location: {
          remote: '',
          inPerson: ''
        }
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

  const saveEdit = id => {
    setApplications(applications.map(app => {
      if (app.id === id) {
        return {
          ...app,
          title: app.editTitle !== undefined ? app.editTitle : app.title,
          company: app.editCompany !== undefined ? app.editCompany : app.company,
          jobReqId: app.editJobReqId !== undefined ? app.editJobReqId : app.jobReqId,
          jobLink: app.editJobLink !== undefined ? app.editJobLink : app.jobLink,
          editTitle: undefined,
          editCompany: undefined,
          editJobReqId: undefined,
          editJobLink: undefined,
          editing: false
        };
      }
      return app;
    }));
  };

  const cancelEdit = id => {
    setApplications(applications.map(app => {
      if (app.id === id) {
        return {
          ...app,
          editTitle: undefined,
          editCompany: undefined,
          editJobReqId: undefined,
          editJobLink: undefined,
          editing: false
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
        coverLetter: app.coverLetter ? app.coverLetter.name : 'No file uploaded',
        resume: app.resume ? app.resume.name : 'No file uploaded'
      });
    });

    // Generate the Excel file and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'JobApplications.xlsx');
  };

  const selectedApp = applications.find(a => a.id === selectedJobId);

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
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {applications.map(app => {
                const totalTasks = app.checklist.reduce((sum, group) => sum + group.tasks.length, 0);
                const completedTasks = app.checklist.reduce((sum, group) => sum + group.tasks.filter(task => task.done).length, 0);
                const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                return (
                  <DraggableJob
                    key={app.id}
                    id={app.id}
                    app={app}
                    selectedJobId={selectedJobId}
                    onSelect={setSelectedJobId}
                    onDelete={deleteJob}
                    progress={progress}
                    onStatusChange={updateStatus}
                  />
                );
              })}
            </ul>
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

              <div style={{ marginBottom: 16 }}>
                <label>Job Req ID:</label>{' '}
                {selectedApp.editing ? (
                  <input
                    type="text"
                    value={selectedApp.editJobReqId ?? selectedApp.jobReqId}
                    onChange={e => setApplications(applications.map(a => a.id === selectedApp.id ? { ...a, editJobReqId: e.target.value } : a))}
                    style={{ width: '100%', marginBottom: 5 }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit(selectedApp.id);
                      if (e.key === 'Escape') cancelEdit(selectedApp.id);
                    }}
                  />
                ) : (
                  <span onDoubleClick={() => setApplications(applications.map(a => a.id === selectedApp.id ? { ...a, editing: true } : a))}>
                    {selectedApp.jobReqId || 'N/A'}
                  </span>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label>Job Listing Link:</label>{' '}
                {selectedApp.editing ? (
                  <input
                    type="text"
                    value={selectedApp.editJobLink ?? selectedApp.jobLink}
                    onChange={e => setApplications(applications.map(a => 
                      a.id === selectedApp.id ? { ...a, editJobLink: e.target.value } : a
                    ))}
                    style={{ width: '100%', marginBottom: 5 }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit(selectedApp.id);
                      if (e.key === 'Escape') cancelEdit(selectedApp.id);
                    }}
                  />
                ) : (
                  <a
                    href={selectedApp.jobLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onDoubleClick={() => setApplications(applications.map(a => 
                      a.id === selectedApp.id ? { ...a, editing: true } : a
                    ))}
                  >
                    {selectedApp.jobLink ? new URL(selectedApp.jobLink).hostname : 'N/A'}
                  </a>
                )}
              </div>

              <Checklist
                jobId={selectedApp.id}
                checklist={selectedApp.checklist}
                setChecklist={updated => {
                  setApplications(applications.map(a =>
                    a.id === selectedApp.id ? { ...a, checklist: updated } : a
                  ));
                }}
                onProgressUpdate={() => {}}
              />

              {/* File Attachments */}
              {/* Cover Letter Section */}
              <div style={{ marginBottom: 16, marginTop: 24 }}>
                <label>Cover Letter:</label>{' '}
                {selectedApp.coverLetter ? (
                  <a
                    href={selectedApp.coverLetter.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {selectedApp.coverLetter.name}
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
                        a.id === selectedApp.id ? {
                          ...a,
                          coverLetter: {
                            url: fileURL,
                            name: file.name
                          }
                        } : a
                      ));
                    }
                  }}
                  style={{ display: 'block', marginTop: 8 }}
                />
              </div>

              {/* Resume Section */}
              <div style={{ marginBottom: 16 }}>
                <label>Resume:</label>{' '}
                {selectedApp.resume ? (
                  <a
                    href={selectedApp.resume.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {selectedApp.resume.name}
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
                        a.id === selectedApp.id ? {
                          ...a,
                          resume: {
                            url: fileURL,
                            name: file.name
                          }
                        } : a
                      ));
                    }
                  }}
                  style={{ display: 'block', marginTop: 8 }}
                />
              </div>

              {/* Interview Location Section */}
              <div style={{ marginBottom: 16 }}>
                <h3>Interview Details</h3>
                
                <div style={{ marginBottom: 12 }}>
                  <label>Interview Type:</label>{' '}
                  <select
                    value={selectedApp.interview?.locationType || 'remote'}
                    onChange={e => setApplications(applications.map(a =>
                      a.id === selectedApp.id
                        ? {
                            ...a,
                            interview: {
                              ...a.interview,
                              locationType: e.target.value,
                              location: {
                                remote: '',
                                inPerson: ''
                              }
                            }
                          }
                        : a
                    ))}
                    style={{ marginLeft: 8, padding: '4px 8px' }}
                  >
                    <option value="remote">Remote</option>
                    <option value="inPerson">In Person</option>
                  </select>
                </div>

                {selectedApp.interview?.locationType === 'remote' ? (
                  <div>
                    <label>Meeting Link:</label>
                    <input
                      type="url"
                      placeholder="Paste video conference link (e.g., Zoom, Teams, etc.)"
                      value={selectedApp.interview?.location?.remote || ''}
                      onChange={e => setApplications(applications.map(a =>
                        a.id === selectedApp.id
                          ? {
                              ...a,
                              interview: {
                                ...a.interview,
                                location: {
                                  ...a.interview.location,
                                  remote: e.target.value
                                }
                              }
                            }
                          : a
                      ))}
                      style={{ 
                        width: '100%', 
                        padding: '8px',
                        marginTop: 4,
                        marginBottom: 8,
                        borderRadius: 4,
                        border: '1px solid #ccc'
                      }}
                    />
                    {selectedApp.interview?.location?.remote && (
                      <a
                        href={selectedApp.interview.location.remote}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="interview-link"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: '#3498db',
                          textDecoration: 'none',
                          marginTop: 4
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
                        a.id === selectedApp.id
                          ? {
                              ...a,
                              interview: {
                                ...a.interview,
                                location: {
                                  ...a.interview.location,
                                  inPerson: e.target.value
                                }
                              }
                            }
                          : a
                      ))}
                      style={{ 
                        width: '100%', 
                        padding: '8px',
                        marginTop: 4,
                        marginBottom: 8,
                        borderRadius: 4,
                        border: '1px solid #ccc'
                      }}
                    />
                    {selectedApp.interview?.location?.inPerson && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedApp.interview.location.inPerson)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="interview-link"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: '#3498db',
                          textDecoration: 'none',
                          marginTop: 4
                        }}
                      >
                        Open in Google Maps →
                      </a>
                    )}
                  </div>
                )}
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
