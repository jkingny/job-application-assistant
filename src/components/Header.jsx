import React, { useRef } from 'react'
import { Sun, Moon, Plus, Download, Upload, FileSpreadsheet, Search, Cloud, CloudOff, HardDrive } from 'lucide-react'

function Stat({ label, value, color }) {
  return (
    <div
      className="px-3 py-1.5 rounded-lg border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <p className="text-[10px] uppercase tracking-wider font-display" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-lg font-display font-semibold tabular-nums" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

const iconBtn = 'p-2 rounded-lg border transition-colors hover:brightness-110'

const SYNC_META = {
  checking: { icon: Cloud, label: 'Checking for shared server…', color: 'var(--text-muted)' },
  synced: { icon: Cloud, label: 'Synced with shared server', color: '#4FD1C5' },
  offline: { icon: CloudOff, label: "Can't reach shared server — changes saved locally for now", color: '#E8A33D' },
  'local-only': { icon: HardDrive, label: 'No shared server found — this device only', color: 'var(--text-muted)' },
}

function SyncIndicator({ status }) {
  const meta = SYNC_META[status] || SYNC_META['local-only']
  const Icon = meta.icon
  return (
    <div
      title={meta.label}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs"
      style={{ borderColor: 'var(--border)', color: meta.color }}
    >
      <Icon size={14} />
    </div>
  )
}

export default function Header({
  stats,
  darkMode,
  syncStatus,
  onToggleTheme,
  onAddJob,
  onSearchJobs,
  onExportJSON,
  onImportJSON,
  onExportXLSX,
}) {
  const fileInputRef = useRef(null)

  return (
    <header className="border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="px-6 pt-5 pb-4 flex flex-wrap items-center gap-4">
        <div className="mr-auto">
          <h1 className="font-display text-xl font-semibold tracking-tight">Dossier</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Job application tracker
          </p>
        </div>

        <div className="flex gap-2">
          <Stat label="Active" value={stats.active} color="#5B8DEF" />
          <Stat label="Interviewing" value={stats.interviewing} color="#E8A33D" />
          <Stat label="Offers" value={stats.offers} color="#4FD1C5" />
          <Stat label="Response Rate" value={`${stats.responseRate}%`} color="#9B8CFF" />
        </div>

        <div className="flex items-center gap-1.5">
          <SyncIndicator status={syncStatus} />

          <button
            onClick={onToggleTheme}
            title="Toggle theme"
            className={iconBtn}
            style={{ borderColor: 'var(--border)' }}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={onExportXLSX}
            title="Export to spreadsheet"
            className={iconBtn}
            style={{ borderColor: 'var(--border)' }}
          >
            <FileSpreadsheet size={16} />
          </button>

          <button
            onClick={onExportJSON}
            title="Backup to JSON"
            className={iconBtn}
            style={{ borderColor: 'var(--border)' }}
          >
            <Download size={16} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={(e) => {
              if (e.target.files[0]) onImportJSON(e.target.files[0])
              e.target.value = ''
            }}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Restore from JSON"
            className={iconBtn}
            style={{ borderColor: 'var(--border)' }}
          >
            <Upload size={16} />
          </button>

          <button
            onClick={onSearchJobs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border font-medium text-sm hover:bg-[var(--surface-2)] transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <Search size={16} />
            Search Jobs
          </button>

          <button
            onClick={onAddJob}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-signal-amber text-ink-950 font-medium text-sm hover:brightness-110 transition"
          >
            <Plus size={16} />
            Add Application
          </button>
        </div>
      </div>
    </header>
  )
}
