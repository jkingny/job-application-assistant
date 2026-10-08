// Detects an hourly rate written into the free-text salary field (e.g. "$28/hr",
// "$25-30 per hour", "32.50 hourly") and estimates the annual equivalent using
// the standard 2080 working hours per year (40 hrs/week * 52 weeks).
const HOURS_PER_YEAR = 2080

const HOURLY_INDICATOR = /(\/\s*hr\b|\/\s*hour\b|per\s*hour|hourly|\bhr\b|\bph\b)/i

export function parseHourlyAnnualEstimate(text) {
  if (!text) return null
  if (!HOURLY_INDICATOR.test(text)) return null

  const numberMatches = text.match(/\d{1,3}(?:,\d{3})*(?:\.\d+)?/g)
  if (!numberMatches || numberMatches.length === 0) return null

  // Take up to the first two numbers as a min/max range.
  const hourlyValues = numberMatches
    .slice(0, 2)
    .map((n) => parseFloat(n.replace(/,/g, '')))
    .filter((n) => !isNaN(n) && n > 0)

  if (hourlyValues.length === 0) return null

  const annualValues = hourlyValues.map((v) => Math.round(v * HOURS_PER_YEAR)).sort((a, b) => a - b)

  return {
    hourlyValues,
    annualValues,
    formatted: formatAnnualRange(annualValues),
  }
}

function formatAnnualRange(annualValues) {
  const fmt = (n) => `$${n.toLocaleString('en-US')}`
  if (annualValues.length === 1) return `${fmt(annualValues[0])}/yr`
  const [min, max] = annualValues
  if (min === max) return `${fmt(min)}/yr`
  return `${fmt(min)}–${fmt(max)}/yr`
}
