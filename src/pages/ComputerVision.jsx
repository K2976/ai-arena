import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Camera, Activity, Timer, AlertTriangle, ArrowRight } from 'lucide-react'
import './FeaturePages.css'

export default function ComputerVision() {
  return (
    <motion.div
      className="page-container feature-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <section className="feature-hero glass">
        <div className="feature-badge"><Camera size={14} /> OpenCV + MediaPipe</div>
        <h1>AI Workout Tracking (CV Based)</h1>
        <p>Real-time rep counting, exercise detection, form checks, and session summaries powered by computer vision.</p>
        <Link to="/counter" className="btn-primary" style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          Open Live Rep Counter <ArrowRight size={16} />
        </Link>
      </section>

      <section className="feature-grid">
        <article className="feature-card glass">
          <h3><Activity size={16} /> Live Rep Counting</h3>
          <p>Our AI-powered rep counter uses MediaPipe Pose detection to track your movements in real-time.</p>
          <ul className="feature-list">
            <li>Automatic rep counting as you exercise</li>
            <li>Real-time pose visualization with skeleton overlay</li>
            <li>Movement stage tracking (Up/Down/Extended/Contracted)</li>
            <li>Form symmetry score to maintain balance</li>
            <li>Session timer and calories burned estimation</li>
          </ul>
          <Link to="/counter" className="btn-primary">
            Start Workout Session
          </Link>
        </article>

        <article className="feature-card glass">
          <h3><Timer size={16} /> Supported Exercises</h3>
          <p>Multiple exercise modes with custom angle thresholds and form detection:</p>
          <div className="tag-row" style={{ marginBottom: '12px' }}>
            <span className="tag">Squats</span>
            <span className="tag">Push-ups</span>
            <span className="tag">Bicep Curls</span>
            <span className="tag">Shoulder Press</span>
            <span className="tag">Lunges</span>
          </div>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>
            Each exercise has optimized angle thresholds and minimum rep intervals to ensure accurate counting.
          </p>
        </article>

        <article className="feature-card glass">
          <h3><AlertTriangle size={16} /> Form Analysis</h3>
          <p>Real-time feedback to help you maintain proper form:</p>
          <ul className="feature-list">
            <li><strong>Symmetry Score:</strong> Compares left vs right side angles</li>
            <li><strong>Joint Angle Display:</strong> See your current knee/elbow angle</li>
            <li><strong>Movement Stage:</strong> Visual confirmation of exercise phase</li>
            <li><strong>Session Metrics:</strong> Track time, reps, and target progress</li>
          </ul>
        </article>

        <article className="feature-card glass">
          <h3>Workout Data Saved to Backend</h3>
          <p>All your workout sessions are automatically saved with complete metrics:</p>
          <div className="feature-stats">
            <div className="stat-box"><strong>Exercise</strong><small>Type & name</small></div>
            <div className="stat-box"><strong>Reps</strong><small>Total count</small></div>
            <div className="stat-box"><strong>Duration</strong><small>Session time</small></div>
            <div className="stat-box"><strong>Form Score</strong><small>Symmetry %</small></div>
            <div className="stat-box"><strong>Calories</strong><small>Estimated burn</small></div>
          </div>
          <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '12px' }}>
            View your progress and workout history in the Dashboard and Analytics pages.
          </p>
        </article>
      </section>
    </motion.div>
  )
}
