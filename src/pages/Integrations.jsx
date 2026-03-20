import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Watch, MessageCircle, Music, Link2, Flame, Dumbbell, Zap, Heart, Leaf, Loader2, Play, Pause, Square } from 'lucide-react'
import { getMusicRecommendation } from '../services/api'
import './FeaturePages.css'
import './Integrations.css'

export default function Integrations() {
  const moods = [
    { key: 'cardio', label: 'Cardio', hint: 'High-tempo endurance', icon: Flame },
    { key: 'strength', label: 'Strength', hint: 'Heavy lift focus', icon: Dumbbell },
    { key: 'hiit', label: 'HIIT', hint: 'Explosive intervals', icon: Zap },
    { key: 'relax', label: 'Relax', hint: 'Cooldown and recovery', icon: Heart },
    { key: 'yoga', label: 'Yoga', hint: 'Breath and flow', icon: Leaf },
  ]

  const localMusicFallback = {
    cardio: {
      provider: 'youtube',
      playlist_name: 'Cardio Pulse Mix',
      playlist_url: 'https://www.youtube.com/playlist?list=PLu0ocO48LFms5WsI1ipaeanxqRjn2fC_5',
      embed_url: 'https://www.youtube.com/embed/videoseries?list=PLu0ocO48LFms5WsI1ipaeanxqRjn2fC_5',
      description: 'High-tempo tracks for endurance and steady-state cardio sessions.',
      energy_level: 'high',
    },
    strength: {
      provider: 'youtube',
      playlist_name: 'Heavy Lift Drive',
      playlist_url: 'https://www.youtube.com/playlist?list=PLqrHHabBzX0nY0NU5xFJ6NDYR1R-jopi0',
      embed_url: 'https://www.youtube.com/embed/videoseries?list=PLqrHHabBzX0nY0NU5xFJ6NDYR1R-jopi0',
      description: 'Hard-hitting beats to support compound lifts and max-effort sets.',
      energy_level: 'high',
    },
    hiit: {
      provider: 'youtube',
      playlist_name: 'HIIT Beats',
      playlist_url: 'https://www.youtube.com/playlist?list=PLvUrtI1UFRjHHdov8w04I3jiZEm4ZEUDd',
      embed_url: 'https://www.youtube.com/embed/videoseries?list=PLvUrtI1UFRjHHdov8w04I3jiZEm4ZEUDd',
      description: 'Explosive rhythm and fast transitions for interval blocks.',
      energy_level: 'very-high',
    },
    relax: {
      provider: 'youtube',
      playlist_name: 'Recovery Flow',
      playlist_url: 'https://www.youtube.com/playlist?list=PL3H_P0TG49KmeDNFPPQ04byHCJwxCBpAS',
      embed_url: 'https://www.youtube.com/embed/videoseries?list=PL3H_P0TG49KmeDNFPPQ04byHCJwxCBpAS',
      description: 'Low-intensity chill playlist for cooldown and recovery.',
      energy_level: 'low',
    },
    yoga: {
      provider: 'youtube',
      playlist_name: 'Yoga & Meditation',
      playlist_url: 'https://www.youtube.com/playlist?list=PLebmlkujEtcw-K354Ye5QxpQRbp08UntX',
      embed_url: 'https://www.youtube.com/embed/videoseries?list=PLebmlkujEtcw-K354Ye5QxpQRbp08UntX',
      description: 'Breath-focused ambient and acoustic sound for mindful sessions.',
      energy_level: 'calm',
    },
  }

  const [selectedMood, setSelectedMood] = useState('')
  const [musicData, setMusicData] = useState(null)
  const [isLoadingMusic, setIsLoadingMusic] = useState(false)
  const [musicError, setMusicError] = useState('')
  const [isPlayerActive, setIsPlayerActive] = useState(false)
  const [playerStatus, setPlayerStatus] = useState('idle')
  const [isIframeReady, setIsIframeReady] = useState(false)
  const iframeRef = useRef(null)

  const embedUrl = useMemo(() => {
    if (musicData?.embed_url) {
      return musicData.embed_url
    }

    if (!musicData?.playlist_url) {
      return ''
    }

    try {
      const provider = (musicData.provider || '').toLowerCase()
      const url = new URL(musicData.playlist_url)

      if (provider === 'spotify') {
        const match = url.pathname.match(/playlist\/([a-zA-Z0-9]+)/)
        if (match?.[1]) {
          return `https://open.spotify.com/embed/playlist/${match[1]}?utm_source=generator`
        }
      }

      if (provider === 'youtube') {
        const listId = url.searchParams.get('list')
        if (listId) {
          return `https://www.youtube.com/embed/videoseries?list=${listId}`
        }
      }
    } catch {
      return ''
    }

    return ''
  }, [musicData])

  const handleGetPlaylist = async (mood) => {
    setSelectedMood(mood)
    setIsLoadingMusic(true)
    setMusicError('')
    setMusicData(null)
    setIsPlayerActive(false)
    setPlayerStatus('idle')
    setIsIframeReady(false)

    try {
      const data = await getMusicRecommendation(mood)
      setMusicData(data)
    } catch (error) {
      setMusicData(localMusicFallback[mood] || localMusicFallback.cardio)
      setMusicError('Live API unavailable. Loaded backup playlist.')
    } finally {
      setIsLoadingMusic(false)
    }
  }

  const playerEmbedUrl = useMemo(() => {
    if (!embedUrl) {
      return ''
    }

    try {
      const url = new URL(embedUrl)
      const host = url.hostname.toLowerCase()
      if (host.includes('youtube.com') || host.includes('youtu.be')) {
        url.searchParams.set('enablejsapi', '1')
        url.searchParams.set('playsinline', '1')
        if (typeof window !== 'undefined') {
          url.searchParams.set('origin', window.location.origin)
        }
      }
      return url.toString()
    } catch {
      return embedUrl
    }
  }, [embedUrl])

  const canUseYouTubeControls = playerEmbedUrl.includes('youtube.com/embed')

  const sendYouTubeCommand = (command) => {
    if (!iframeRef.current?.contentWindow) {
      return
    }

    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func: command,
        args: [],
      }),
      '*'
    )
  }

  const handlePlay = () => {
    if (!playerEmbedUrl) {
      return
    }

    setIsPlayerActive(true)
    setPlayerStatus('playing')
    if (canUseYouTubeControls) {
      const delay = isIframeReady ? 0 : 350
      setTimeout(() => sendYouTubeCommand('playVideo'), delay)
    }
  }

  const handlePause = () => {
    if (canUseYouTubeControls) {
      sendYouTubeCommand('pauseVideo')
    }
    setPlayerStatus('paused')
  }

  const handleStop = () => {
    if (canUseYouTubeControls) {
      sendYouTubeCommand('stopVideo')
    }
    setPlayerStatus('idle')
    setIsPlayerActive(false)
  }

  return (
    <motion.div
      className="page-container feature-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <section className="feature-hero glass integrations-hero">
        <div className="feature-badge"><Link2 size={14} /> Connected Experiences</div>
        <h1>Wearables, WhatsApp & Gym Music</h1>
        <p>Sync your ecosystem, automate coaching touchpoints, and launch workout music by training mode.</p>

        <div className="integrations-hero-stats">
          <div className="stat-box">
            <strong>2</strong>
            <small>Integration channels active</small>
          </div>
          <div className="stat-box">
            <strong>5</strong>
            <small>Workout music moods</small>
          </div>
          <div className="stat-box">
            <strong>Live</strong>
            <small>YouTube mood playlists</small>
          </div>
        </div>
      </section>

      <section className="integrations-grid">
        <article className="feature-card glass integrations-card">
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

        <article className="feature-card glass integrations-card">
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

        <article className="feature-card glass integrations-card music-card">
          <div className="music-card-header">
            <h3><Music size={16} /> Gym Music Integration</h3>
            <span className="music-pill">Mood Engine</span>
          </div>
          <p className="music-subtitle">Pick your training mode and instantly launch a music playlist.</p>

          <div className="music-mood-grid">
            {moods.map((mood) => {
              const Icon = mood.icon
              const isActive = selectedMood === mood.key

              return (
                <button
                  key={mood.key}
                  type="button"
                  className={`music-mood-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleGetPlaylist(mood.key)}
                  disabled={isLoadingMusic}
                >
                  <Icon size={14} />
                  <strong>{mood.label}</strong>
                  <small>{mood.hint}</small>
                </button>
              )
            })}
          </div>

          {isLoadingMusic && (
            <div className="music-loading-state">
              <Loader2 size={16} className="spin" />
              <span>Loading playlist...</span>
            </div>
          )}

          {musicError && <p className="camera-error">{musicError}</p>}

          {musicData && (
            <div className="music-result-card">
              <div className="music-result-top">
                <div>
                  <strong>{musicData.playlist_name}</strong>
                  <p>{musicData.description || 'Ready for your session.'}</p>
                </div>
                <div className="music-result-meta">
                  <span>{(musicData.provider || 'music').toUpperCase()}</span>
                  <span>{(musicData.energy_level || 'balanced').toUpperCase()}</span>
                </div>
              </div>

              <div className="music-result-actions">
                <div className="music-player-controls">
                  <button
                    type="button"
                    className="music-play-btn"
                    onClick={handlePlay}
                    disabled={!playerEmbedUrl || playerStatus === 'playing'}
                  >
                    <Play size={14} />
                    <span>{playerStatus === 'playing' ? 'Playing' : 'Play'}</span>
                  </button>
                  <button
                    type="button"
                    className="music-control-btn"
                    onClick={handlePause}
                    disabled={!isPlayerActive || playerStatus !== 'playing'}
                  >
                    <Pause size={14} />
                    <span>Pause</span>
                  </button>
                  <button
                    type="button"
                    className="music-control-btn"
                    onClick={handleStop}
                    disabled={!isPlayerActive}
                  >
                    <Square size={14} />
                    <span>Stop</span>
                  </button>
                </div>
                <span className="music-inline-note">
                  {playerStatus === 'playing' ? 'Now playing. Keep this tab open while you train.' : 'Select Play to start your workout audio.'}
                </span>
              </div>

              {playerEmbedUrl && (
                <div className="music-embed-wrap">
                  <iframe
                    ref={iframeRef}
                    src={playerEmbedUrl}
                    title="Workout music player"
                    loading="lazy"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    tabIndex={-1}
                    onLoad={() => setIsIframeReady(true)}
                  />
                </div>
              )}

              {!playerEmbedUrl && (
                <p className="music-empty">Player preview unavailable for this playlist, but mood recommendation is ready.</p>
              )}
            </div>
          )}

          {!musicData && !isLoadingMusic && !musicError && (
            <p className="music-empty">Select a mood to fetch your playlist.</p>
          )}
        </article>
      </section>
    </motion.div>
  )
}
