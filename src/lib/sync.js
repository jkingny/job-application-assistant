import { useEffect, useRef, useState } from 'react'

// In production this app is served by the same server as the API, so a
// relative path works. Override with VITE_API_BASE for local dev, where the
// Vite dev server and the API server run on different ports.
const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const POLL_INTERVAL_MS = 10000

async function fetchServerState() {
  const res = await fetch(`${API_BASE}/applications`)
  if (!res.ok) throw new Error('Server unreachable')
  return res.json() // { applications, updatedAt }
}

async function pushServerState(applications) {
  const res = await fetch(`${API_BASE}/applications`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applications }),
  })
  if (!res.ok) throw new Error('Sync failed')
  return res.json()
}

function isTypingInField() {
  const el = document.activeElement
  if (!el) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
}

/**
 * Keeps `applications` in sync with an optional backend server so multiple
 * devices pointed at the same server see the same board. Entirely optional —
 * if no server is reachable, this quietly no-ops (retrying in the
 * background) and the app behaves exactly as it did with localStorage alone.
 *
 * Returns a status string for UI display: 'checking' | 'synced' | 'offline' | 'local-only'
 */
export function useServerSync(applications, setApplications) {
  const [status, setStatus] = useState('checking')
  const statusRef = useRef('checking')
  const lastKnownUpdatedAt = useRef(0)
  const pushTimer = useRef(null)
  const skipNextPush = useRef(true) // don't immediately re-push what we just loaded

  const setBoth = (s) => {
    statusRef.current = s
    setStatus(s)
  }

  // Initial load: prefer the server's copy if it has one; otherwise, if this
  // device already has local data and the server is empty, seed the server
  // with it (first device to connect "wins" the initial dataset).
  useEffect(() => {
    let cancelled = false
    fetchServerState()
      .then(({ applications: serverApps, updatedAt }) => {
        if (cancelled) return
        lastKnownUpdatedAt.current = updatedAt || 0
        if (serverApps && serverApps.length > 0) {
          skipNextPush.current = true
          setApplications(serverApps)
        } else if (applications.length > 0) {
          pushServerState(applications)
            .then(({ updatedAt: newUpdatedAt }) => {
              lastKnownUpdatedAt.current = newUpdatedAt
            })
            .catch(() => {})
        }
        setBoth('synced')
      })
      .catch(() => {
        if (!cancelled) setBoth('local-only')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Push local changes to the server, debounced.
  useEffect(() => {
    if (skipNextPush.current) {
      skipNextPush.current = false
      return
    }
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      pushServerState(applications)
        .then(({ updatedAt }) => {
          lastKnownUpdatedAt.current = updatedAt
          setBoth('synced')
        })
        .catch(() => setBoth(statusRef.current === 'checking' ? 'local-only' : 'offline'))
    }, 700)
    return () => clearTimeout(pushTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applications])

  // Poll for changes made from other devices (and to notice a server that
  // wasn't there before, e.g. if it's started up after this page loaded).
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTypingInField()) return // don't yank the board out from under active typing
      fetchServerState()
        .then(({ applications: serverApps, updatedAt }) => {
          if (updatedAt && updatedAt !== lastKnownUpdatedAt.current) {
            lastKnownUpdatedAt.current = updatedAt
            skipNextPush.current = true
            setApplications(serverApps)
          }
          setBoth('synced')
        })
        .catch(() => setBoth(statusRef.current === 'checking' ? 'local-only' : 'offline'))
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return status
}
