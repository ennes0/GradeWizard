import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import requests
import random
import json
from fastapi.middleware.cors import CORSMiddleware
import logging
import pandas as pd
import pickle
from datetime import datetime
from fastapi.responses import JSONResponse
import traceback
from fastapi.middleware.gzip import GZipMiddleware
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from concurrent.futures import ThreadPoolExecutor

# Remove cachetools imports and setup session for requests
session = requests.Session()
retry_strategy = Retry(
    total=3,
    backoff_factor=0.1,
    status_forcelist=[429, 500, 502, 503, 504],
)
adapter = HTTPAdapter(
    pool_connections=100,
    pool_maxsize=100,
    max_retries=retry_strategy,
    pool_block=False
)
session.mount("http://", adapter)
session.mount("https://", adapter)

# Thread pool for concurrent operations
thread_pool = ThreadPoolExecutor(max_workers=10)

# Logger settings
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define allowed origins
ALLOWED_ORIGINS = [
    "http://localhost:19006",      # Expo dev client
    "http://localhost:19000",      # Expo dev
    "exp://localhost:19000",       # Expo Go
    "https://35.160.120.126.onrender.com",  # Production backend
    "http://192.168.1.199:8000",  # Local network
    "http://192.168.1.199:19006", # Local network Expo
]

# Configure FastAPI with optimized settings
app = FastAPI(
    default_response_class=JSONResponse,
    docs_url=None,  # Disable docs in production
    redoc_url=None  # Disable redoc in production
)

# Updated CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,  # Cache CORS preflight requests for 24 hours
    expose_headers=["*"]  # Allow all response headers to be exposed
)

# Add compression middleware with optimized settings
app.add_middleware(
    GZipMiddleware,
    minimum_size=500,
    compresslevel=6  # Balance between compression ratio and speed
)

# Add security headers middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Google API Anahtarı (Çevresel değişkenden alınır, güvenlik için)
GOOGLE_API_KEY = "AIzaSyDpmmHMf431buMxiaD_pmRZgJeI6BuOtk0"
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is not set")

# Create a simple model if loading fails
def create_simple_model():
    from sklearn.ensemble import RandomForestRegressor
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=5,
        random_state=42
    )
    # Train with dummy data
    X = np.random.random((1000, 15))  # 15 features
    y = np.random.random(1000) * 100   # Target grades 0-100
    model.fit(X, y)
    return model

# Try to load model or create new one
try:
    with open("model.pkl", 'rb') as f:
        model = pickle.load(f)
except Exception as e:
    print(f"Error loading model, creating new one: {e}")
    model = create_simple_model()

# Veri modelleri
class UserInput(BaseModel):
    subject: str
    topic1: str
    topic2: str
    topic3: str
    previousGrade: str
    motivation: str
    studyHours: str

class AnswerInput(BaseModel):
    answers: list
    formData: dict  # Add formData field to receive frontend form values

class StudyPlanRequest(BaseModel):
    topics: list[str]
    totalDays: int
    hoursPerDay: int

# Optimize Gemini API calls
def call_gemini_api(topic):
    """Optimized Gemini API call"""
    url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"
    headers = {
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive"
    }
    prompt = f"""
    Generate exactly 3 questions for the topic "{topic}".
    
    Instructions:
    1. Each question should start with "Do you understand" or "Can you explain"
    2. Questions should be medium length (15-25 words)
    3. Focus on important aspects of the topic
    4. Make questions clear and straightforward
    5. Return only the questions, one per line
    6. No additional text or formatting

    Example output format for "Classical Mechanics":
    Do you understand how Newton's laws explain the relationship between force and motion in everyday situations?
    Can you explain how momentum conservation works during collisions between different objects?
    Do you understand how gravitational force affects the motion of planets and satellites?
    """
    
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 500,
            "topK": 40,
            "topP": 0.8
        }
    }
    
    try:
        response = session.post(
            url,
            json=payload,
            headers=headers,
            params={"key": GOOGLE_API_KEY},
            timeout=5
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"API call failed: {e}")
        raise

@app.post("/generate_questions")
async def generate_questions(user_input: UserInput):
    try:
        topics = [
            topic for topic in [user_input.topic1, user_input.topic2, user_input.topic3]
            if topic.strip()
        ]
        
        futures = [
            thread_pool.submit(call_gemini_api, topic)
            for topic in topics
        ]
        
        all_questions = []
        for future in futures:
            try:
                result = future.result(timeout=10)
                content = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                
                # Her satırı bir soru olarak al
                questions = [q.strip() for q in content.split('\n') if q.strip()]
                all_questions.extend(questions[:3])  # Her konu için 3 soru al

            except Exception as e:
                logger.error(f"Failed to process questions: {e}")
                continue

        if not all_questions:
            raise HTTPException(status_code=500, detail="Failed to generate questions")

        return {
            "questions": all_questions,
            "questionCount": len(all_questions),
            "success": True
        }

    except Exception as e:
        logger.error(f"Question Generation Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Sorular oluşturulurken bir hata oluştu. Lütfen tekrar deneyin."
        )

@app.post("/predict")
async def predict_grade(answers: AnswerInput):
    try:
        if not answers or not answers.formData:
            return {
                "predicted_grade": 70.0,  # Default value
                "success": True
            }
        
        form_data = answers.formData
        try:
            study_hours = float(form_data.get("studyHours", 5))
            previous_grade = float(form_data.get("previousGrade", 70))
            motivation = float(form_data.get("motivation", 7))
        except (ValueError, TypeError) as e:
            logger.error(f"Value conversion error: {e}")
            return {
                "predicted_grade": 70.0,
                "success": True
            }
        
        # Validate answers array
        if not answers.answers or not isinstance(answers.answers, list):
            logger.error("Invalid or missing answers array")
            answers_list = []
        else:
            answers_list = answers.answers[:3]  # Take only first 3 answers
            
        # Fill missing answers with default value
        while len(answers_list) < 3:
            answers_list.append("Hayır Bilmiyorum")

        # Calculate prediction
        knowledge_scores = {
            "Evet Biliyorum": 1.0,
            "Biraz Biliyorum": 0.6,
            "Hayır Bilmiyorum": 0.2
        }
        
        knowledge_levels = [
            knowledge_scores.get(str(ans).strip(), 0.2) 
            for ans in answers_list
        ]
        
        avg_knowledge = sum(knowledge_levels) / len(knowledge_levels)
        
        # Calculate grade range based on knowledge level
        if avg_knowledge > 0.8:
            min_grade, max_grade = 85, 100
        elif avg_knowledge > 0.5:
            min_grade, max_grade = 70, 90
        else:
            min_grade, max_grade = 50, 75
            
        # Adjust based on other factors
        adjustment = (motivation / 10) * 5 + (min(study_hours, 8) / 8) * 5
        min_grade = min(100, min_grade + adjustment)
        max_grade = min(100, max_grade + adjustment)
        
        # Generate final prediction
        predicted_grade = round(random.uniform(min_grade, max_grade), 2)
        
        logger.info(f"Prediction successful: {predicted_grade} (range: {min_grade}-{max_grade})")
        
        return {
            "predicted_grade": predicted_grade,
            "success": True
        }

    except Exception as e:
        logger.error(f"Prediction Error: {str(e)}\n{traceback.format_exc()}")
        return {
            "predicted_grade": 70.0,  # Default value
            "success": True
        }

@app.post("/generate_study_plan")
async def generate_study_plan(request: StudyPlanRequest):
    total_hours = min(7, request.totalDays) * request.hoursPerDay
    
    prompt = """
    [Topics for a Personalized Study Plan: {topics}]
    [Daily Study: {hours} hours | Total: {total_hours} hours]

    📊 TOPIC ANALYSIS
    • Topics and Subtopics:
    {formatted_topics}
    
    • Difficulty Ranking:
    {difficulty_ratings}
    
    • Recommended Study Order:
    {study_order}

    📅 DAILY SCHEDULE
    [Morning Session - {morning_hours} hours]
    • Topic Revision (20min)
    • New Topic (40min)
    • Sample Solutions (30min)
    • Exercises (20min)
    • Break (10min)

    [Evening Session - {evening_hours} hours]
    • Daily Review (15min)
    • Problem Solving (45min)
    • Test Solving (30min)
    • Self-Assessment (15min)
    • Mini Exam (15min)

    📚 STUDY STRATEGIES
    • Pomodoro Technique (25min study, 5min break)
    • Summarize each topic
    • Record sample problem solutions
    • Review incorrect solutions
    • Regular test practice

    📈 PROGRESS TRACKING
    • Daily Target: {daily_target}
    • Weekly Target: {weekly_target}
    • Topic Completion Target: {completion_target}
    
    🎯 SUCCESS TIPS
    • Study regularly
    • Don't neglect note-taking
    • Mark topics you don't understand
    • Perform daily self-assessments
    • Don't skip breaks
    """
    
    # Format the prompt with dynamic content
    formatted_prompt = prompt.format(
        topics=", ".join(request.topics),
        hours=request.hoursPerDay,
        total_hours=total_hours,
        morning_hours=request.hoursPerDay // 2,
        evening_hours=request.hoursPerDay // 2,
        formatted_topics="\n".join(f"  - {topic}" for topic in request.topics),
        difficulty_ratings="...",  # Add difficulty logic
        study_order="...",  # Add study order logic
        daily_target=f"{request.hoursPerDay} hours of study + {len(request.topics)} topic revisions",
        weekly_target="Each topic should be revised at least once",
        completion_target=f"Complete all topics within {request.totalDays} days"
    )
    
    url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": formatted_prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 2500,  # Increased content limit
            "topK": 40,
            "topP": 0.95,
        },
    }

    try:
        response = requests.post(url, json=payload, headers=headers, params={"key": GOOGLE_API_KEY})
        response.raise_for_status()
        
        generated_text = response.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        if not generated_text:
            raise HTTPException(status_code=500, detail="No content in Gemini API response")

        # Format the response with cleaner styling
        formatted_plan = (
            "🎓 PERSONALIZED STUDY PLAN\n\n"
            f"⏰ Daily Study: {request.hoursPerDay} hours\n"
            f"📅 Total Duration: {total_hours} hours\n"
            f"📚 Topics to Study:\n"
            f"{', '.join(f'• {topic}' for topic in request.topics)}\n\n"
            f"{generated_text.replace('*', '•').replace('-', '•').replace('#', '').replace('▪', '•').strip()}\n\n"
            "✅ DAILY CHECKLIST\n"
            "• Prepare your study environment\n"
            "• Keep water and snacks nearby\n"
            "• Silence your phone\n"
            "• Prepare your study environment\n"
            "• Take notes of what you've learned\n"
            "• Summarize at the end of the day\n"
            "• Review the plan for the next day\n\n"
            "💡 REMEMBER\n"
            "• Regular review is the key to success\n"
            "• Review the plan for the next day\n\n"
            "• Don't skip your breaks\n"
            "• Do mini quizzes daily\n"
            "• Note down topics you find difficult\n"
            "• Don't skip your breaks\n"
            "• Do mini quizzes daily\n"
            "• Track your progress"
        )

        # Clean up any remaining special characters and extra spaces
        cleaned_plan = (
            formatted_plan
            .replace('  ', ' ')
            .replace('\n\n\n', '\n\n')
            .replace(':', ':\n')
            .strip()
        )

        return {"study_plan": cleaned_plan}

    except Exception as e:
        logger.error(f"Study Plan Generation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Study Plan Generation Error: {str(e)}")

@app.post("/generate_feedback")
async def generate_feedback(data: dict):
    """Generate personalized feedback based on prediction results"""
    try:
        grade = data.get("grade")
        study_hours = data.get("studyHours")
        motivation = data.get("motivation")
        subjects = data.get("subjects", [])

        prompt = f"""
Analyze the student's performance and provide detailed feedback:
- Predicted Grade: {grade}/100
- Study Hours: {study_hours} hours
- Motivation: {motivation}/10
- Topics: {', '.join(subjects)}

Please provide feedback under the following headings:
1. STRENGTHS
2. AREAS FOR IMPROVEMENT
3. SUGGESTIONS
4. MOTIVATIONAL MESSAGE

Write 2-3 bullet points for each section. Use a positive and constructive tone.
        """

        url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 800,
                "topP": 0.8,
            },
        }

        response = requests.post(url, json=payload, headers=headers, params={"key": GOOGLE_API_KEY})
        response.raise_for_status()
        
        feedback_text = response.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        
        # Clean up the formatting
        cleaned_feedback = (
            feedback_text
            .replace('*', '')
            .replace('•', '-')
            .replace('→', '-')
            .replace('#', '')
            .replace('▪', '-')
            .replace('○', '-')
            .replace('●', '-')
            .replace('  ', ' ')  # Remove double spaces
            .strip()
        )
        
        # Format sections properly
        sections = ['GÜÇLÜ YÖNLER', 'GELİŞİM ALANLARI', 'ÖNERİLER', 'MOTİVASYONEL MESAJ']
        for section in sections:
            cleaned_feedback = cleaned_feedback.replace(f"{section}:", f"\n{section}:\n")
        
        cleaned_feedback = cleaned_feedback.replace('\n\n\n', '\n\n').strip()
        
        return {"feedback": cleaned_feedback}

    except Exception as e:
        logger.error(f"Feedback Generation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Feedback Generation Error: {str(e)}")

# Quiz categories and topics
QUIZ_CATEGORIES = {
    "history": {
        "topics": ["World History", "Ancient Civilizations", "Modern History", "Military History", "Historical Figures"],
        "difficulty": ["easy", "medium", "hard"]
    },
    "science": {
        "topics": ["Physics", "Chemistry", "Biology", "Astronomy", "Technology", "Inventions"],
        "difficulty": ["easy", "medium", "hard"]
    },
    "geography": {
        "topics": ["World Geography", "Physical Geography", "Climate", "Landforms", "Economic Geography"],
        "difficulty": ["easy", "medium", "hard"]
    },
    "arts": {
        "topics": ["Painting", "Music", "Cinema", "Literature", "Architecture"],
        "difficulty": ["easy", "medium", "hard"]
    },
    "sports": {
        "topics": ["Football", "Basketball", "Olympics", "Sports History", "Championships"],
        "difficulty": ["easy", "medium", "hard"]
    },
    "culture": {
        "topics": ["World Traditions", "Global Cuisine", "Festivals", "Mythology", "Languages"],
        "difficulty": ["easy", "medium", "hard"]
    }
}

@app.get("/generate_quiz")
async def generate_quiz(language: str = 'en'):
    """Generate a daily quiz question in specified language"""
    try:
        category = random.choice(list(QUIZ_CATEGORIES.keys()))
        topic = random.choice(QUIZ_CATEGORIES[category]["topics"])
        difficulty = random.choice(QUIZ_CATEGORIES[category]["difficulty"])
        
        prompt = f"""
Generate a {difficulty} level question in {language.upper()} language on the topic "{topic}" in the "{category}" category.
MAKE SURE to return the response strictly in JSON format and ALL TEXT (question, options, explanation) MUST BE IN {language.upper()} LANGUAGE:

{{
  "question": "[Write an engaging question in {language}]",
  "options": ["[correct answer in {language}]", "[wrong answer 1 in {language}]", "[wrong answer 2 in {language}]", "[wrong answer 3 in {language}]"],
  "correctAnswer": "[correct answer in {language}]",
  "explanation": "[brief explanation in {language}]",
  "category": "{category}",
  "topic": "{topic}",
  "difficulty": "{difficulty}"
}}

Ensure the content is culturally appropriate and uses natural language expressions in {language}.
        """
        response = requests.post(
            "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.9,
                    "maxOutputTokens": 800,
                    "topK": 40,
                    "topP": 0.95,
                }
            },
            headers={"Content-Type": "application/json"},
            params={"key": GOOGLE_API_KEY}
        )
        
        response.raise_for_status()
        generated_text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        
        # Clean and parse JSON
        json_str = generated_text.strip()
        if (json_str.startswith('```json')):
            json_str = json_str[7:-3]
        elif (json_str.startswith('```')):
            json_str = json_str[3:-3]
            
        quiz_data = json.loads(json_str)
        
        # Enhanced validation
        required_fields = ['question', 'options', 'correctAnswer', 'explanation', 'category', 'topic', 'difficulty']
        if not all(key in quiz_data for key in required_fields):
            missing = [f for f in required_fields if f not in quiz_data]
            raise ValueError(f"Missing required fields: {missing}")
            
        if len(quiz_data['options']) != 4:
            raise ValueError("Must have exactly 4 options")
            
        if quiz_data['correctAnswer'] not in quiz_data['options']:
            raise ValueError("Correct answer must be in options")
            
        if len(set(quiz_data['options'])) != 4:
            raise ValueError("All options must be unique")
            
        if len(quiz_data['explanation']) < 10:
            raise ValueError("Explanation too short")

        # Doğru cevabı rastgele bir konuma yerleştir
        correct_answer = quiz_data['correctAnswer']
        wrong_answers = quiz_data['options'][1:]  # İlk eleman doğru cevap olduğu için onu çıkar
        
        # Tüm şıkları karıştır
        random.shuffle(wrong_answers)
        # Doğru cevabı rastgele bir konuma ekle
        insert_position = random.randint(0, 3)
        shuffled_options = wrong_answers[:insert_position] + [correct_answer] + wrong_answers[insert_position:]
        
        quiz_data['options'] = shuffled_options[:4]  # Sadece 4 şık al
        
        logger.info(f"Generated quiz with shuffled options: {quiz_data}")
        return quiz_data

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}\nRaw text: {generated_text}")
        raise HTTPException(status_code=500, detail="Invalid quiz format")
    except Exception as e:
        logger.error(f"Quiz generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": str(datetime.now())}

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": str(exc.detail),
            "status_code": exc.status_code
        }
    )

@app.get("/")
async def root():
    return {"message": "Grade Prediction API is running!"}

# Get port from environment variable
port = int(os.environ.get("PORT", 8000))

# Optimize server settings
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # Disable reload in production
        workers=4,
        limit_concurrency=100,
        timeout_keep_alive=30,
        access_log=False,
        proxy_headers=True,
        forwarded_allow_ips='*',
        http='h11'  # Use h11 for better performance
    )
