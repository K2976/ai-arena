import { useState } from 'react'
import { motion } from 'framer-motion'
import { Watch, MessageCircle, Music, Link2, Play } from 'lucide-react'
import { getMusicRecommendation } from '../services/api'
import './FeaturePages.css'

export default function Integrations() {
  const [selectedMood, setSelectedMood] = useState('')
  const [musicData, setMusicData] = useState(null)
  const [isLoadingMusic, setIsLoadingMusic] = useState(false)
  const [musicError, setMusicError] = useState('')

  const handleGetPlaylist = async (mood) => {
    setSelectedMood(mood)
    setIsLoadingMusic(true)
    setMusicError('')
    setMusicData(null)

    try {
      const data = await getMusicRecommendation(mood)
      setMusicData(data)
    } catch (error) {
      setMusicError(error.message || 'Failed to load music recommendation')
    } finally {
      setIsLoadingMusic(false)
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
      <section className="feature-hero glass">
        <div className="feature-badge"><Link2 size={14} /> Connected Experiences</div>
        <h1>Wearables, WhatsApp & Gym Music</h1>
        <p>Import fitness data, chat on WhatsApp, send reminders, and play mood-based workout playlists.</p>
      </section>

      <section className="feature-grid">
        <article className="feature-card glass">
          <h3><Watch size={16} /> Fitness Band Integration</h3>
          <ul className="feature-list">
            <li>Sync steps, heart rate, sleep, calories burned</li>
            <li>Providers: Google Fit / Fitbit</li>
            <li>Last sync: 12 minutes ago</li>
          </ul>
          <button className="btn-primary btn-secondary" type="button" disabled>
            Connect Device (Coming Soon)
          </button>
        </article>

        <article className="feature-card glass">
          <h3><MessageCircle size={16} /> WhatsApp Bot</h3>
          <ul className="feature-list">
            <li>Daily reminders and streak nudges</li>
            <li>Ask diet/workout questions instantly</li>
            <li>Quick updates from your AI coach</li>
          </ul>
          <button className="btn-primary btn-secondary" type="button" disabled>
            Link WhatsApp (Coming Soon)
          </button>
        </article>

        <article className="feature-card glass">
          <h3><Music size={16} /> Gym Music Integration</h3>
          <p style={{ marginBottom: '12px' }}>Get Spotify playlists based on your workout mood:</p>
          <div className="tag-row" style={{ marginBottom: '12px' }}>
            <button
              className="tag"
              style={{ cursor: 'pointer', border: selectedMood === 'cardio' ? '2px solid #22d3ee' : 'none' }}
              onClick={() => handleGetPlaylist('cardio')}
              disabled={isLoadingMusic}
            >
              Cardio 🔥
            </button>
            <button
              className="tag"
              style={{ cursor: 'pointer', border: selectedMood === 'strength' ? '2px solid #22d3ee' : 'none' }}
              onClick={() => handleGetPlaylist('strength')}
              disabled={isLoadingMusic}
            >
              Strength 💪
            </button>
            <button
              className="tag"
              style={{ cursor: 'pointer', border: selectedMood === 'hiit' ? '2px solid #22d3ee' : 'none' }}
              onClick={() => handleGetPlaylist('hiit')}
              disabled={isLoadingMusic}
            >
              HIIT ⚡
            </button>
            <button
              className="tag"
              style={{ cursor: 'pointer', border: selectedMood === 'relax' ? '2px solid #22d3ee' : 'none' }}
              onClick={() => handleGetPlaylist('relax')}
              disabled={isLoadingMusic}
            >
              Relax 🧘
            </button>
            <button
              className="tag"
              style={{ cursor: 'pointer', border: selectedMood === 'yoga' ? '2px solid #22d3ee' : 'none' }}
              onClick={() => handleGetPlaylist('yoga')}
              disabled={isLoadingMusic}
            >
              Yoga 🕉️
            </button>
          </div>
          {isLoadingMusic && <p style={{ opacity: 0.7 }}>Loading playlist...</p>}
          {musicError && <p className="camera-error">{musicError}</p>}
          {musicData && (
            <div style={{ marginTop: '12px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>{musicData.playlist_name}</strong>
                <br />
                <small style={{ opacity: 0.7 }}>Provider: {musicData.provider}</small>
              </p>
              {musicData.playlist_url && (
                <a
                  href={musicData.playlist_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Play size={16} /> Open Playlist
                </a>
              )}
            </div>
          )}
        </article>
      </section>
    </motion.div>
  )
}
