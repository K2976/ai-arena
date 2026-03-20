import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Camera, Activity, Timer, ArrowRight, Upload } from 'lucide-react'
import './FeaturePages.css'
import './ComputerVision.css'
import { getExerciseData, GYM_TOPICS } from '../services/wikipediaApi'
import { analyzeWorkoutVideo, fetchWorkoutSummary } from '../services/api'

export default function ComputerVision() {
  const [exerciseCards, setExerciseCards] = useState([])
  const [exerciseLoading, setExerciseLoading] = useState(true)
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoDuration, setVideoDuration] = useState(0)
  const [exerciseName, setExerciseName] = useState('Workout Session')
  const [videoAnalysis, setVideoAnalysis] = useState(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState('')
  const [cameraStatus, setCameraStatus] = useState('idle')
  const [latencyMs, setLatencyMs] = useState(null)
  const [setupGuideOpen, setSetupGuideOpen] = useState(false)
  const [workoutSummary, setWorkoutSummary] = useState(null)

  const fallbackExercises = useMemo(() => (
    (GYM_TOPICS?.exercises || []).slice(0, 5).map((item) => item.name)
  ), [])
  const defaultExerciseImage = 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=1200&q=80'

  const supportedExerciseCount = useMemo(() => {
    if (exerciseCards.length) {
      return exerciseCards.length
    }
    return fallbackExercises.length || 0
  }, [exerciseCards, fallbackExercises])

  const formSignal = useMemo(() => {
    if (videoAnalysis?.form_score != null) {
      return Math.round(videoAnalysis.form_score)
    }
    if (workoutSummary?.avg_form_score != null) {
      return Math.round(workoutSummary.avg_form_score)
    }
    return null
  }, [videoAnalysis, workoutSummary])

  const sessionSaveStatus = useMemo(() => {
    if (workoutSummary?.guest_mode) {
      return 'Guest mode'
    }
    if (workoutSummary && typeof workoutSummary.total_sessions === 'number') {
      return 'Enabled'
    }
    return 'Unknown'
  }, [workoutSummary])

  useEffect(() => {
    let mounted = true

    async function loadExerciseImages() {
      setExerciseLoading(true)
      const data = await getExerciseData()
      if (!mounted) {
        return
      }

      if (Array.isArray(data) && data.length) {
        setExerciseCards(data.slice(0, 5))
      } else {
        setExerciseCards([])
      }
      setExerciseLoading(false)
    }

    loadExerciseImages()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    async function loadWorkoutSummary() {
      try {
        const summary = await fetchWorkoutSummary()
        if (mounted) {
          setWorkoutSummary(summary)
        }
      } catch {
        if (mounted) {
          setWorkoutSummary({ total_sessions: 0, avg_form_score: 0, guest_mode: true })
        }
      }
    }

    loadWorkoutSummary()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [videoUrl])

  const handleVideoSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('video/')) {
      setVideoError('Please upload a valid video file.')
      return
    }

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }

    const localUrl = URL.createObjectURL(file)
    setVideoFile(file)
    setVideoUrl(localUrl)
    setVideoDuration(0)
    setVideoAnalysis(null)
    setVideoError('')
  }

  const runVideoAnalysis = async () => {
    if (!videoFile) {
      setVideoError('Upload a workout video first.')
      return
    }

    setVideoLoading(true)
    setVideoError('')
    setVideoAnalysis(null)

    try {
      const result = await analyzeWorkoutVideo(videoFile, {
        exercise_name: exerciseName,
        duration_seconds: videoDuration,
      })
      setVideoAnalysis(result?.analysis || null)

      const summary = await fetchWorkoutSummary().catch(() => null)
      if (summary) {
        setWorkoutSummary(summary)
      }
    } catch (error) {
      setVideoError(error.message || 'Video analysis failed. Please try again.')
    } finally {
      setVideoLoading(false)
    }
  }

  const handleCameraTest = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('unsupported')
      setVideoError('Camera API is not supported in this browser.')
      return
    }

    setCameraStatus('checking')
    setVideoError('')

    const start = performance.now()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      const latency = Math.round(performance.now() - start)
      setLatencyMs(latency)
      setCameraStatus('ready')
      stream.getTracks().forEach((track) => track.stop())
    } catch {
      setCameraStatus('blocked')
      setLatencyMs(null)
      setVideoError('Camera permission blocked. Allow camera access to enable live tracking.')
    }
  }

  return (
    <motion.div
      className="page-container feature-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <section className="feature-hero glass cv-hero">
        <div className="cv-hero-main">
          <div className="feature-badge"><Camera size={14} /> OpenCV + MediaPipe</div>
          <h1>AI Workout Tracking (CV Based)</h1>
          <p>Real-time rep counting, exercise detection, form checks, and session summaries powered by computer vision.</p>
          <div className="cv-hero-actions">
            <Link to="/counter" className="btn-primary cv-btn-icon">
              Open Rep Counter <ArrowRight size={16} />
            </Link>
            <button type="button" className="cv-btn-secondary" onClick={handleCameraTest}>
              {cameraStatus === 'checking' ? 'Testing Camera...' : 'Test Camera Setup'}
            </button>
          </div>
        </div>

        <div className="cv-hero-panel">
          <small>Session Readiness</small>
          <h3>{cameraStatus === 'ready' ? 'System checks completed' : 'Run camera test to verify setup'}</h3>
          <ul>
            <li>Camera permission: {cameraStatus === 'ready' ? 'Ready' : cameraStatus === 'blocked' ? 'Blocked' : 'Not tested'}</li>
            <li>Pose model: {cameraStatus === 'ready' ? 'Loaded' : 'Waiting for camera test'}</li>
            <li>
              Latency target: {latencyMs != null ? `${latencyMs}ms` : 'Not measured'}
            </li>
          </ul>
        </div>

        <div className="feature-stats cv-stats-row">
          <div className="stat-box">
            <strong>{supportedExerciseCount}</strong>
            <small>Supported exercises</small>
          </div>
          <div className="stat-box">
            <strong>{formSignal != null ? `${formSignal}%` : 'N/A'}</strong>
            <small>Form accuracy signal</small>
          </div>
          <div className="stat-box">
            <strong>{cameraStatus === 'ready' ? 'Live' : 'Idle'}</strong>
            <small>Pose tracking mode</small>
          </div>
          <div className="stat-box">
            <strong>{sessionSaveStatus}</strong>
            <small>Session save enabled</small>
          </div>
        </div>
      </section>

      <section className="cv-main-grid">
        <article className="feature-card glass cv-card cv-card-primary">
          <div className="cv-card-head">
            <h3><Activity size={16} /> Rep Counting</h3>
            <span className="cv-chip">Core Engine</span>
          </div>
          <p>Our AI-powered rep counter uses MediaPipe Pose detection to track your movements in real-time.</p>
          <ul className="feature-list">
            <li>Automatic rep counting as you exercise</li>
            <li>Real-time pose visualization with skeleton overlay</li>
            <li>Movement stage tracking (Up/Down/Extended/Contracted)</li>
            <li>Form symmetry score to maintain balance</li>
            <li>Session timer and calories burned estimation</li>
          </ul>
          <div className="cv-inline-actions">
            <Link to="/counter" className="btn-primary">Start Workout Session</Link>
            <button type="button" className="cv-btn-secondary" onClick={() => setSetupGuideOpen((prev) => !prev)}>
              {setupGuideOpen ? 'Hide Setup Guide' : 'View Setup Guide'}
            </button>
          </div>

          {setupGuideOpen && (
            <ul className="feature-list">
              <li>Use a well-lit room and keep your whole body visible.</li>
              <li>Set camera at chest height around 2-3 meters away.</li>
              <li>Wear contrasting clothes for clearer pose tracking.</li>
              <li>Perform 3 warm-up reps before counting starts.</li>
            </ul>
          )}
        </article>

        <article className="feature-card glass cv-card cv-video-card">
          <div className="cv-card-head">
            <h3><Upload size={16} /> Upload Workout Video</h3>
            <span className="cv-chip">Gymnasium Analysis</span>
          </div>

          <p>Upload your workout clip and get automatic performance + intensity analysis.</p>

          <div className="cv-video-form">
            <input
              type="text"
              value={exerciseName}
              onChange={(event) => setExerciseName(event.target.value)}
              placeholder="Exercise name (e.g., Squats)"
            />
            <input type="file" accept="video/*" onChange={handleVideoSelect} />
          </div>

          {videoUrl && (
            <video
              className="cv-upload-preview"
              src={videoUrl}
              controls
              onLoadedMetadata={(event) => {
                const value = event.currentTarget?.duration
                if (Number.isFinite(value) && value > 0) {
                  setVideoDuration(value)
                }
              }}
            />
          )}

          <button type="button" className="btn-primary" onClick={runVideoAnalysis} disabled={videoLoading}>
            {videoLoading ? 'Analyzing Video...' : 'Analyze Video'}
          </button>

          {videoError && <p className="camera-error">{videoError}</p>}

          {videoAnalysis && (
            <div className="cv-video-results">
              <div className="stat-box"><strong>{videoAnalysis.form_score}</strong><small>Form score</small></div>
              <div className="stat-box"><strong>{videoAnalysis.calories_burned}</strong><small>Calories</small></div>
              <div className="stat-box"><strong>{videoAnalysis.estimated_reps}</strong><small>Estimated reps</small></div>
              <div className="stat-box"><strong>{videoAnalysis.duration_minutes} min</strong><small>Duration</small></div>
              <div className="stat-box">
                <strong>{videoAnalysis.gym_analysis?.best_mode || 'moderate'}</strong>
                <small>Gymnasium best mode</small>
              </div>
              <div className="stat-box">
                <strong>{videoAnalysis.gym_analysis?.confidence || 0}%</strong>
                <small>Gymnasium confidence</small>
              </div>
            </div>
          )}

          {videoAnalysis?.feedback && <p className="cv-note">Tip: {videoAnalysis.feedback}</p>}
        </article>

        <article className="feature-card glass cv-card">
          <div className="cv-card-head">
            <h3><Timer size={16} /> Supported Exercises</h3>
            <span className="cv-chip">Modes</span>
          </div>
          <p>Multiple exercise modes with custom angle thresholds and form detection:</p>

          {exerciseLoading ? (
            <p className="cv-note">Loading exercise images from Wikipedia...</p>
          ) : exerciseCards.length ? (
            <div className="cv-exercise-grid">
              {exerciseCards.map((exercise) => (
                <a
                  key={exercise.name}
                  href={exercise.pageUrl || '#'}
                  className="cv-exercise-item"
                  target={exercise.pageUrl ? '_blank' : undefined}
                  rel={exercise.pageUrl ? 'noopener noreferrer' : undefined}
                  onClick={(event) => {
                    if (!exercise.pageUrl) {
                      event.preventDefault()
                    }
                  }}
                >
                  <div className="cv-exercise-image-wrap">
                    <img
                      src={exercise.thumbnail || exercise.originalImage || ''}
                      alt={exercise.name}
                      className="cv-exercise-image"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = defaultExerciseImage
                      }}
                    />
                  </div>
                  <span>{exercise.name}</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="tag-row cv-tag-row">
              {fallbackExercises.map((item) => (
                <span className="tag" key={item}>{item}</span>
              ))}
            </div>
          )}

          <p className="cv-note">
            Each exercise has optimized angle thresholds and minimum rep intervals to ensure accurate counting.
          </p>
        </article>

      </section>
    </motion.div>
  )
}
