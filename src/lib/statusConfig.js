// Single source of truth for pipeline stages.
// Add/remove/reorder stages here and the whole app (board columns,
// tags, stats, exports) picks it up.
export const STATUSES = [
  { id: 'Not started', label: 'Not Started', color: '#8B92A3', live: false },
  { id: 'Applied', label: 'Applied', color: '#5B8DEF', live: false },
  { id: 'Interviewing', label: 'Interviewing', color: '#E8A33D', live: true },
  { id: 'Offer', label: 'Offer', color: '#4FD1C5', live: false },
  { id: 'Rejected', label: 'Rejected', color: '#E8615D', live: false },
]

export const STATUS_IDS = STATUSES.map((s) => s.id)

export function statusConfig(id) {
  return STATUSES.find((s) => s.id === id) || STATUSES[0]
}
