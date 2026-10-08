import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RotateCcw, ExternalLink } from 'lucide-react'
import EditableField from './EditableField.jsx'
import Checklist from './Checklist.jsx'
import FileAttachment from './FileAttachment.jsx'
import InterviewRounds from './InterviewRounds.jsx'
import LinksSection from './LinksSection.jsx'
import AutoGrowTextarea from './AutoGrowTextarea.jsx'
import SignalBar from './SignalBar.jsx'
import { STATUSES, statusConfig } from '../lib/statusConfig.js'
import { parseHourlyAnnualEstimate } from '../lib/salary.js'

export default function DetailPanel({ app, onClose, onUpdate, onReset }) {
  if (!app) return null

  const cfg = statusConfig(app.status)
  const patch = (fields) => onUpdate(app.id, fields)

  return (
    <AnimatePresence>
      {app && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg z-50 shadow-panel overflow-y-auto"
            style={{ background: 'var(--bg)', borderLeft: '1px solid var(--border)' }}
          >
            <div
              className="sticky top-0 z-10 px-6 pt-5 pb-4 border-b backdrop-blur"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-mono uppercase tracking-wider" style={{ color: cfg.color }}>
                    {cfg.label}
                  </p>
                  <h2 className="font-display text-lg font-semibold truncate mt-0.5">{app.company}</h2>
                  <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                    {app.title}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4">
                <SignalBar progress={app.progress} color={cfg.color} />
              </div>
            </div>

            <div className="px-6 py-5">
              <EditableField label="Job Title" value={app.title} onSave={(v) => patch({ title: v })} />
              <EditableField label="Company" value={app.company} onSave={(v) => patch({ company: v })} />

              <div className="mb-4">
                <label
                  className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Status
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={app.status}
                    onChange={(e) => patch({ status: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 rounded-md border text-sm bg-transparent"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => onReset(app.id)}
                    title="Reset checklist and status"
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border hover:bg-[var(--surface-2)]"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                </div>
              </div>

              <EditableField label="Date Applied" type="date" value={app.date} onSave={(v) => patch({ date: v })} />
              <EditableField label="Job Req ID" value={app.jobReqId} onSave={(v) => patch({ jobReqId: v })} />
              <EditableField
                label="Salary Range"
                value={app.salaryRange}
                placeholder="Not specified"
                onSave={(v) => patch({ salaryRange: v })}
              />
              {(() => {
                const estimate = parseHourlyAnnualEstimate(app.salaryRange)
                return estimate ? (
                  <p className="-mt-3 mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                    ≈ {estimate.formatted} annually (at 2,080 hrs/year)
                  </p>
                ) : null
              })()}
              <EditableField
                label="Job Listing"
                value={app.jobLink}
                placeholder="No link added"
                onSave={(v) => patch({ jobLink: v })}
                renderValue={(v) =>
                  v ? (
                    <a
                      href={v}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-signal-blue hover:underline"
                    >
                      {safeHostname(v)} <ExternalLink size={12} />
                    </a>
                  ) : (
                    'No link added'
                  )
                }
              />

              <div className="mt-4">
                <LinksSection links={app.links} onChange={(links) => patch({ links })} />
              </div>

              <div className="mb-5">
                <label
                  className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Notes
                </label>
                <AutoGrowTextarea
                  value={app.notes || ''}
                  onChange={(e) => patch({ notes: e.target.value })}
                  placeholder="Anything worth remembering about this one..."
                  minRows={4}
                  className="w-full px-3 py-2 rounded-md border text-sm bg-transparent"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              <div className="my-5 border-t" style={{ borderColor: 'var(--border)' }} />

              <Checklist checklist={app.checklist} onChange={(c) => patch({ checklist: c })} />

              <div className="my-5 border-t" style={{ borderColor: 'var(--border)' }} />

              <FileAttachment label="Resume" value={app.resume} onChange={(v) => patch({ resume: v })} />
              <FileAttachment label="Cover Letter" value={app.coverLetter} onChange={(v) => patch({ coverLetter: v })} />

              <div className="my-5 border-t" style={{ borderColor: 'var(--border)' }} />

              <InterviewRounds
                app={app}
                rounds={app.interviewRounds || []}
                onChange={(rounds) => patch({ interviewRounds: rounds })}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function safeHostname(url) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
