import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Import Framer Motion
import { Editor } from '@tinymce/tinymce-react'; // Import TinyMCE Editor

/* Export so App.jsx can reset an application */
export const defaultGroupedChecklist = [
  {
    stage: "Before Writing",
    tasks: [
      { text: "Research the company’s mission, values, and recent news using online sources (e.g., company website, news aggregators, or ChatGPT)", done: false },
      { text: "Review the job description and extract key responsibilities and required qualifications", done: false },
      { text: "Identify how your experience aligns with the role’s expectations (tools like ChatGPT or Notion AI can help you think this through)", done: false },
      { text: "Determine a target salary range based on platforms like Glassdoor, Levels.fyi, or Payscale", done: false }
    ],

  },
  {
    stage: "Writing & Customization",
    tasks: [
      { text: "Refine your resume to align with the job posting (consider using Rezi, Teal, or Resume Worded for suggestions)", done: false },
      { text: "Run your resume through an ATS optimization tool such as Jobscan or Resumeworded", done: false },
      { text: "Draft or enhance a tailored cover letter (assistive tools like Grammarly, ChatGPT, or Jasper can be useful)", done: false },
      { text: "Ensure your LinkedIn profile is up to date and reflects key career milestones", done: false },
      { text: "Update any portfolio, website, or project links you're planning to include", done: false }
    ],
  },
  {
    stage: "Final Review & Submission",
    tasks: [
      { text: "Proofread all application materials—manual review and tools like Grammarly or Hemingway can help spot issues", done: false },
      { text: "Export your resume and cover letter as PDFs with clear, professional filenames (e.g., JohnDoe_Resume_SystemsEngineer.pdf)", done: false },
      { text: "Verify the application deadline and the correct submission method (e.g., company portal, recruiter, LinkedIn)", done: false },
      { text: "Double-check all required documents are included and up to date", done: false },
      { text: "Set a reminder to follow up one week after submitting the application", done: false }
    ],
    notes: ""
  }
];

function Checklist({ checklist, setChecklist, onProgressUpdate }) {
  const [newTasks, setNewTasks]   = useState({});
  const [editing,  setEditing]    = useState({ groupIdx: null, taskIdx: null });
  const [editText, setEditText]   = useState('');
  const [darkMode, setDarkMode]  = useState(false); // Example state for dark mode

  /* initialise */
  useEffect(() => {
    if (!checklist || checklist.length === 0) {
      setChecklist(JSON.parse(JSON.stringify(defaultGroupedChecklist)));
    }
  }, [checklist, setChecklist]);

  /* progress */
  useEffect(() => {
    const total     = checklist.reduce((s,g)=>s+g.tasks.length,0);
    const completed = checklist.reduce((s,g)=>s+g.tasks.filter(t=>t.done).length,0);
    onProgressUpdate(total ? Math.round((completed/total)*100) : 0);
  }, [checklist,onProgressUpdate]);

  /* handlers */
  const toggleTask = (g,t) => {
    const copy = [...checklist];
    copy[g].tasks[t].done = !copy[g].tasks[t].done;
    setChecklist(copy);
  };

  const addTask = (g) => {
    const text = (newTasks[g]||'').trim();
    if (!text) return;
    const copy = [...checklist];
    copy[g].tasks.push({ text, done:false });
    setChecklist(copy);
    setNewTasks({ ...newTasks, [g]:'' });
  };

  const removeTask = (g,t) => {
    if (!window.confirm('Remove this checklist item?')) return;
    const copy=[...checklist];
    copy[g].tasks.splice(t,1);
    setChecklist(copy);
  };

  const startEdit = (g,t) => {
    setEditing({ groupIdx:g, taskIdx:t });
    setEditText(checklist[g].tasks[t].text);
  };

  const saveEdit = (g,t) => {
    const copy=[...checklist];
    copy[g].tasks[t].text = editText.trim();
    setChecklist(copy);
    setEditing({groupIdx:null,taskIdx:null});
  };

  /* Animation Variants */
  const taskVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  /* ─────────────────── render ─────────────────── */
  return (
    <div className="checklist">
      {/* Checklist groups */}
      {checklist.map((group,gIdx)=>(
        <div key={group.stage}>
          <h3>{group.stage}</h3>

          <ul style={{ paddingLeft:0 }}>
            <AnimatePresence>
              {group.tasks.map((task,tIdx)=>(
                <motion.li
                  key={tIdx}
                  style={{ display:'flex', alignItems:'center', marginBottom:6 }}
                  variants={taskVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <label style={{ flexGrow:1 }}>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={()=>toggleTask(gIdx,tIdx)}
                    />
                    {editing.groupIdx===gIdx && editing.taskIdx===tIdx ? (
                      <input
                        value={editText}
                        autoFocus
                        style={{ width:'90%', outline:'none' }}
                        onChange={e=>setEditText(e.target.value)}
                        onBlur={()=>saveEdit(gIdx,tIdx)}
                        onKeyDown={e=>{
                          if(e.key==='Enter') saveEdit(gIdx,tIdx);
                          if(e.key==='Escape') setEditing({groupIdx:null,taskIdx:null});
                        }}
                      />
                    ) : (
                      <span
                        className={task.done?'done':''}
                        onDoubleClick={()=>startEdit(gIdx,tIdx)}
                      >
                        {task.text}
                      </span>
                    )}
                  </label>
                  <button
                    onClick={()=>removeTask(gIdx,tIdx)}
                    style={{ background:'none', border:'none', color:'red', cursor:'pointer' }}
                  >×</button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <div style={{ marginBottom:24 }}>
            <input
              placeholder="Add task"
              value={newTasks[gIdx]||''}
              onChange={e=>setNewTasks({ ...newTasks,[gIdx]:e.target.value })}
              style={{ width:'70%', padding:6, marginRight:8 }}
            />
            <button onClick={()=>addTask(gIdx)}>Add</button>
          </div>
        </div>
      ))}

      {/* Single notes section at the bottom */}
      <div className="checklist-notes">
        <h4>Notes & Interview Questions</h4>
        <Editor
          apiKey="ut855mwybwet100q1u8c2j3pfz3r0vigi7wyaeuwdzd5tdwp"
          value={checklist[0]?.notes || ''}
          onEditorChange={(content) => {
            const copy = [...checklist];
            copy[0].notes = content;
            setChecklist(copy);
          }}
          init={{
            height: 300,
            menubar: false,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | formatselect | ' +
              'bold italic backcolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | help',
            content_style: `
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                font-size: 14px;
                color: ${darkMode ? '#ecf0f1' : '#2c3e50'};
                background: ${darkMode ? '#2d2d2d' : '#ffffff'};
              }
            `,
            skin: darkMode ? 'oxide-dark' : 'oxide',
            content_css: darkMode ? 'dark' : 'default'
          }}
        />
      </div>
    </div>
  );
}

export default Checklist;
