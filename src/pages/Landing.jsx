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
              ? `url(${heroImage.originalImage})`
              : heroImage?.thumbnail
                ? `url(${heroImage.thumbnail})`
                : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          }}
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="hero-badge">
              <Flame size={16} /> Premium Fitness Center
            </span>
            <h1>Transform Your Body,<br />Transform Your Life</h1>
            <p>
              Join the ultimate fitness experience with state-of-the-art equipment,
              expert trainers, and a community that pushes you to be your best.
            </p>
            <div className="hero-actions">
              <Link to="/dashboard" className="btn-primary btn-lg">
                Start Free Trial <ArrowRight size={18} />
              </Link>
              <Link to="/vision" className="btn-outline btn-lg">
                View Classes
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Stats */}
        <motion.div
          className="hero-stats glass"
          initial={{ y: 50, opacity: 0 }}
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
          <span className="section-tag"><Dumbbell size={14} /> Equipment</span>
          <h2>World-Class Equipment</h2>
          <p>Train with the best equipment from leading fitness brands</p>
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
                    <img src={item.thumbnail} alt={item.name} loading="lazy" />
                  )}
                </div>
                <h4>{item.name}</h4>
                <p>{item.extract?.substring(0, 80)}...</p>
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
                  {item.thumbnail && (
                    <img src={item.thumbnail} alt={item.name} loading="lazy" />
                  )}
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
          <span className="section-tag"><Heart size={14} /> Classes</span>
          <h2>Group Fitness Classes</h2>
          <p>Join our high-energy classes led by certified instructors</p>
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
                    <img src={item.thumbnail} alt={item.name} loading="lazy" />
                  )}
                </div>
                <div className="class-content">
                  <h4>{item.name}</h4>
                  <p>{item.extract?.substring(0, 100)}...</p>
                  <div className="class-meta">
                    <span><Clock size={14} /> 45 min</span>
                    <span><Zap size={14} /> High Intensity</span>
                  </div>
                  <Link to="/vision" className="btn-primary btn-sm">
                    Book Class
                  </Link>
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
            <h3><Dumbbell size={24} /> AI Arena Gym</h3>
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
          <p>&copy; 2026 AI Arena Gym. All rights reserved.</p>
        </div>
      </footer>
    </motion.div>
  )
}
