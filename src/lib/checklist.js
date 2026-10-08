// Default grouped checklist seeded onto every new application.
// Structure: { groupKey: { label, tasks: [{ id, text, done }] } }
let uid = 0
const task = (text) => ({ id: `t${uid++}`, text, done: false })

export function defaultChecklist() {
  uid = 0
  return {
    before: {
      label: 'Before Applying',
      tasks: [
        task('Research the company'),
        task('Tailor resume to the role'),
        task('Write a tailored cover letter'),
        task('Identify a referral or warm contact'),
      ],
    },
    application: {
      label: 'Application',
      tasks: [task('Submit application'), task('Save confirmation email'), task('Follow up in 1–2 weeks if no response')],
    },
    interviewPrep: {
      label: 'Interview Prep',
      tasks: [
        task('Research interviewers'),
        task('Prepare answers to likely questions'),
        task('Prepare questions to ask them'),
        task('Test video call setup / plan commute'),
      ],
    },
    afterInterview: {
      label: 'After the Interview',
      tasks: [task('Send thank-you note'), task('Follow up if no response in a week'), task('Reflect on what to improve')],
    },
  }
}

export function calculateProgress(checklist) {
  if (!checklist) return 0
  let total = 0
  let completed = 0
  Object.values(checklist).forEach((group) => {
    group.tasks.forEach((t) => {
      total++
      if (t.done) completed++
    })
  })
  return total === 0 ? 0 : Math.round((completed / total) * 100)
}
