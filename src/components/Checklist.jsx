import React from 'react'
import { Check } from 'lucide-react'

export default function Checklist({ checklist, onChange }) {
  const toggleTask = (groupKey, taskId) => {
    const updated = {
      ...checklist,
      [groupKey]: {
        ...checklist[groupKey],
        tasks: checklist[groupKey].tasks.map((t) =>
          t.id === taskId ? { ...t, done: !t.done } : t
        ),
      },
    }
    onChange(updated)
  }

  return (
    <div className="space-y-5">
      {Object.entries(checklist).map(([groupKey, group]) => (
        <div key={groupKey}>
          <h4
            className="text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            {group.label}
          </h4>
          <div className="space-y-1.5">
            {group.tasks.map((task) => (
              <label
                key={task.id}
                className="flex items-center gap-2.5 py-1 cursor-pointer group"
              >
                <span
                  className={`shrink-0 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors
                    ${task.done ? 'bg-signal-teal border-signal-teal' : 'group-hover:border-ink-400'}`}
                  style={{ borderColor: task.done ? undefined : 'var(--border)' }}
                >
                  {task.done && <Check size={11} strokeWidth={3} className="text-ink-950" />}
                </span>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(groupKey, task.id)}
                  className="sr-only"
                />
                <span
                  className={`text-sm ${task.done ? 'line-through' : ''}`}
                  style={{ color: task.done ? 'var(--text-muted)' : 'var(--text)' }}
                >
                  {task.text}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
