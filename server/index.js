import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Data persists to disk here. In Docker this is mounted as a volume so it
// survives container restarts/rebuilds — see docker-compose.yml (DATA_DIR).
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data')
const DATA_FILE = path.join(DATA_DIR, 'db.json')
const PORT = process.env.PORT || 4000

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ applications: [], updatedAt: 0 }, null, 2))
}

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  } catch {
    return { applications: [], updatedAt: 0 }
  }
}

function writeDb(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

const app = express()
app.use(cors())
// Resumes/cover letters are stored as base64, so the whole-board blob can get large.
app.use(express.json({ limit: '50mb' }))

app.get('/api/applications', (req, res) => {
  res.json(readDb())
})

app.put('/api/applications', (req, res) => {
  const { applications } = req.body || {}
  if (!Array.isArray(applications)) {
    return res.status(400).json({ error: 'applications must be an array' })
  }
  const data = { applications, updatedAt: Date.now() }
  writeDb(data)
  res.json(data)
})

// Serve the built frontend too, so a single process/container handles both
// the UI and the API — simplest possible deployment on a home server.
const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Dossier server listening on port ${PORT}`)
  console.log(`Data file: ${DATA_FILE}`)
})
