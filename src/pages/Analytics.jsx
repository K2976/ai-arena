import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Flame, AlertCircle, TrendingUp, ChartNoAxesCombined, Trophy, MapPin } from 'lucide-react'
import { fetchAnalytics, fetchStreakLeaderboard } from '../services/api'
import './FeaturePages.css'

export default function Analytics() {
  const [consistency, setConsistency] = useState(null)
  const [leaderboardData, setLeaderboardData] = useState(null)
  const [districtInput, setDistrictInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingBoard, setLoadingBoard] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadInitial() {
      setLoading(true)
      setError('')
      try {
        const [analyticsResponse, leaderboardResponse] = await Promise.all([
          fetchAnalytics(),
          fetchStreakLeaderboard('', 10),
        ])

        setConsistency(analyticsResponse)
        setLeaderboardData(leaderboardResponse)
        setDistrictInput(leaderboardResponse?.district || analyticsResponse?.district || 'global')
      } catch (err) {
        setError(err.message || 'Unable to load analytics right now')
      } finally {
        setLoading(false)
      }
    }

    loadInitial()
  }, [])

  async function handleLeaderboardSearch(event) {
    event.preventDefault()
    setLoadingBoard(true)
    setError('')
    try {
      const response = await fetchStreakLeaderboard((districtInput || '').trim(), 10)
      setLeaderboardData(response)
      if (response?.district) {
        setDistrictInput(response.district)
      }
    } catch (err) {
      setError(err.message || 'Unable to load leaderboard')
    } finally {
      setLoadingBoard(false)
    }
  }

  const feedbackRows = useMemo(() => {
    if (Array.isArray(consistency?.feedback) && consistency.feedback.length > 0) {
      return consistency.feedback
    }
    return ['Keep training this week to build streak consistency.']
  }, [consistency])

  const topThree = (leaderboardData?.leaderboard || []).slice(0, 3)

  return (
    <motion.div
      className="page-container feature-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <section className="feature-hero glass">
        <div className="feature-badge"><ChartNoAxesCombined size={14} /> Smart Streak & Consistency</div>
        <h1>Analytics Dashboard</h1>
        <p>District-wise streak leaderboard, missed workout signals, and smart consistency insights.</p>
      </section>

      {error ? <section className="feature-card glass"><p>{error}</p></section> : null}

      {loading ? <section className="feature-card glass"><p>Loading analytics...</p></section> : null}

      {!loading ? <section className="feature-grid">
        <article className="feature-card glass">
          <h3><Flame size={16} /> Daily Streak</h3>
          <p className="kpi">{consistency?.streak_days || 0}</p>
          <p>Keep training today to protect your ranking.</p>
          <small>District: {(leaderboardData?.district || consistency?.district || 'global').toUpperCase()}</small>
        </article>

        <article className="feature-card glass">
          <h3><AlertCircle size={16} /> Missed Workout Detection</h3>
          <ul className="feature-list">
            <li>You missed {consistency?.missed_workouts ?? 0} workouts this week</li>
            <li>Weekly consistency score: {consistency?.weekly_consistency_score ?? 0}/100</li>
            <li>Leaderboard updates in real time as sessions are logged</li>
          </ul>
        </article>

        <article className="feature-card glass">
          <h3><TrendingUp size={16} /> Smart Feedback</h3>
          <ul className="feature-list">
            {feedbackRows.map((row, index) => (
              <li key={`${row}-${index}`}>{row}</li>
            ))}
          </ul>
        </article>
      </section> : null}

      {!loading ? <section className="feature-card glass">
        <h3><Trophy size={16} /> District Streak Leaderboard</h3>
        <form className="inline-form leaderboard-filter" onSubmit={handleLeaderboardSearch}>
          <label htmlFor="district"><MapPin size={14} /> District</label>
          <input
            id="district"
            type="text"
            value={districtInput}
            onChange={(event) => setDistrictInput(event.target.value)}
            placeholder="Enter district name"
            list="district-options"
          />
          <datalist id="district-options">
            {(leaderboardData?.available_districts || []).map((districtName) => (
              <option key={districtName} value={districtName} />
            ))}
          </datalist>
          <button className="leaderboard-cta" type="submit" disabled={loadingBoard}>{loadingBoard ? 'Loading...' : 'Show Leaderboard'}</button>
        </form>

        <div className="leaderboard-top-row">
          {topThree.map((entry) => (
            <article className="stat-box" key={entry.username}>
              <strong>#{entry.rank} {entry.username}</strong>
              <p>{entry.streak_days} day streak</p>
              <small>{entry.gamified_points} points</small>
            </article>
          ))}
        </div>

        <div className="leaderboard-list">
          {(leaderboardData?.leaderboard || []).map((entry) => (
            <div className="leaderboard-item" key={`${entry.username}-${entry.rank}`}>
              <span>#{entry.rank}</span>
              <strong>{entry.username}</strong>
              <span>{entry.streak_days}d streak</span>
              <span>{entry.weekly_consistency_score}/100</span>
              <span>{entry.gamified_points} pts</span>
            </div>
          ))}
        </div>

        {leaderboardData?.current_user ? (
          <p className="camera-hint">
            Your rank in {leaderboardData.district}: #{leaderboardData.current_user.rank} with {leaderboardData.current_user.gamified_points} points.
          </p>
        ) : null}
      </section> : null}
    </motion.div>
  )
}
