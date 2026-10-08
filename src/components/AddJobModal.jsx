import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const today = () => new Date().toISOString().split('T')[0]

export default function AddJobModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({ title: '', company: '', date: today() })
  const [error, setError] = useState('')

  const reset = () => {
    setForm({ title: '', company: '', date: today() })
    setError('')
  }

  const handleSubmit = () => {
    if (!form.title || !form.company || !form.date) {
      setError('Fill in the job title, company, and date.')
      return
    }
    onSubmit(form)
    reset()
    onClose()
  }

  const handleClose = () => {
    reset()
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
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50 rounded-xl border p-5 shadow-panel"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">New Application</h3>
              <button onClick={handleClose} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Job Title
                </label>
                <input
                  autoFocus
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full mt-1 px-2.5 py-1.5 rounded-md border text-sm bg-transparent"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Company
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full mt-1 px-2.5 py-1.5 rounded-md border text-sm bg-transparent"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Date Applied
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full mt-1 px-2.5 py-1.5 rounded-md border text-sm bg-transparent"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              {error && <p className="text-xs text-signal-red">{error}</p>}

              <button
                onClick={handleSubmit}
                className="w-full mt-1 py-2 rounded-md bg-signal-amber text-ink-950 font-medium text-sm hover:brightness-110"
              >
                Add Application
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
