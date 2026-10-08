import React, { useEffect, useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import Board from './components/Board.jsx'
import DetailPanel from './components/DetailPanel.jsx'
import AddJobModal from './components/AddJobModal.jsx'
import JobSearchModal from './components/JobSearchModal.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import { defaultChecklist, calculateProgress } from './lib/checklist.js'
import {
  loadApplications,
  saveApplications,
  exportToJSON,
  importFromJSON,
  exportToSpreadsheet,
} from './lib/storage.js'
import { useServerSync } from './lib/sync.js'

function seedApplication(fields) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    title: fields.title,
    company: fields.company,
    date: fields.date,
    status: 'Not started',
    jobReqId: '',
    salaryRange: '',
    jobLink: fields.jobLink || '',
    links: [],
    notes: '',
    coverLetter: null,
    resume: null,
    checklist: defaultChecklist(),
    interviewRounds: [],
  }
}

export default function App() {
  const prefersDark = () =>
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : prefersDark()
  })

  const [applications, setApplications] = useState(() => {
    const saved = loadApplications()
    return saved.length > 0
      ? saved
      : [
          seedApplication({
            title: 'Example Job Title',
            company: 'Example Company',
            date: new Date().toISOString().split('T')[0],
          }),
        ]
  })

  const [selectedJobId, setSelectedJobId] = useState(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [confirm, setConfirm] = useState(null) // { title, description, onConfirm, danger, confirmLabel }

  useEffect(() => {
    document.documentElement.classList.toggle('light', !darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    saveApplications(applications)
  }, [applications])

  // Optional: keeps this device's board in sync with a shared backend, if one
  // is running (see server/ + docker-compose.yml). Falls back to local-only
  // behavior automatically when no server is reachable.
  const syncStatus = useServerSync(applications, setApplications)

  // Applications enriched with computed progress, used everywhere downstream.
  const enriched = useMemo(
    () => applications.map((a) => ({ ...a, progress: calculateProgress(a.checklist) })),
    [applications]
  )

  const stats = useMemo(() => {
    const total = applications.length
    const active = applications.filter((a) => a.status !== 'Rejected').length
    const interviewing = applications.filter((a) => a.status === 'Interviewing').length
    const offers = applications.filter((a) => a.status === 'Offer').length
    const responded = applications.filter((a) => a.status !== 'Not started' && a.status !== 'Applied').length
    const appliedOrFurther = applications.filter((a) => a.status !== 'Not started').length
    const responseRate = appliedOrFurther === 0 ? 0 : Math.round((responded / appliedOrFurther) * 100)
    return { total, active, interviewing, offers, responseRate }
  }, [applications])

  const addJob = (fields) => {
    const app = seedApplication(fields)
    setApplications((prev) => [...prev, app])
    setSelectedJobId(app.id)
  }

  const updateJob = (id, patch) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  const requestDelete = (id) => {
    setConfirm({
      title: 'Delete this application?',
      description: 'This removes it permanently from your tracker.',
      danger: true,
      confirmLabel: 'Delete',
      onConfirm: () => {
        setApplications((prev) => prev.filter((a) => a.id !== id))
        if (selectedJobId === id) setSelectedJobId(null)
        setConfirm(null)
      },
    })
  }

  const requestReset = (id) => {
    setConfirm({
      title: 'Reset this application?',
      description: 'This clears the checklist, status, files, and notes back to defaults.',
      danger: false,
      confirmLabel: 'Reset',
      onConfirm: () => {
        setApplications((prev) =>
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  checklist: defaultChecklist(),
                  status: 'Not started',
                  jobReqId: '',
                  jobLink: '',
                  coverLetter: null,
                  resume: null,
                  notes: '',
                }
              : a
          )
        )
        setConfirm(null)
      },
    })
  }

  const handleImportJSON = async (file) => {
    try {
      const imported = await importFromJSON(file)
      setApplications(imported)
    } catch (err) {
      alert(err.message)
    }
  }

  const selectedApp = enriched.find((a) => a.id === selectedJobId) || null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Header
        stats={stats}
        darkMode={darkMode}
        syncStatus={syncStatus}
        onToggleTheme={() => setDarkMode((d) => !d)}
        onAddJob={() => setAddModalOpen(true)}
        onSearchJobs={() => setSearchModalOpen(true)}
        onExportJSON={() => exportToJSON(applications)}
        onImportJSON={handleImportJSON}
        onExportXLSX={() => exportToSpreadsheet(enriched)}
      />

      <main className="flex-1 px-6 py-5">
        <Board
          applications={enriched}
          setApplications={(updater) =>
            setApplications((prev) => (typeof updater === 'function' ? updater(prev) : updater))
          }
          selectedJobId={selectedJobId}
          onSelect={setSelectedJobId}
          onDelete={requestDelete}
        />
      </main>

      <DetailPanel
        app={selectedApp}
        onClose={() => setSelectedJobId(null)}
        onUpdate={updateJob}
        onReset={requestReset}
      />

      <AddJobModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onSubmit={addJob} />

      <JobSearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onAdd={addJob}
      />

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
