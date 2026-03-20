import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  Dumbbell,
  Users,
  Trophy,
  Clock,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Star,
  Flame,
  Heart,
  Zap,
  Target,
  ArrowRight
} from 'lucide-react'
import {
  getHeroImage,
  getEquipmentData,
  getExerciseData,
  getClassesData
} from '../services/wikipediaApi'
import CircularGallery from '../components/CircularGallery'
import './Landing.css'

export default function Landing() {
  const [heroImage, setHeroImage] = useState(null)
  const [equipment, setEquipment] = useState([])
  const [exercises, setExercises] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [heroData, equipmentData, exerciseData, classesData] = await Promise.all([
        getHeroImage(),
        getEquipmentData(),
        getExerciseData(),
        getClassesData()
      ])
      setHeroImage(heroData)
      setEquipment(equipmentData)
      setExercises(exerciseData)
      setClasses(classesData)
      setLoading(false)
    }
    fetchData()
  }, [])

  const stats = [
    { icon: Users, value: '5000+', label: 'Active Members' },
    { icon: Dumbbell, value: '150+', label: 'Equipment' },
    { icon: Trophy, value: '25+', label: 'Expert Trainers' },
    { icon: Clock, value: '24/7', label: 'Open Hours' }
  ]

  const membershipPlans = [
    {
      name: 'Basic',
      price: 29,
      features: ['Gym access', 'Locker room', 'Free parking', 'WiFi'],
      popular: false
    },
    {
      name: 'Pro',
      price: 59,
      features: ['All Basic features', 'Group classes', 'Personal trainer (2x/month)', 'Sauna access'],
      popular: true
    },
    {
      name: 'Elite',
      price: 99,
      features: ['All Pro features', 'Unlimited PT sessions', 'Nutrition plan', 'Recovery zone'],
      popular: false
    }
  ]

  const exerciseImageFallbacks = {
    squat: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=1200&q=80',
  }

  const defaultCardImage = 'https://images.unsplash.com/photo-1571732154690-f6d1c3d98a10?auto=format&fit=crop&w=1200&q=80'
  const heroFeatureItems = [
    { image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80', text: 'Real-time AI feedback' },
    { image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80', text: 'Goal-based plans' },
    { image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80', text: 'Recovery insights' },
    { image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80', text: 'Posture tracking' },
    { image: 'https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&w=1200&q=80', text: 'Weekly consistency' },
  ]

  function getEquipmentType(name = '') {
    const value = name.toLowerCase()
    if (value.includes('bike') || value.includes('treadmill') || value.includes('rower')) {
      return 'Cardio'
    }
    if (value.includes('dumbbell') || value.includes('barbell') || value.includes('kettlebell')) {
      return 'Strength'
    }
    if (value.includes('cable') || value.includes('machine')) {
      return 'Machine'
    }
    return 'Gym Essential'
  }

  function formatEquipmentSummary(item) {
    const base = (item?.extract || '').replace(/\s+/g, ' ').trim()
    if (!base) {
      return 'Built for durability, control, and progressive overload training.'
    }

    const lowerName = (item?.name || '').toLowerCase()
    let cleaned = base.replace(/^\s*the\s+/i, '').trim()

    if (lowerName && cleaned.toLowerCase().startsWith(lowerName)) {
      cleaned = cleaned.slice(item.name.length).replace(/^\s*[,.-]?\s*/, '')
    }

    const compact = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
    return compact.length > 92 ? `${compact.slice(0, 92).trim()}...` : compact
  }

  return (
    <motion.div
      className="gym-landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Hero Section */}
      <section className="hero-section">
        <div
          className="hero-bg"
          style={{
            backgroundImage: heroImage?.originalImage
              ? `linear-gradient(135deg, rgba(247, 250, 248, 0.84) 0%, rgba(242, 247, 252, 0.84) 55%, rgba(238, 243, 250, 0.88) 100%), url(${heroImage.originalImage})`
              : heroImage?.thumbnail
                ? `linear-gradient(135deg, rgba(247, 250, 248, 0.84) 0%, rgba(242, 247, 252, 0.84) 55%, rgba(238, 243, 250, 0.88) 100%), url(${heroImage.thumbnail})`
                : 'linear-gradient(135deg, #f7faf8 0%, #edf3fa 100%)'
          }}
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <motion.div
            className="hero-shell"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="hero-copy hero-reveal">
              <span className="hero-badge">
                <Flame size={16} /> Premium Fitness Center
              </span>
              <h1>Transform Your Body,<br />Transform Your Life</h1>
              <p>
                Train with AI-powered coaching, world-class equipment, and expert-led routines designed for sustainable progress.
              </p>
              <div className="hero-actions">
                <Link to="/dashboard" className="btn-primary btn-lg">
                  Start Free Trial <ArrowRight size={18} />
                </Link>
                <Link to="/vision" className="btn-outline btn-lg">
                  Explore Workouts
                </Link>
              </div>
              <div className="hero-gallery-wrap hero-reveal hero-reveal-delay-1">
                <CircularGallery
                  items={heroFeatureItems}
                  bend={2.4}
                  textColor="#2f6fb2"
                  borderRadius={0.06}
                  font="600 14px Sora"
                  scrollSpeed={1.8}
                  scrollEase={0.06}
                />
              </div>
            </div>

            <aside className="hero-preview glass hero-reveal hero-reveal-delay-1">
              <small>Today at ARIZE</small>
              <h3>Smart Session Plan</h3>
              <ul>
                <li>Warm-up mobility: 5 min</li>
                <li>Strength block: 4 exercises</li>
                <li>AI form check: Enabled</li>
                <li>Cooldown + stretch: 5 min</li>
              </ul>
              <div className="hero-preview-footer">
                <span>Estimated duration: 35 to 40 min</span>
                <Link to="/counter" className="btn-primary btn-sm">Open Counter</Link>
              </div>
            </aside>
          </motion.div>
        </div>

        <motion.div
          className="hero-stats glass hero-reveal hero-reveal-delay-2"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="stat-item">
              <stat.icon size={24} className="stat-icon" />
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Equipment Section */}
      <section className="section equipment-section">
        <div className="section-header">
          <span className="section-tag"><Dumbbell size={14} /> Posture</span>
          <h2>AI Posture Correction</h2>
          <p>Improve movement quality with guided cues, controlled form, and smarter training mechanics</p>
        </div>

        <div className="equipment-grid">
          {loading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="equipment-card skeleton">
                <div className="skeleton-img" />
                <div className="skeleton-text" />
              </div>
            ))
          ) : (
            equipment.map((item, index) => (
              <motion.div
                key={item.name}
                className="equipment-card glass"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="equipment-img">
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = defaultCardImage
                      }}
                    />
                  )}
                  <span className="equipment-type">{getEquipmentType(item.name)}</span>
                </div>
                <div className="equipment-card-body">
                  <h4>{item.name}</h4>
                  <p>{formatEquipmentSummary(item)}</p>
                  <div className="equipment-meta-row">
                    <span>Form guidance</span>
                    <span>Progressive load</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Exercises Section */}
      <section className="section exercises-section">
        <div className="section-header">
          <span className="section-tag"><Target size={14} /> Exercises</span>
          <h2>Popular Exercises</h2>
          <p>Master these fundamental movements with our expert guidance</p>
        </div>

        <div className="exercises-grid">
          {loading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="exercise-card skeleton">
                <div className="skeleton-img" />
              </div>
            ))
          ) : (
            exercises.map((item, index) => (
              <motion.a
                key={item.name}
                href={item.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="exercise-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ scale: 1.03 }}
              >
                <div className="exercise-img">
                  <img
                    src={
                      (item.name || '').toLowerCase().includes('squat')
                        ? exerciseImageFallbacks.squat
                        : (item.thumbnail || exerciseImageFallbacks.squat)
                    }
                    alt={item.name}
                    loading="lazy"
                  />
                  <div className="exercise-overlay">
                    <span>Learn More <ChevronRight size={16} /></span>
                  </div>
                </div>
                <div className="exercise-info">
                  <h4>{item.name}</h4>
                </div>
              </motion.a>
            ))
          )}
        </div>
      </section>

      {/* Classes Section */}
      <section className="section classes-section">
        <div className="section-header">
          <span className="section-tag"><Heart size={14} /> Community</span>
          <h2>Group Streak Battles</h2>
          <p>Compete with your crew, maintain momentum, and climb weekly consistency leaderboards</p>
        </div>

        <div className="classes-grid">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="class-card skeleton">
                <div className="skeleton-img tall" />
              </div>
            ))
          ) : (
            classes.map((item, index) => (
              <motion.div
                key={item.name}
                className="class-card"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="class-img">
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = defaultCardImage
                      }}
                    />
                  )}
                </div>
                <div className="class-content">
                  <h4>{item.name}</h4>
                  <p>{item.extract?.substring(0, 100)}...</p>
                  <div className="class-meta">
                    <span><Clock size={14} /> 45 min</span>
                    <span><Zap size={14} /> High Intensity</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Membership Plans */}
      <section className="section pricing-section">
        <div className="section-header">
          <span className="section-tag"><Star size={14} /> Membership</span>
          <h2>Choose Your Plan</h2>
          <p>Flexible plans to fit your fitness journey</p>
        </div>

        <div className="pricing-grid">
          {membershipPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`pricing-card glass ${plan.popular ? 'popular' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              {plan.popular && <span className="popular-badge">Most Popular</span>}
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="currency">$</span>
                <span className="amount">{plan.price}</span>
                <span className="period">/month</span>
              </div>
              <ul className="features-list">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <ChevronRight size={16} /> {feature}
                  </li>
                ))}
              </ul>
              <button className={`btn-${plan.popular ? 'primary' : 'outline'} btn-full`}>
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta-section">
        <motion.div
          className="cta-card glass"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="cta-content">
            <h2>Ready to Start Your Fitness Journey?</h2>
            <p>
              Join today and get a free personal training session.
              No contracts, cancel anytime.
            </p>
            <div className="cta-actions">
              <Link to="/dashboard" className="btn-primary btn-lg">
                Join Now - It's Free
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="gym-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3><Dumbbell size={24} /> ARIZE</h3>
            <p>Your premium fitness destination</p>
          </div>
          <div className="footer-links">
            <h4>Quick Links</h4>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/vision">Classes</Link>
            <Link to="/analytics">Progress</Link>
            <Link to="/chat">AI Coach</Link>
          </div>
          <div className="footer-contact">
            <h4>Contact Us</h4>
            <p><MapPin size={16} /> 123 Fitness Street, NY 10001</p>
            <p><Phone size={16} /> (555) 123-4567</p>
            <p><Mail size={16} /> info@aiarena.gym</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 ARIZE. All rights reserved.</p>
        </div>
      </footer>
    </motion.div>
  )
}
