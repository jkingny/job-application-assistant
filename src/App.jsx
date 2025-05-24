import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver'; // Required to save the file in the browser
import { motion } from 'framer-motion';
import Checklist, { defaultGroupedChecklist } from './components/Checklist';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DraggableJob from './components/DraggableJob';
import { generateInterviewICS } from './utils/calendarExport';
import { Editor } from '@tinymce/tinymce-react';
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
    const parsed = saved ? JSON.parse(saved) : [];
    
    // If no applications exist, create an example one
    if (parsed.length === 0) {
      const exampleApp = {
        id: Date.now().toString(),
        title: "Example job title",
        company: "Example company name",
        date: new Date().toISOString().split('T')[0],
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
        },
        jobReqId: '',
        jobLink: '',
        interview: {
          date: '',
          time: '',
          locationType: 'remote',
          location: {
            remote: '',
            inPerson: ''
          }
        },
        interviewRounds: []
      };
      return [exampleApp];
    }
    
    return parsed;
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

  // Load applications from localStorage on app start
  useEffect(() => {
    const savedApplications = localStorage.getItem('applications');
    if (savedApplications) {
      setApplications(JSON.parse(savedApplications));
    }
  }, []);

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
      },
      interviewRounds: []
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

  const exportToJSON = () => {
    const dataStr = JSON.stringify(applications);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = `job-applications-${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFromJSON = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          setApplications(importedData);
        } catch (error) {
          alert('Error importing file. Please make sure it is a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const addInterviewRound = (appId) => {
    setApplications(applications.map(app => 
      app.id === appId ? {
        ...app,
        interviewRounds: [...(app.interviewRounds || []), {
          date: '',
          time: '',
          locationType: 'remote',
          location: { remote: '', inPerson: '' },
          interviewerName: '',
          interviewerContact: ''
        }]
      } : app
    ));
  };

  const deleteInterviewRound = (appId, roundIndex) => {
    setApplications(applications.map(app => 
      app.id === appId ? {
        ...app,
        interviewRounds: app.interviewRounds.filter((_, idx) => idx !== roundIndex)
      } : app
    ));
  };

  // Add functionality to persist file uploads
  const handleFileUpload = (e, appId, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const fileData = reader.result;
      setApplications(applications.map(app =>
        app.id === appId ? {
          ...app,
          [fileType]: fileData
        } : app
      ));

      // Persist the file data to localStorage
      const updatedApplications = applications.map(app =>
        app.id === appId ? {
          ...app,
          [fileType]: fileData
        } : app
      );
      localStorage.setItem('applications', JSON.stringify(updatedApplications));
    };
    reader.readAsDataURL(file);
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

        {/* Backup and Restore */}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={exportToJSON}
            style={{
              padding: '10px 20px',
              background: '#2ecc71',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              marginBottom: 8,
              width: '100%'
            }}
          >
            Backup Applications
          </button>
          
          <input
            type="file"
            accept=".json"
            onChange={importFromJSON}
            style={{ display: 'none' }}
            id="import-json"
          />
          <button
            onClick={() => document.getElementById('import-json').click()}
            style={{
              padding: '10px 20px',
              background: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Restore from Backup
          </button>
        </div>

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

        {/* Export to JSON */}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={exportToJSON}
            style={{
              padding: '10px 20px',
              background: '#2ecc71',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Export to JSON
          </button>
        </div>

        {/* Import from JSON */}
        <div style={{ marginTop: 16 }}>
          <input
            type="file"
            accept=".json"
            onChange={importFromJSON}
            style={{
              padding: '10px 20px',
              background: '#e74c3c',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          />
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
              <div style={{ marginBottom: 16 }}>
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
                  onChange={e => handleFileUpload(e, selectedApp.id, 'coverLetter')}
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
                  onChange={e => handleFileUpload(e, selectedApp.id, 'resume')}
                  style={{ display: 'block', marginTop: 8 }}
                />
              </div>

              {/* Interview Details Section */}
              <div style={{ marginBottom: 16 }}>
                <h3>Interview Details</h3>

                {selectedApp.interviewRounds && selectedApp.interviewRounds.map((round, idx) => (
                  <div key={idx} style={{ marginBottom: '16px' }}>
                    <h4>Interview Round {idx + 1}</h4>

                    <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
                      <div>
                        <label>Interview Date:</label>
                        <input
                          type="date"
                          value={round.date || ''}
                          onChange={e => setApplications(applications.map(a =>
                            a.id === selectedApp.id ? {
                              ...a,
                              interviewRounds: a.interviewRounds.map((r, i) => i === idx ? { ...r, date: e.target.value } : r)
                            } : a
                          ))}
                          style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                        />
                      </div>

                      <div>
                        <label>Interview Time:</label>
                        <input
                          type="time"
                          value={round.time || ''}
                          onChange={e => {
                            const timeValue = e.target.value;
                            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
                            if (timeRegex.test(timeValue)) {
                              setApplications(applications.map(a =>
                                a.id === selectedApp.id ? {
                                  ...a,
                                  interviewRounds: a.interviewRounds.map((r, i) => i === idx ? { ...r, time: timeValue } : r)
                                } : a
                              ));
                            } else {
                              alert('Please enter a valid time in HH:MM format.');
                            }
                          }}
                          style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <label>Interview Type:</label>
                      <select
                        value={round.locationType || 'remote'}
                        onChange={e => setApplications(applications.map(a =>
                          a.id === selectedApp.id ? {
                            ...a,
                            interviewRounds: a.interviewRounds.map((r, i) => i === idx ? { ...r, locationType: e.target.value } : r)
                          } : a
                        ))}
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                      >
                        <option value="remote">Remote</option>
                        <option value="inPerson">In Person</option>
                      </select>
                    </div>

                    {round.locationType === 'remote' ? (
                      <div style={{ marginTop: '16px' }}>
                        <label>Meeting Link:</label>
                        <input
                          type="url"
                          placeholder="Paste video conference link (e.g., Zoom, Teams)"
                          value={round.location?.remote || ''}
                          onChange={e => setApplications(applications.map(a =>
                            a.id === selectedApp.id ? {
                              ...a,
                              interviewRounds: a.interviewRounds.map((r, i) => i === idx ? {
                                ...r,
                                location: { ...r.location, remote: e.target.value }
                              } : r)
                            } : a
                          ))}
                          style={{ width: '100%', padding: '8px', marginTop: '4px', marginBottom: '8px' }}
                        />
                        {round.location?.remote && (
                          <a
                            href={round.location.remote}
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
                      <div style={{ marginTop: '16px' }}>
                        <label>Office Address:</label>
                        <input
                          type="text"
                          placeholder="Enter interview location address"
                          value={round.location?.inPerson || ''}
                          onChange={e => setApplications(applications.map(a =>
                            a.id === selectedApp.id ? {
                              ...a,
                              interviewRounds: a.interviewRounds.map((r, i) => i === idx ? {
                                ...r,
                                location: { ...r.location, inPerson: e.target.value }
                              } : r)
                            } : a
                          ))}
                          style={{ width: '100%', padding: '8px', marginTop: '4px', marginBottom: '8px' }}
                        />
                        {round.location?.inPerson && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(round.location.inPerson)}`}
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

                    <div style={{ marginTop: '16px' }}>
                      <label>Interviewer Name:</label>
                      <input
                        type="text"
                        placeholder="Enter interviewer's name"
                        value={round.interviewerName || ''}
                        onChange={e => setApplications(applications.map(a =>
                          a.id === selectedApp.id ? {
                            ...a,
                            interviewRounds: a.interviewRounds.map((r, i) => i === idx ? { ...r, interviewerName: e.target.value } : r)
                          } : a
                        ))}
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                      />
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <label>Interviewer Contact:</label>
                      <input
                        type="text"
                        placeholder="Enter interviewer's contact information"
                        value={round.interviewerContact || ''}
                        onChange={e => setApplications(applications.map(a =>
                          a.id === selectedApp.id ? {
                            ...a,
                            interviewRounds: a.interviewRounds.map((r, i) => i === idx ? { ...r, interviewerContact: e.target.value } : r)
                          } : a
                        ))}
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                      />
                    </div>

                    <button
                      onClick={() => deleteInterviewRound(selectedApp.id, idx)}
                      style={{
                        marginTop: '12px',
                        padding: '6px 10px',
                        background: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      Delete Round
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addInterviewRound(selectedApp.id)}
                  style={{
                    marginTop: '16px',
                    padding: '10px 20px',
                    background: '#2ecc71',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Add Interview Round
                </button>
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
