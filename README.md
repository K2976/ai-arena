# AI Arena Gym

A modern gym website built with React + Vite, featuring dynamic content powered by Wikipedia API and AI-powered fitness coaching using Groq.

## Features

### Frontend
- **Dynamic Hero Section** - Eye-catching hero with real gym imagery from Wikipedia
- **Equipment Gallery** - Showcases gym equipment with images and descriptions
- **Exercise Library** - Popular exercises with visual guides
- **Fitness Classes** - Yoga, Pilates, CrossFit, HIIT, Spinning, Zumba
- **Membership Plans** - Pricing cards for Basic, Pro, and Elite
- **Responsive Design** - Works on desktop, tablet, and mobile

### Backend (AI-Powered)
- **Groq AI Chatbot** - Personalized fitness advice powered by Llama 3.3 70B
- **Smart Nutrition Tracking** - 30+ foods database + AI estimation for unknown foods
- **Workout Analysis** - AI-powered form feedback and calorie estimation
- **Personalized Recommendations** - AI workout plans based on goals, sleep, and fatigue
- **CV Workout Tracking** - MediaPipe/OpenCV integration ready
- **Analytics Dashboard** - Track progress, streaks, and consistency
- **Shopping Suggestions** - Diet-specific product recommendations

## Tech Stack

- **Frontend**: React 18 + Vite + Framer Motion
- **Backend**: Django 5.2 + Django REST Framework
- **Database**: Neon PostgreSQL (serverless)
- **AI**: Groq API (Llama 3.3 70B)
- **Auth**: JWT (Simple JWT)
- **Content**: Wikipedia REST API

## Project Structure

```
ai-arena/
├── src/
│   ├── components/           # Reusable UI components
│   ├── pages/                # Page components
│   │   ├── Landing.jsx       # Main gym landing page
│   │   ├── Dashboard.jsx     # User dashboard
│   │   ├── AIChat.jsx        # AI fitness coach
│   │   └── ...
│   └── services/
│       ├── api.js            # Backend API service
│       └── wikipediaApi.js   # Wikipedia API integration
├── backend/
│   ├── apps/core/            # Main Django app
│   │   ├── models.py         # Database models
│   │   ├── views.py          # API views
│   │   ├── services.py       # Groq AI + business logic
│   │   └── serializers.py    # DRF serializers
│   └── beasttrack_backend/   # Django project settings
└── fastapi_service/          # Optional FastAPI microservice
```

## Quick Start

### Frontend

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173

### Backend

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure environment (edit .env with your keys)
cp .env.example .env

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

Backend API: http://localhost:8000/api

## Environment Variables

### Backend (.env)

```env
# Database - Neon PostgreSQL
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# AI - Groq
GROQ_API_KEY=your_groq_api_key

# Django
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup/` | Register new user |
| POST | `/api/auth/login/` | Login with credentials |
| POST | `/api/auth/google/` | Google OAuth login |
| POST | `/api/auth/token/refresh/` | Refresh JWT token |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/api/profile/` | User profile (goal, diet, streak) |
| GET | `/api/dashboard/summary/` | Daily stats summary |
| GET | `/api/dashboard/progress/` | Weekly/monthly progress |

### Workouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/workouts/sessions/` | Workout sessions |
| POST | `/api/workouts/cv/analyze/` | AI workout analysis |
| GET | `/api/workouts/summary/` | Workout stats |

### Nutrition
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/nutrition/search/` | Search food (AI-powered) |
| POST | `/api/nutrition/recognize/` | Food image recognition |
| GET | `/api/nutrition/logs/` | Nutrition history |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/ask/` | **Groq AI chatbot** |
| POST | `/api/recommendations/workout/` | **AI workout plan** |
| GET/POST | `/api/rag/memory/` | RAG memory entries |

### Analytics & Integrations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/consistency/` | Streak analytics |
| GET | `/api/analytics/overview/` | Full analytics |
| GET/POST | `/api/sleep/logs/` | Sleep tracking |
| GET/POST | `/api/integrations/bands/sync/` | Fitness band sync |
| POST | `/api/music/recommend/` | Workout music |
| POST | `/api/shopping/suggestions/` | Shopping suggestions |

## AI Features (Groq-Powered)

### Chat Example
```bash
curl -X POST http://localhost:8000/api/chat/ask/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message":"What workout should I do for muscle gain?"}'
```

Response:
```json
{
  "answer": "Focus on compound lifts like squats, deadlifts, and bench press...",
  "source": "groq_ai"
}
```

### Nutrition Search
```bash
curl -X POST http://localhost:8000/api/nutrition/search/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query":"chicken breast"}'
```

Response:
```json
{
  "result": {
    "food": "Chicken Breast",
    "calories": 165,
    "protein": 31,
    "carbs": 0,
    "fats": 3.6,
    "source": "database"
  }
}
```

## Database Models

- **UserProfile** - Goals, diet type, streak days
- **WorkoutSession** - Exercise, reps, form score, calories
- **NutritionLog** - Food, macros tracking
- **SleepLog** - Sleep hours and quality
- **FitnessBandSync** - Google Fit/Fitbit data
- **RAGMemoryEntry** - AI context memory
- **RecommendationLog** - Workout recommendations
- **ProgressPhoto** - Progress tracking images

## License

MIT
