import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, ExternalLink, Plus, Loader2 } from 'lucide-react'
import { searchRemoteJobs, REMOTIVE_CATEGORIES } from '../lib/jobSearch.js'

function stripHtml(html) {
  const div = document.createElement('div')
  div.innerHTML = html || ''
  return (div.textContent || div.innerText || '').trim()
}

export default function JobSearchModal({ open, onClose, onAdd }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | error | done
  const [addedIds, setAddedIds] = useState(new Set())

  const runSearch = async (e) => {
    e?.preventDefault()
    setStatus('loading')
    try {
      const jobs = await searchRemoteJobs({ query, category, limit: 20 })
      setResults(jobs)
      setStatus('done')
    } catch (err) {
      setStatus('error')
    }
  }

  const handleAdd = (job) => {
    onAdd({
      title: job.title,
      company: job.company_name,
      date: new Date().toISOString().split('T')[0],
      jobLink: job.url,
    })
    setAddedIds((prev) => new Set(prev).add(job.id))
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] z-50 rounded-xl border shadow-panel flex flex-col"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="px-5 pt-5 pb-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-display font-semibold">Search Jobs</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Live listings from Remotive — remote positions only.
                  </p>
                </div>
                <button onClick={handleClose} style={{ color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={runSearch} className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Job title, skill, or keyword..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md border text-sm bg-transparent"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-2 py-2 rounded-md border text-sm bg-transparent"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  {REMOTIVE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-signal-amber text-ink-950 font-medium text-sm hover:brightness-110 disabled:opacity-60"
                >
                  {status === 'loading' ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                  Search
                </button>
              </form>
            </div>

            <div className="overflow-y-auto px-5 py-4 flex-1">
              {status === 'idle' && (
                <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  Search remote job listings and add any of them straight to your board.
                </p>
              )}

              {status === 'error' && (
                <p className="text-sm text-center py-8 text-signal-red">
                  Couldn't reach Remotive right now. Try again in a moment.
                </p>
              )}

              {status === 'done' && results.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  No results for that search. Try a broader keyword.
                </p>
              )}

              <div className="space-y-2.5">
                {results.map((job) => {
                  const added = addedIds.has(job.id)
                  return (
                    <div
                      key={job.id}
                      className="rounded-lg border p-3.5"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                            {job.title}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {job.company_name} · {job.candidate_required_location || 'Remote'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAdd(job)}
                          disabled={added}
                          className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-medium ${
                            added
                              ? 'text-signal-teal border border-signal-teal/40'
                              : 'bg-signal-amber text-ink-950 hover:brightness-110'
                          }`}
                        >
                          {added ? 'Added' : <><Plus size={12} /> Add</>}
                        </button>
                      </div>

                      <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                        {stripHtml(job.description).slice(0, 220)}
                        {stripHtml(job.description).length > 220 ? '…' : ''}
                      </p>

                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-signal-blue hover:underline"
                      >
                        View listing <ExternalLink size={11} />
                      </a>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
