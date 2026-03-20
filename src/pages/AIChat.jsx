import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Brain, Sparkles, Send, BarChart4, Trash2, Save } from 'lucide-react'
import { sendChatMessage, getWorkoutRecommendation } from '../services/api'
import './FeaturePages.css'
import './AIChat.css'

export default function AIChat() {
  const [chatHistory, setChatHistory] = useState([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [saveHistory, setSaveHistory] = useState(false)
  const [recommendationLoading, setRecommendationLoading] = useState(false)
  const [inputs, setInputs] = useState({
    sleep_hours: 7,
    fatigue: 50,
    performance: 70,
    streak: 3,
  })
  const [recommendationData, setRecommendationData] = useState({
    readiness_percent: 72,
    mode: 'light',
    sleep_quality: 'moderate',
    streak_trend: 'stable',
    action: '35 min light + mobility',
    source: 'initial'
  })

  const askAi = async () => {
    if (!question.trim()) return
    setLoading(true)

    try {
      const result = await sendChatMessage(question)
      const newEntry = {
        id: Date.now(),
        question,
        answer: result.answer,
        source: result.source || 'groq_ai',
        timestamp: new Date().toLocaleTimeString()
      }
      const nextHistory = [...chatHistory, newEntry]
      setChatHistory(nextHistory)
      if (saveHistory) {
        localStorage.setItem('beasttrack_ai_history', JSON.stringify(nextHistory))
      }
      setQuestion('')
    } catch (error) {
      const errorEntry = {
        id: Date.now(),
        question,
        answer: 'AI service is unavailable. Please check backend env/API keys and try again.',
        source: 'error',
        timestamp: new Date().toLocaleTimeString()
      }
      const nextHistory = [...chatHistory, errorEntry]
      setChatHistory(nextHistory)
      if (saveHistory) {
        localStorage.setItem('beasttrack_ai_history', JSON.stringify(nextHistory))
      }
      setQuestion('')
    } finally {
      setLoading(false)
    }
  }

  const loadRecommendation = async () => {
    setRecommendationLoading(true)
    try {
      const result = await getWorkoutRecommendation(inputs)
      setRecommendationData(result)
    } catch (error) {
      // keep previous value if API fails
    } finally {
      setRecommendationLoading(false)
    }
  }

  useEffect(() => {
    loadRecommendation()
  }, [])

  useEffect(() => {
    if (!saveHistory) return
    const saved = localStorage.getItem('beasttrack_ai_history')
    if (saved) {
      try {
        setChatHistory(JSON.parse(saved))
      } catch {
        // ignore invalid local history
      }
    }
  }, [saveHistory])

  const clearHistory = () => {
    if (window.confirm('Clear chat history?')) {
      setChatHistory([])
      localStorage.removeItem('beasttrack_ai_history')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      askAi()
    }
  }

  const quickPrompts = [
    'Why am I not improving?',
    'What should I do today?',
    'Give me a vegetarian high-protein meal plan',
  ]

  const runQuickPrompt = (prompt) => {
    setQuestion(prompt)
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
        <div className="feature-badge"><Brain size={14} /> RAG Personal Intelligence Layer</div>
        <h1>AI Chatbot + Recommendation Engine</h1>
        <p>Personalized answers using workout, sleep, food history + embeddings + daily readiness scoring.</p>
      </section>

      <section className="ai-top-grid">
        <article className="feature-card glass">
          <h3><Bot size={16} /> Smart Answers</h3>
          <div className="ai-quick-grid">
            {quickPrompts.map((prompt) => (
              <button key={prompt} className="ai-quick-btn" onClick={() => runQuickPrompt(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
          <small>RAG context: workout logs + nutrition + sleep + streak + recent fatigue.</small>
        </article>

        <article className="feature-card glass">
          <h3><BarChart4 size={16} /> AI Workout Recommendation (Gymnasium)</h3>
          <div className="ai-input-grid">
            <label>Sleep (hours)
              <input type="range" min="3" max="10" value={inputs.sleep_hours} onChange={(e) => setInputs({ ...inputs, sleep_hours: Number(e.target.value) })} />
              <span>{inputs.sleep_hours}h</span>
            </label>
            <label>Fatigue
              <input type="range" min="0" max="100" value={inputs.fatigue} onChange={(e) => setInputs({ ...inputs, fatigue: Number(e.target.value) })} />
              <span>{inputs.fatigue}/100</span>
            </label>
            <label>Performance
              <input type="range" min="0" max="100" value={inputs.performance} onChange={(e) => setInputs({ ...inputs, performance: Number(e.target.value) })} />
              <span>{inputs.performance}/100</span>
            </label>
            <label>Streak (days)
              <input type="number" min="0" max="60" value={inputs.streak} onChange={(e) => setInputs({ ...inputs, streak: Number(e.target.value) || 0 })} />
            </label>
          </div>

          <div className="feature-stats">
            <div className="stat-box"><strong>Readiness: {Math.round(recommendationData.readiness_percent || 0)}%</strong><small>Sleep + fatigue model</small></div>
            <div className="stat-box"><strong>Mode: {String(recommendationData.mode || 'moderate').replace('_', ' ')}</strong><small>Auto-selected intensity</small></div>
          </div>
          <ul className="feature-list">
            <li>Sleep quality: {recommendationData.sleep_quality || 'moderate'}</li>
            <li>Streak trend: {recommendationData.streak_trend || 'stable'}</li>
            <li>Action: {recommendationData.action || 'No action available'}</li>
          </ul>
          {!!recommendationData.ai_recommendation && (
            <p className="ai-reco-text">{recommendationData.ai_recommendation}</p>
          )}
          <button
            className="btn-primary"
            type="button"
            onClick={loadRecommendation}
            disabled={recommendationLoading}
          >
            {recommendationLoading ? 'Loading...' : 'Refresh Recommendation'}
          </button>
        </article>
      </section>

      <section className="ai-chat-section">
        <article className="feature-card glass" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}><Sparkles size={16} style={{ marginRight: '8px' }} /> Ask ARIZE AI</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', opacity: 0.7 }}>
                <input
                  type="checkbox"
                  checked={saveHistory}
                  onChange={(e) => setSaveHistory(e.target.checked)}
                />
                Save History
              </label>
              {chatHistory.length > 0 && (
                <button
                  className="btn-primary btn-secondary"
                  onClick={clearHistory}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <Trash2 size={12} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="ai-chat-history">
              {chatHistory.map((entry) => (
                <div key={entry.id} className="ai-chat-entry">
                  <div className="ai-chat-meta">
                    <strong className="ai-user-label">You</strong>
                    <span>{entry.timestamp}</span>
                  </div>
                  <p className="ai-user-question">{entry.question}</p>
                  <div className="ai-chat-meta">
                    <strong className="ai-bot-label">ARIZE AI</strong>
                    <span className="ai-source-pill">{entry.source === 'groq_ai' ? 'Groq API' : entry.source}</span>
                  </div>
                  <p className="ai-bot-answer">{entry.answer}</p>
                </div>
              ))}
            </div>
          )}

          {/* Input Form */}
          <div className="inline-form">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything about your fitness... (Enter to send, Shift+Enter for new line)"
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
            <button className="btn-primary" type="button" onClick={askAi} disabled={loading}>
              {loading ? 'Thinking...' : 'Ask AI'} <Send size={14} />
            </button>
          </div>

          {/* Empty State */}
          {chatHistory.length === 0 && (
            <p style={{ textAlign: 'center', opacity: 0.6, fontSize: '14px', marginTop: '16px' }}>
              No conversations yet. Start by asking ARIZE AI a question!
            </p>
          )}
        </article>
      </section>
    </motion.div>
  )
}
