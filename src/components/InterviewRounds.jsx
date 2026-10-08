import React from 'react'
import { Plus, Trash2, CalendarPlus, ExternalLink, MapPin, Linkedin } from 'lucide-react'
import { generateInterviewICS } from '../lib/calendarExport.js'
import AutoGrowTextarea from './AutoGrowTextarea.jsx'

const inputClass =
  'w-full px-2.5 py-1.5 rounded-md border text-sm bg-transparent mt-1'

function emptyInterviewer() {
  return { name: '', contact: '', linkedinUrl: '' }
}

function emptyRound() {
  return {
    date: '',
    time: '',
    locationType: 'remote',
    location: { remote: '', inPerson: '' },
    interviewers: [emptyInterviewer()],
    notes: '',
  }
}

// Older saved rounds only had a single interviewerName/interviewerContact/linkedinUrl.
// Normalize those into the interviewers array so existing data keeps working.
function getInterviewers(round) {
  if (round.interviewers && round.interviewers.length > 0) return round.interviewers
  if (round.interviewerName || round.interviewerContact || round.linkedinUrl) {
    return [
      {
        name: round.interviewerName || '',
        contact: round.interviewerContact || '',
        linkedinUrl: round.linkedinUrl || '',
      },
    ]
  }
  return [emptyInterviewer()]
}

export default function InterviewRounds({ app, rounds, onChange }) {
  const updateRound = (idx, patch) => {
    onChange(rounds.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const addRound = () => onChange([...(rounds || []), emptyRound()])
  const deleteRound = (idx) => onChange(rounds.filter((_, i) => i !== idx))

  const updateInterviewer = (roundIdx, interviewerIdx, patch) => {
    const round = rounds[roundIdx]
    const interviewers = getInterviewers(round).map((iv, i) =>
      i === interviewerIdx ? { ...iv, ...patch } : iv
    )
    updateRound(roundIdx, { interviewers })
  }

  const addInterviewer = (roundIdx) => {
    const round = rounds[roundIdx]
    updateRound(roundIdx, { interviewers: [...getInterviewers(round), emptyInterviewer()] })
  }

  const removeInterviewer = (roundIdx, interviewerIdx) => {
    const round = rounds[roundIdx]
    const interviewers = getInterviewers(round).filter((_, i) => i !== interviewerIdx)
    updateRound(roundIdx, { interviewers: interviewers.length > 0 ? interviewers : [emptyInterviewer()] })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Interview Rounds
        </h4>
        <button
          onClick={addRound}
          className="flex items-center gap-1 text-xs font-medium text-signal-amber hover:brightness-110"
        >
          <Plus size={13} /> Add round
        </button>
      </div>

      <div className="space-y-4">
        {(rounds || []).map((round, idx) => (
          <div
            key={idx}
            className="rounded-lg border p-3.5"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                Round {idx + 1}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateInterviewICS(app, round)}
                  disabled={!round.date || !round.time}
                  title="Add to calendar"
                  className="p-1 rounded text-signal-teal disabled:opacity-30 hover:bg-signal-teal/10"
                >
                  <CalendarPlus size={14} />
                </button>
                <button
                  onClick={() => deleteRound(idx)}
                  className="p-1 rounded text-signal-red hover:bg-signal-red/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={round.date || ''}
                  onChange={(e) => updateRound(idx, { date: e.target.value })}
                  className={inputClass}
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Time
                </label>
                <input
                  type="time"
                  value={round.time || ''}
                  onChange={(e) => updateRound(idx, { time: e.target.value })}
                  className={inputClass}
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Format
              </label>
              <select
                value={round.locationType || 'remote'}
                onChange={(e) => updateRound(idx, { locationType: e.target.value })}
                className={inputClass}
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <option value="remote">Remote</option>
                <option value="inPerson">In Person</option>
              </select>
            </div>

            {round.locationType === 'remote' ? (
              <div className="mt-3">
                <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Meeting Link
                </label>
                <input
                  type="url"
                  placeholder="Zoom / Teams / Meet link"
                  value={round.location?.remote || ''}
                  onChange={(e) =>
                    updateRound(idx, { location: { ...round.location, remote: e.target.value } })
                  }
                  className={inputClass}
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                />
                {round.location?.remote && (
                  <a
                    href={round.location.remote}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs text-signal-blue hover:underline"
                  >
                    Join meeting <ExternalLink size={11} />
                  </a>
                )}
              </div>
            ) : (
              <div className="mt-3">
                <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Interview location"
                  value={round.location?.inPerson || ''}
                  onChange={(e) =>
                    updateRound(idx, { location: { ...round.location, inPerson: e.target.value } })
                  }
                  className={inputClass}
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                />
                {round.location?.inPerson && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      round.location.inPerson
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs text-signal-blue hover:underline"
                  >
                    <MapPin size={11} /> Get directions
                  </a>
                )}
              </div>
            )}

            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Interviewers
                </label>
                <button
                  onClick={() => addInterviewer(idx)}
                  className="flex items-center gap-1 text-[11px] font-medium text-signal-amber hover:brightness-110"
                >
                  <Plus size={12} /> Add interviewer
                </button>
              </div>

              <div className="space-y-2.5">
                {getInterviewers(round).map((interviewer, ivIdx) => (
                  <div
                    key={ivIdx}
                    className="rounded-md border p-2.5"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Name"
                          value={interviewer.name || ''}
                          onChange={(e) => updateInterviewer(idx, ivIdx, { name: e.target.value })}
                          className={inputClass}
                          style={{ borderColor: 'var(--border)', color: 'var(--text)', marginTop: 0 }}
                        />
                        <input
                          type="text"
                          placeholder="Contact (email/phone)"
                          value={interviewer.contact || ''}
                          onChange={(e) => updateInterviewer(idx, ivIdx, { contact: e.target.value })}
                          className={inputClass}
                          style={{ borderColor: 'var(--border)', color: 'var(--text)', marginTop: 0 }}
                        />
                      </div>
                      {getInterviewers(round).length > 1 && (
                        <button
                          onClick={() => removeInterviewer(idx, ivIdx)}
                          className="mt-1.5 shrink-0 text-ink-500 hover:text-signal-red"
                          aria-label="Remove interviewer"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      placeholder="LinkedIn profile URL"
                      value={interviewer.linkedinUrl || ''}
                      onChange={(e) => updateInterviewer(idx, ivIdx, { linkedinUrl: e.target.value })}
                      className={inputClass}
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    />
                    {interviewer.linkedinUrl && (
                      <a
                        href={interviewer.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 text-xs text-signal-blue hover:underline"
                      >
                        <Linkedin size={11} /> View profile
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Round Notes
              </label>
              <AutoGrowTextarea
                minRows={3}
                placeholder="Prep notes, questions asked, impressions, follow-ups..."
                value={round.notes || ''}
                onChange={(e) => updateRound(idx, { notes: e.target.value })}
                className={inputClass}
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
          </div>
        ))}

        {(!rounds || rounds.length === 0) && (
          <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
            No interview rounds scheduled yet.
          </p>
        )}
      </div>
    </div>
  )
}
