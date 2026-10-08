import React from 'react'

// The signature element: a 10-segment "signal readout" instead of a plain
// progress bar. Filled segments take the stage's color and glow faintly.
export default function SignalBar({ progress = 0, color = '#E8A33D', segments = 10 }) {
  const filledCount = Math.round((progress / 100) * segments)

  return (
    <div className="flex items-center gap-2">
      <div className="signal-bar flex-1" style={{ '--signal-color': color }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} className={`signal-tick ${i < filledCount ? 'filled' : ''}`} />
        ))}
      </div>
      <span className="font-mono text-[11px] text-ink-400 tabular-nums w-8 text-right">
        {progress}%
      </span>
    </div>
  )
}
