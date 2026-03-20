import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Camera, Flame, UserRound, CalendarClock, CircleCheckBig, Dumbbell, Activity, Save } from 'lucide-react'
import {
  fetchWorkoutSummary,
  fetchWorkoutSessions,
  fetchNutritionLogs,
  fetchAnalytics,
  fetchProfile,
  updateProfile,
  fetchNotificationPreferences,
  updateNotificationPreferences,
  uploadProgressPhoto,
  saveWorkoutSession,
} from '../services/api'
import './FeaturePages.css'
import './Dashboard.css'

const WORKOUT_TASKS_STORAGE_KEY = 'arize_today_workout_tasks_v1'
const DEFAULT_WORKOUT_TASKS = [
  { id: 'squats', title: 'Squats', details: '3 sets x 12 reps', reps: 36, done: false },
  { id: 'pushups', title: 'Push-ups', details: '3 sets x 12 reps', reps: 36, done: false },
  { id: 'lunges', title: 'Lunges', details: '3 sets x 12 reps per leg', reps: 24, done: false },
  { id: 'plank', title: 'Plank', details: '3 sets x 30 sec hold', reps: 3, done: false },
]

function loadSavedWorkoutTasks() {
  if (typeof window === 'undefined') {
    return DEFAULT_WORKOUT_TASKS
  }

  try {
    const raw = localStorage.getItem(WORKOUT_TASKS_STORAGE_KEY)
    if (!raw) {
      return DEFAULT_WORKOUT_TASKS
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_WORKOUT_TASKS
    }

    return parsed
      .filter((item) => item && item.id && item.title)
      .map((item) => ({
        id: String(item.id),
        title: String(item.title),
        details: String(item.details || 'Custom task'),
        reps: Number(item.reps || 20),
        done: Boolean(item.done),
      }))
  } catch {
    return DEFAULT_WORKOUT_TASKS
  }
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')
  const [workoutTasks, setWorkoutTasks] = useState(loadSavedWorkoutTasks)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showTaskToast, setShowTaskToast] = useState(false)
  const [taskToastMessage, setTaskToastMessage] = useState('')

  const [workoutSummary, setWorkoutSummary] = useState({ total_sessions: 0, total_reps: 0, avg_form_score: 0 })
  const [workoutSessions, setWorkoutSessions] = useState([])
  const [nutritionLogs, setNutritionLogs] = useState([])
  const [consistency, setConsistency] = useState({ streak_days: 0, missed_workouts: 0, weekly_consistency_score: 0, feedback: [] })

  const [profileForm, setProfileForm] = useState({
    age: '',
    weight: '',
    district: 'global',
    goal: 'maintenance',
    diet_type: 'vegetarian',
  })
  const [profileSavedPct, setProfileSavedPct] = useState(0)

  const [prefs, setPrefs] = useState({
    workout_reminders: true,
    streak_alerts: true,
    diet_suggestions: true,
    whatsapp_updates: false,
  })

  const [photoForm, setPhotoForm] = useState({ image_url: '', note: '' })
  const [photoNotice, setPhotoNotice] = useState('')

  const [pendingAction, setPendingAction] = useState('')

  useEffect(() => {
    const pending = workoutTasks.filter((task) => !task.done)
    if (pending.length > 0) {
      setTaskToastMessage(`Reminder: You still have ${pending.length} workout task${pending.length > 1 ? 's' : ''} pending.`)
      setShowTaskToast(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(WORKOUT_TASKS_STORAGE_KEY, JSON.stringify(workoutTasks))
  }, [workoutTasks])

  useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      setLoading(true)
      setStatusMessage('')

      const results = await Promise.allSettled([
        fetchWorkoutSummary(),
        fetchWorkoutSessions(),
        fetchNutritionLogs(),
        fetchAnalytics(),
        fetchProfile(),
        fetchNotificationPreferences(),
      ])

      if (!isMounted) {
        return
      }

      const [summaryRes, sessionsRes, nutritionRes, consistencyRes, profileRes, prefsRes] = results

      if (summaryRes.status === 'fulfilled') {
        setWorkoutSummary(summaryRes.value || {})
      }
      if (sessionsRes.status === 'fulfilled') {
        setWorkoutSessions(Array.isArray(sessionsRes.value) ? sessionsRes.value : [])
      }
      if (nutritionRes.status === 'fulfilled') {
        setNutritionLogs(Array.isArray(nutritionRes.value) ? nutritionRes.value : [])
      }
      if (consistencyRes.status === 'fulfilled') {
        setConsistency(consistencyRes.value || {})
      }
      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value || {}
        setProfileForm({
          age: p.age ?? '',
          weight: p.weight ?? '',
          district: p.district || 'global',
          goal: p.goal || 'maintenance',
          diet_type: p.diet_type || 'vegetarian',
        })
      }
      if (prefsRes.status === 'fulfilled') {
        setPrefs({ ...prefs, ...(prefsRes.value || {}) })
      }

      const anySuccess = results.some((result) => result.status === 'fulfilled')
      if (!anySuccess) {
        setStatusMessage('Unable to sync dashboard right now. Try again in a moment.')
      }

      setLoading(false)
    }

    loadDashboardData()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const fields = [
      profileForm.age !== '',
      profileForm.weight !== '',
      !!profileForm.goal,
      !!profileForm.diet_type,
      !!profileForm.district,
    ]
    const completed = fields.filter(Boolean).length
    setProfileSavedPct(Math.round((completed / fields.length) * 100))
  }, [profileForm])

  const todayKey = new Date().toISOString().slice(0, 10)

  const planDoneCount = workoutTasks.filter((task) => task.done).length
  const planProgressPct = workoutTasks.length > 0 ? Math.round((planDoneCount / workoutTasks.length) * 100) : 0

  const remainingExercises = Math.max(0, workoutTasks.length - planDoneCount)
  const focusDurationMin = Math.max(10, remainingExercises * 10)
  const focusDurationMax = focusDurationMin + 8
  const focusIntensity = (workoutSummary.avg_form_score || 0) >= 80 ? 'High intensity' : 'Moderate intensity'
  const focusMessage =
    (consistency.missed_workouts || 0) > 0
      ? `Complete ${remainingExercises || 1} exercises and mobility today to recover consistency.`
      : `Complete ${remainingExercises || 1} exercises to maintain your current streak pace.`

  const weeklyCalories = useMemo(() => {
    return workoutSessions.slice(0, 20).reduce((sum, session) => sum + Number(session.calories_burned || 0), 0)
  }, [workoutSessions])

  const todayProtein = useMemo(() => {
    return nutritionLogs
      .filter((entry) => (entry.created_at || '').slice(0, 10) === todayKey)
      .reduce((sum, entry) => sum + Number(entry.protein || 0), 0)
  }, [nutritionLogs, todayKey])

  const handleContinueWorkout = async () => {
    const nextItem = workoutTasks.find((task) => !task.done)
    if (!nextItem) {
      setStatusMessage('Workout plan already completed for today.')
      return
    }

    setWorkoutTasks((prev) => prev.map((task) => (task.id === nextItem.id ? { ...task, done: true } : task)))
    setPendingAction('workout')
    setStatusMessage('')
    try {
      await saveWorkoutSession({
        exercise_name: nextItem.title,
        reps: nextItem.reps,
        duration_minutes: 10,
        form_score: 80,
        calories_burned: 75,
      })
      const [summary, sessions, analytics] = await Promise.all([
        fetchWorkoutSummary(),
        fetchWorkoutSessions(),
        fetchAnalytics(),
      ])
      setWorkoutSummary(summary || {})
      setWorkoutSessions(Array.isArray(sessions) ? sessions : [])
      setConsistency(analytics || {})
      setStatusMessage(`${nextItem.title} marked complete.`)
    } catch {
      setStatusMessage('Task checked. Backend sync is unavailable right now.')
    } finally {
      setPendingAction('')
    }
  }

  const handleAddTask = () => {
    const title = newTaskTitle.trim()
    if (!title) {
      return
    }

    const task = {
      id: `task-${Date.now()}`,
      title,
      details: 'Custom task',
      reps: 20,
      done: false,
    }

    setWorkoutTasks((prev) => [...prev, task])
    setNewTaskTitle('')
    setStatusMessage('Task added to Today Workout Plan.')
  }

  const handleToggleTask = (taskId) => {
    setWorkoutTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task))
    )
  }

  const handleDeleteTask = (taskId) => {
    setWorkoutTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  const handleSaveProfile = async () => {
    setPendingAction('profile')
    setStatusMessage('')
    try {
      const payload = {
        age: profileForm.age === '' ? null : Number(profileForm.age),
        weight: profileForm.weight === '' ? null : Number(profileForm.weight),
        district: profileForm.district || 'global',
        goal: profileForm.goal,
        diet_type: profileForm.diet_type,
      }
      await updateProfile(payload)
      setStatusMessage('Profile saved successfully.')
    } catch {
      setStatusMessage('Profile save is unavailable right now.')
    } finally {
      setPendingAction('')
    }
  }

  const handleSavePrefs = async () => {
    setPendingAction('alerts')
    setStatusMessage('')
    try {
      await updateNotificationPreferences(prefs)
      setStatusMessage('Alert preferences updated.')
    } catch {
      setStatusMessage('Alert update is unavailable right now.')
    } finally {
      setPendingAction('')
    }
  }

  const handleUploadPhoto = async () => {
    if (!photoForm.image_url.trim()) {
      setPhotoNotice('Add an image URL to upload progress photo.')
      return
    }

    setPendingAction('photo')
    setPhotoNotice('')
    try {
      await uploadProgressPhoto({ image_url: photoForm.image_url.trim(), note: photoForm.note.trim() })
      setPhotoNotice('Progress photo uploaded.')
      setPhotoForm({ image_url: '', note: '' })
    } catch {
      setPhotoNotice('Photo upload unavailable right now.')
    } finally {
      setPendingAction('')
    }
  }

  return (
    <motion.div
      className="page-container feature-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <section className="feature-hero glass dash-hero">
        <div className="dash-hero-main">
          <div className="feature-badge"><UserRound size={14} /> User System</div>
          <h1>User Hub Dashboard</h1>
          <p>Track your profile, training, and recovery in one place with clear daily actions.</p>
          <div className="dash-hero-actions">
            <button className="btn-primary" type="button" onClick={handleContinueWorkout} disabled={pendingAction === 'workout'}>
              {pendingAction === 'workout' ? 'Updating...' : 'Start Today Session'}
            </button>
            <button className="dash-btn-muted" type="button" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
              Open Weekly Plan
            </button>
          </div>
        </div>

        <div className="dash-focus-card">
          <div className="dash-focus-label">Today Focus</div>
          <strong>Consistency Block</strong>
          <p>{focusMessage}</p>
          <div className="dash-focus-meta">
            <span><CalendarClock size={14} /> {focusDurationMin} to {focusDurationMax} min</span>
            <span><Activity size={14} /> {focusIntensity}</span>
          </div>
        </div>

        <div className="feature-stats dash-feature-stats">
          <div className="stat-box">
            <strong>{consistency.streak_days || 0}</strong>
            <small>Day streak</small>
          </div>
          <div className="stat-box">
            <strong>{weeklyCalories.toLocaleString()}</strong>
            <small>Calories burned</small>
          </div>
          <div className="stat-box">
            <strong>{Math.round(todayProtein)}g</strong>
            <small>Protein today</small>
          </div>
          <div className="stat-box">
            <strong>{planProgressPct}%</strong>
            <small>Plan completion</small>
          </div>
        </div>
      </section>

      {showTaskToast && taskToastMessage ? (
        <div className="dash-toast" role="status" aria-live="polite">
          <span>{taskToastMessage}</span>
          <button type="button" onClick={() => setShowTaskToast(false)}>Dismiss</button>
        </div>
      ) : null}

      {loading ? <section className="feature-card glass"><p>Loading dashboard data...</p></section> : null}
      {statusMessage ? <section className="feature-card glass"><p>{statusMessage}</p></section> : null}

      <section className="dash-main-grid">
        <article className="feature-card glass dash-card">
          <div className="dash-card-header">
            <h3><Dumbbell size={16} /> Today Workout Plan</h3>
            <span className="dash-chip">{planDoneCount} of {workoutTasks.length} done</span>
          </div>

          <div className="dash-task-create">
            <input
              className="dash-task-input"
              placeholder="Add a task (e.g., 20 min run)"
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleAddTask()
                }
              }}
            />
            <button className="btn-primary" type="button" onClick={handleAddTask}>Add Task</button>
          </div>

          <ul className="dash-task-list">
            {workoutTasks.map((item) => {
              const isDone = item.done
              return (
                <li key={item.id} className={isDone ? 'done' : ''}>
                  <button className="dash-task-toggle" type="button" onClick={() => handleToggleTask(item.id)}>
                    {isDone ? <CircleCheckBig size={16} /> : <span className="dash-empty-dot" />}
                  </button>
                  <span className="dash-task-title">{item.title}: {item.details}</span>
                  <button className="dash-task-delete" type="button" onClick={() => handleDeleteTask(item.id)}>Remove</button>
                </li>
              )
            })}
          </ul>

          <div className="dash-progress-wrap">
            <div className="dash-progress-label">
              <span>Workout Progress</span>
              <strong>{planProgressPct}%</strong>
            </div>
            <div className="dash-progress-track">
              <div className="dash-progress-fill" style={{ width: `${planProgressPct}%` }} />
            </div>
          </div>

          <div className="dash-card-actions">
            <button className="btn-primary" type="button" onClick={handleContinueWorkout} disabled={pendingAction === 'workout'}>
              {pendingAction === 'workout' ? 'Updating...' : 'Continue Workout'}
            </button>
            <button className="dash-btn-muted" type="button">View Full Routine</button>
          </div>
        </article>

        <article className="feature-card glass dash-card">
          <div className="dash-card-header">
            <h3>Profile Setup</h3>
            <span className="dash-chip">{profileSavedPct}% complete</span>
          </div>
          <form className="inline-form">
            <input
              placeholder="Age"
              value={profileForm.age}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, age: event.target.value }))}
            />
            <input
              placeholder="Weight (kg)"
              value={profileForm.weight}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, weight: event.target.value }))}
            />
            <input
              placeholder="District"
              value={profileForm.district}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, district: event.target.value }))}
            />
            <select
              value={profileForm.goal}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, goal: event.target.value }))}
            >
              <option value="muscle_gain">Goal: Muscle Gain</option>
              <option value="fat_loss">Goal: Fat Loss</option>
              <option value="maintenance">Goal: Maintenance</option>
            </select>
            <select
              value={profileForm.diet_type}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, diet_type: event.target.value }))}
            >
              <option value="vegetarian">Diet Type: Vegetarian</option>
              <option value="eggetarian">Diet Type: Eggetarian</option>
              <option value="non_veg">Diet Type: Non-Veg</option>
              <option value="vegan">Diet Type: Vegan</option>
            </select>
            <button className="btn-primary" type="button" onClick={handleSaveProfile} disabled={pendingAction === 'profile'}>
              <Save size={14} /> {pendingAction === 'profile' ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          <div className="dash-next-step">
            <small>Next suggested step</small>
            <p>Keep district, goal, and diet type updated for better workout and streak recommendations.</p>
          </div>
        </article>

        <article className="feature-card glass dash-card">
          <h3><Camera size={16} /> Progress & Transformation</h3>
          <p>Upload weekly photos and compare your timeline side by side.</p>
          <ul className="feature-list">
            <li>Upload front/side/back progress photos</li>
            <li>Auto-date timeline for visual comparison</li>
            <li>Body-change confidence insights</li>
          </ul>
          <form className="inline-form">
            <input
              placeholder="Photo URL"
              value={photoForm.image_url}
              onChange={(event) => setPhotoForm((prev) => ({ ...prev, image_url: event.target.value }))}
            />
            <input
              placeholder="Note (optional)"
              value={photoForm.note}
              onChange={(event) => setPhotoForm((prev) => ({ ...prev, note: event.target.value }))}
            />
            <button className="btn-primary" type="button" onClick={handleUploadPhoto} disabled={pendingAction === 'photo'}>
              {pendingAction === 'photo' ? 'Uploading...' : 'Upload Photo'}
            </button>
          </form>
          {photoNotice ? <small className="dash-note">{photoNotice}</small> : null}
        </article>

        <article className="feature-card glass dash-card">
          <h3><Bell size={16} /> Notification Center</h3>
          <div className="dash-toggle-list">
            <label><input type="checkbox" checked={prefs.workout_reminders} onChange={(event) => setPrefs((prev) => ({ ...prev, workout_reminders: event.target.checked }))} /> Workout reminders</label>
            <label><input type="checkbox" checked={prefs.streak_alerts} onChange={(event) => setPrefs((prev) => ({ ...prev, streak_alerts: event.target.checked }))} /> Streak alerts</label>
            <label><input type="checkbox" checked={prefs.diet_suggestions} onChange={(event) => setPrefs((prev) => ({ ...prev, diet_suggestions: event.target.checked }))} /> Diet suggestions</label>
            <label><input type="checkbox" checked={prefs.whatsapp_updates} onChange={(event) => setPrefs((prev) => ({ ...prev, whatsapp_updates: event.target.checked }))} /> WhatsApp updates</label>
          </div>
          <button className="btn-primary" type="button" onClick={handleSavePrefs} disabled={pendingAction === 'alerts'}>
            {pendingAction === 'alerts' ? 'Saving...' : 'Manage Alerts'}
          </button>
        </article>

        <article className="feature-card glass dash-card">
          <h3><Flame size={16} /> Progress Tracking</h3>
          <p className="kpi">{consistency.weekly_consistency_score || 0}%</p>
          <p>
            {consistency.missed_workouts || 0} missed workouts this week. {Array.isArray(consistency.feedback) ? consistency.feedback[1] || '' : ''}
          </p>
          <div className="tag-row">
            <span className="tag">Weekly view</span>
            <span className="tag">Monthly trends</span>
            <span className="tag">Goal adherence</span>
          </div>
        </article>
      </section>
    </motion.div>
  )
}
