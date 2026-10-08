import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

export const STORAGE_KEY = 'jobApplications'

export function loadApplications() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function saveApplications(applications) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications))
}

export function exportToJSON(applications) {
  const dataStr = JSON.stringify(applications, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  saveAs(blob, `job-applications-${new Date().toISOString().split('T')[0]}.json`)
}

export function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        if (!Array.isArray(parsed)) throw new Error('Not an array')
        resolve(parsed)
      } catch {
        reject(new Error('That file doesn\u2019t look like a valid backup.'))
      }
    }
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.readAsText(file)
  })
}

export async function exportToSpreadsheet(applications) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Job Applications')

  sheet.columns = [
    { header: 'Job Title', key: 'title', width: 24 },
    { header: 'Company', key: 'company', width: 22 },
    { header: 'Date Applied', key: 'date', width: 14 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Progress', key: 'progress', width: 10 },
    { header: 'Job Req ID', key: 'jobReqId', width: 16 },
    { header: 'Salary Range', key: 'salaryRange', width: 18 },
    { header: 'Job Link', key: 'jobLink', width: 34 },
    { header: 'Has Cover Letter', key: 'coverLetter', width: 16 },
    { header: 'Has Resume', key: 'resume', width: 14 },
  ]
  sheet.getRow(1).font = { bold: true }

  applications.forEach((app) => {
    sheet.addRow({
      title: app.title,
      company: app.company,
      date: app.date,
      status: app.status,
      progress: `${app.progress ?? 0}%`,
      jobReqId: app.jobReqId || 'N/A',
      salaryRange: app.salaryRange || 'N/A',
      jobLink: app.jobLink || 'N/A',
      coverLetter: app.coverLetter ? 'Yes' : 'No',
      resume: app.resume ? 'Yes' : 'No',
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, `job-applications-${new Date().toISOString().split('T')[0]}.xlsx`)
}

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
