import React, { useLayoutEffect, useRef } from 'react'

// Finds the nearest scrollable ancestor (e.g. the detail panel's overflow-y-auto
// wrapper) so we can preserve its scroll position across a resize.
function getScrollParent(node) {
  let parent = node?.parentElement
  while (parent) {
    const { overflowY } = window.getComputedStyle(parent)
    if (/(auto|scroll)/.test(overflowY) && parent.scrollHeight > parent.clientHeight) {
      return parent
    }
    parent = parent.parentElement
  }
  return document.scrollingElement || document.documentElement
}

// A textarea that expands as you type instead of scrolling inside a fixed box.
// Resizes on every value change (including external changes, e.g. loading a
// different application) and on window resize, since wrapping can shift height.
export default function AutoGrowTextarea({ value, minRows = 3, className = '', style, ...rest }) {
  const ref = useRef(null)

  const resize = () => {
    const el = ref.current
    if (!el) return

    // Collapsing then re-growing the element while it's focused can make the
    // browser auto-scroll its container to "keep the focused element in view" —
    // that's the jump. Snapshot and restore scroll position around the resize
    // so there's nothing visible for the browser to react to.
    const scrollParent = getScrollParent(el)
    const prevScrollTop = scrollParent.scrollTop
    const prevWindowScrollY = window.scrollY

    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`

    scrollParent.scrollTop = prevScrollTop
    window.scrollTo(window.scrollX, prevWindowScrollY)
  }

  useLayoutEffect(() => {
    resize()
  }, [value])

  useLayoutEffect(() => {
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <textarea
      ref={ref}
      value={value}
      rows={minRows}
      className={`${className} resize-none overflow-hidden`}
      style={style}
      {...rest}
    />
  )
}
