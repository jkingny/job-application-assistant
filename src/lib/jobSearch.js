// Thin client for Remotive's free, no-key, browser-callable public API.
// Docs: https://github.com/remotive-com/remote-jobs-api
//
// Honest limitation: Remotive only indexes *remote* listings. There is no
// free, CORS-friendly, key-less API that covers general/local postings the
// way Indeed or LinkedIn do — those require paid partner access and a
// backend to hold the credentials, which this static site doesn't have.
const BASE_URL = 'https://remotive.com/api/remote-jobs'

export async function searchRemoteJobs({ query = '', category = '', limit = 20 } = {}) {
  const params = new URLSearchParams()
  if (query) params.set('search', query)
  if (category) params.set('category', category)
  params.set('limit', String(limit))

  const res = await fetch(`${BASE_URL}?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Remotive API returned ${res.status}`)
  }
  const data = await res.json()
  return data.jobs || []
}

// A short, commonly-used subset of Remotive's categories to keep the filter
// dropdown from being overwhelming. Leaving it empty searches all categories.
export const REMOTIVE_CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'software-dev', label: 'Software Development' },
  { value: 'customer-support', label: 'Customer Support' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales-business', label: 'Sales / Business' },
  { value: 'product', label: 'Product' },
  { value: 'project-management', label: 'Project Management' },
  { value: 'data-analysis', label: 'Data Analysis' },
  { value: 'devops-sysadmin', label: 'DevOps / SysAdmin' },
  { value: 'hr', label: 'HR' },
  { value: 'finance-legal', label: 'Finance / Legal' },
  { value: 'writing', label: 'Writing' },
  { value: 'all-others', label: 'All Others' },
]
