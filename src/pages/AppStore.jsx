import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, Upload, Apple, Loader, Camera, X, ShoppingCart } from 'lucide-react'
import { fetchFoodEstimateGroq, recognizeFood } from '../services/api'
import ShoppingChat from '../components/ShoppingChat'
import './FeaturePages.css'

export default function AppStore() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [nutritionData, setNutritionData] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  // Image upload states
  const [imagePreview, setImagePreview] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleFoodSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setErrorMessage('')
    setStatusMessage('')
    setNutritionData(null)

    try {
      const data = await fetchFoodEstimateGroq(searchQuery)
      setNutritionData(data.result)
      setStatusMessage('Groq calorie estimate loaded.')
    } catch (error) {
      setErrorMessage(error.message || 'Failed to fetch nutrition data')
    } finally {
      setIsSearching(false)
    }
  }

  // Image upload handlers
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      setCameraActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      setErrorMessage('Camera not accessible. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
    }
    setCameraActive(false)
    setImagePreview(null)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      context.drawImage(videoRef.current, 0, 0)
      const imageData = canvasRef.current.toDataURL('image/jpeg')
      setImagePreview(imageData)
      uploadImage(imageData)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageData = event.target?.result
        setImagePreview(imageData)
        uploadImage(imageData)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (imageData) => {
    setImageLoading(true)
    setErrorMessage('')
    setStatusMessage('')
    try {
      const response = await recognizeFood(imageData)
      if (response.recognition) {
        setNutritionData({
          food: response.recognition.detected_food,
          calories: response.recognition.calories,
          protein: response.recognition.protein,
          carbs: response.recognition.carbs,
          fats: response.recognition.fats,
          source: response.recognition.source || 'image_recognition'
        })
        setStatusMessage('Image analyzed successfully.')
      }
      stopCamera()
    } catch (error) {
      setErrorMessage(error.message || 'Failed to analyze food image')
    } finally {
      setImageLoading(false)
    }
  }

  // Loading skeleton for image
  const ImageLoadingSkeleton = () => (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
        <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Analyzing image...</span>
      </div>
      <p style={{ fontSize: '0.85rem', color: '#999' }}>This may take a few seconds</p>
    </div>
  )

  return (
    <motion.div
      className="page-container feature-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero Section */}
      <section className="feature-hero glass">
        <div className="feature-badge"><Apple size={14} /> Nutrition & Shopping Intelligence</div>
        <h1>Nutrition Intelligence</h1>
        <p>Search food calories, analyze images, and discover products with AI assistance.</p>
        <Link to="/shopping-cart" className="btn-primary" style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingCart size={16} /> Open Cart
        </Link>
      </section>

      {/* Food Search Section */}
      <section className="nutrition-section">
        <h2>Food Search</h2>
        <article className="feature-card glass">
          <p style={{ marginBottom: '12px', fontSize: '0.9rem', color: '#666' }}>Search for any food item to get calorie estimates powered by Groq API</p>
          <form className="inline-form" onSubmit={handleFoodSearch}>
            <input
              placeholder="Search food (paneer, oats, chicken breast...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSearching}
            />
            <button className="btn-primary" type="submit" disabled={isSearching}>
              {isSearching ? <Loader size={16} /> : <Search size={16} />}
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>
          {isSearching && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', opacity: 0.85 }}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Fetching calories from AI service...</span>
            </div>
          )}
        </article>
      </section>

      {/* Image Recognition Section */}
      <section className="image-recognition-section">
        <h2>Food Image Recognition</h2>
        <article className="feature-card glass">
          <p style={{ marginBottom: '12px', fontSize: '0.9rem', color: '#666' }}>Capture or upload a food image to get AI-powered nutrition analysis</p>

          {imageLoading && <ImageLoadingSkeleton />}

          {cameraActive && !imageLoading && (
            <div style={{ marginBottom: '12px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  className="btn-primary"
                  onClick={capturePhoto}
                  style={{ flex: 1 }}
                >
                  Capture Photo
                </button>
                <button
                  className="btn-primary btn-secondary"
                  onClick={stopCamera}
                  style={{ flex: 1 }}
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          )}

          {imagePreview && !cameraActive && !imageLoading && (
            <div style={{ marginBottom: '12px', borderRadius: '8px', overflow: 'hidden' }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{ width: '100%', height: 'auto', maxHeight: '200px', objectFit: 'cover' }}
              />
            </div>
          )}

          {!imageLoading && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {!cameraActive && (
                <>
                  <button
                    className="btn-primary btn-secondary"
                    onClick={startCamera}
                    style={{ flex: 1 }}
                  >
                    <Camera size={16} /> Take Photo
                  </button>
                  <button
                    className="btn-primary btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ flex: 1 }}
                  >
                    <Upload size={16} /> Choose File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </>
              )}
            </div>
          )}
        </article>
      </section>

      {/* Nutrition Output Section - Only show when has data */}
      {nutritionData && (
        <section className="nutrition-output-section">
          <h2>Nutrition Information</h2>
          <article className="feature-card glass">
            <p style={{ marginBottom: '12px' }}>
              <strong>{nutritionData.food}</strong> (per 100g)
              <br />
              <small style={{ opacity: 0.7, fontSize: '0.85rem' }}>
                Source: {
                  nutritionData.source === 'image_recognition'
                    ? 'Image Recognition'
                    : nutritionData.source === 'groq_calories'
                      ? 'Groq API'
                      : 'Database Search'
                }
              </small>
            </p>
            <div className="feature-stats">
              <div className="stat-box"><strong>Calories</strong><small>{nutritionData.calories} kcal</small></div>
              <div className="stat-box"><strong>Protein</strong><small>{nutritionData.protein} g</small></div>
              <div className="stat-box"><strong>Carbs</strong><small>{nutritionData.carbs} g</small></div>
              <div className="stat-box"><strong>Fats</strong><small>{nutritionData.fats} g</small></div>
            </div>
            {nutritionData.source === 'groq_calories' && (
              <p style={{ marginTop: '10px', fontSize: '0.85rem', opacity: 0.8 }}>
                AI returned calories directly. Macro values are not provided for this search.
              </p>
            )}
          </article>
        </section>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div style={{
          background: '#fee',
          border: '1px solid #fcc',
          color: '#c33',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '0.9rem'
        }}>
          {errorMessage}
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div style={{
          background: '#ecfdf3',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '0.9rem',
          marginTop: '10px'
        }}>
          {statusMessage}
        </div>
      )}

      {/* Smart Shopping - AI Chat Section */}
      <section className="shopping-section">
        <h2>Smart Shopping with AI</h2>
        <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#666' }}>
          Ask the AI directly. Example: "give me diet coke". The assistant uses Groq + Wikipedia and replies with product cards including image, add to cart, and buy links.
        </p>
        <article className="feature-card glass" style={{ padding: 0, borderRadius: '12px', overflow: 'hidden' }}>
          <ShoppingChat />
        </article>
      </section>
    </motion.div>
  )
}
