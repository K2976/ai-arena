import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Upload, Apple, ShoppingCart, Loader } from 'lucide-react'
import { fetchFoodEstimate, getShoppingSuggestions } from '../services/api'
import './FeaturePages.css'

export default function AppStore() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [nutritionData, setNutritionData] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [shoppingSuggestions, setShoppingSuggestions] = useState([])
  const [isLoadingShopping, setIsLoadingShopping] = useState(false)

  const handleFoodSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setErrorMessage('')
    setNutritionData(null)

    try {
      const data = await fetchFoodEstimate(searchQuery)
      setNutritionData(data.result)
    } catch (error) {
      setErrorMessage(error.message || 'Failed to fetch nutrition data')
    } finally {
      setIsSearching(false)
    }
  }

  const handleLoadShoppingSuggestions = async (preference) => {
    setIsLoadingShopping(true)
    try {
      const data = await getShoppingSuggestions(preference)
      setShoppingSuggestions(data.suggestions || [])
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load shopping suggestions')
    } finally {
      setIsLoadingShopping(false)
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
        <div className="feature-badge"><Apple size={14} /> Food Recognition + Nutrition AI</div>
        <h1>Nutrition Intelligence</h1>
        <p>Search for any food item to get instant calorie and macro estimates powered by AI.</p>
      </section>

      <section className="feature-grid">
        <article className="feature-card glass">
          <h3><Search size={16} /> Food Search</h3>
          <form className="inline-form" onSubmit={handleFoodSearch}>
            <input
              placeholder="Search food (paneer, oats, chicken breast...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSearching}
            />
            <button className="btn-primary" type="submit" disabled={isSearching}>
              {isSearching ? <Loader size={16} /> : 'Search'}
            </button>
          </form>
          {errorMessage && <p className="camera-error">{errorMessage}</p>}
        </article>

        <article className="feature-card glass">
          <h3>Nutrition Output</h3>
          {nutritionData ? (
            <>
              <p style={{ marginBottom: '12px' }}>
                <strong>{nutritionData.food}</strong> (per 100g)
                <br />
                <small style={{ opacity: 0.7 }}>Source: {nutritionData.source}</small>
              </p>
              <div className="feature-stats">
                <div className="stat-box"><strong>Calories</strong><small>{nutritionData.calories} kcal</small></div>
                <div className="stat-box"><strong>Protein</strong><small>{nutritionData.protein} g</small></div>
                <div className="stat-box"><strong>Carbs</strong><small>{nutritionData.carbs} g</small></div>
                <div className="stat-box"><strong>Fats</strong><small>{nutritionData.fats} g</small></div>
              </div>
            </>
          ) : (
            <>
              <p style={{ marginBottom: '12px', opacity: 0.7 }}>Search for a food item to see nutrition data</p>
              <div className="feature-stats">
                <div className="stat-box"><strong>Calories</strong><small>-- kcal</small></div>
                <div className="stat-box"><strong>Protein</strong><small>-- g</small></div>
                <div className="stat-box"><strong>Carbs</strong><small>-- g</small></div>
                <div className="stat-box"><strong>Fats</strong><small>-- g</small></div>
              </div>
            </>
          )}
        </article>

        <article className="feature-card glass">
          <h3><Upload size={16} /> Upload Food Image</h3>
          <p>Image inference pipeline detects likely food item and serving size estimate.</p>
          <button className="btn-primary btn-secondary" type="button" disabled>
            Choose Image (Coming Soon)
          </button>
        </article>

        <article className="feature-card glass">
          <h3><ShoppingCart size={16} /> Smart Shopping Integration</h3>
          <p>Get personalized shopping suggestions based on your dietary preferences:</p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              className="btn-primary btn-secondary"
              type="button"
              onClick={() => handleLoadShoppingSuggestions('vegetarian')}
              disabled={isLoadingShopping}
            >
              Vegetarian
            </button>
            <button
              className="btn-primary btn-secondary"
              type="button"
              onClick={() => handleLoadShoppingSuggestions('vegan')}
              disabled={isLoadingShopping}
            >
              Vegan
            </button>
            <button
              className="btn-primary btn-secondary"
              type="button"
              onClick={() => handleLoadShoppingSuggestions('non_veg')}
              disabled={isLoadingShopping}
            >
              Non-Veg
            </button>
          </div>
          {shoppingSuggestions.length > 0 && (
            <ul className="feature-list">
              {shoppingSuggestions.map((item, index) => (
                <li key={index}>
                  <strong>{item.title}</strong> ({item.category})
                  {item.external_url && (
                    <a href={item.external_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '8px' }}>
                      View
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </motion.div>
  )
}
