import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-[70] rounded-xl border p-5 shadow-panel"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <h3 className="font-display font-semibold mb-1.5">{title}</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              {description}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={onCancel}
                className="px-3 py-1.5 rounded-md border text-sm hover:bg-[var(--surface-2)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`px-3 py-1.5 rounded-md text-sm font-medium text-ink-950 hover:brightness-110 ${
                  danger ? 'bg-signal-red' : 'bg-signal-amber'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
