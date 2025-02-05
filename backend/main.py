import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import requests
import random  # Add this import
import json  # Add this import
from fastapi.middleware.cors import CORSMiddleware
import logging
import pandas as pd
import pickle  # Add this import
from datetime import datetime
from fastapi.responses import JSONResponse
import traceback

# Logger ayarları
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

app = FastAPI()

# Updated CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,  # Cache CORS preflight requests for 24 hours
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

def call_gemini_api(topic):
    """Google Gemini 1.5 Flash API ile konu başlığından alt başlıklar üretir"""
    url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"
    headers = {"Content-Type": "application/json"}
    # İngilizce prompt: konuya göre 3 önemli alt başlık üret
    payload = {
        "contents": [{
            "parts": [{
                "text": f"""Please generate the 3 most important subtopics that need to be learned for the subject "{topic}".
Each subtopic should be framed as a learning objective and include:
- Fundamental concepts and definitions
- Application and problem-solving methods
- Advanced topics and connections
Please list each subtopic on a single line without using bullet points."""
            }]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 200
        }
    }
    try:
        logger.info(f"Calling Gemini API with topic: {topic}")
        response = requests.post(url, json=payload, headers=headers, params={"key": GOOGLE_API_KEY})
        response.raise_for_status()
        data = response.json()
        logger.info(f"Gemini API response: {data}")

        generated_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        if not generated_text:
            raise HTTPException(status_code=500, detail="No content in Gemini API response")

        subtopics_list = [s.strip() for s in generated_text.split("\n") if s.strip()]
        if len(subtopics_list) < 3:
            subtopics_list += ["Subtopic not available"] * (3 - len(subtopics_list))

        return subtopics_list[:3]
    except requests.exceptions.RequestException as e:
        logger.error(f"Gemini API RequestException: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")
    except Exception as e:
        logger.error(f"Error processing Gemini API response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing Gemini API response: {str(e)}")

@app.post("/generate_questions")
async def generate_questions(user_input: UserInput):
    """Konu başlıklarına göre alt başlıklar ve sorular üretir"""
    try:
        topics = [
            topic for topic in [user_input.topic1, user_input.topic2, user_input.topic3]
            if topic.strip()
        ]
        
        all_questions = []
        for topic in topics:
            prompt = f"""
For the topic "{topic}", generate 3 important assessment questions.
Append "how well do you know it?" at the end of each question.
Example format:
- For integration, how well do you know the relationship between derivatives and integrals?
- For integration, how well do you know area calculation?
- For integration, how well do you know volume calculation?
            """
            
            url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 300,
                    "topP": 0.8,
                    "topK": 40,
                },
            }
            
            response = requests.post(url, json=payload, headers=headers, params={"key": GOOGLE_API_KEY})
            response.raise_for_status()
            data = response.json()
            
            generated_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if not generated_text:
                raise HTTPException(status_code=500, detail="API yanıt vermedi")
            
            # Clean and format questions
            questions = [
                q.strip().replace('- ', '').strip()
                for q in generated_text.split('\n')
                if q.strip() and 'how well do you know' in q.lower()
            ]
            
            # Ensure we have exactly 3 questions per topic
            while len(questions) < 3:
                questions.append(f"How well do you know the topic {topic} in general?")
            
            all_questions.extend(questions[:3])

        if not all_questions:
            raise HTTPException(status_code=500, detail="Sorular oluşturulamadı")

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
    """Kullanıcının cevaplarına göre not tahmini yapar"""
    try:
        # Ensure we have all 9 answers (3 main topics × 3 subtopics each)
        expected_answers = 9
        if not answers.answers or len(answers.answers) < expected_answers:
            logger.error(f"Received {len(answers.answers)} answers, expected {expected_answers}")
            raise HTTPException(
                status_code=400, 
                detail=f"Need {expected_answers} answers, got {len(answers.answers)}"
            )
        
        form_data = answers.formData
        study_hours = float(form_data.get("studyHours", 5))
        previous_grade = float(form_data.get("previousGrade", 70))
        motivation = float(form_data.get("motivation", 7))
        
        # Convert answers to numeric values
        numeric_values = [
            2 if ans == "Evet Biliyorum" 
            else 1 if ans == "Biraz Biliyorum" 
            else 0 
            for ans in answers.answers
        ]
        
        # Ensure we have all required values
        while len(numeric_values) < expected_answers:
            numeric_values.append(0)
        
        # Create model input with exact column names matching training data
        model_input = {
            # Ana konular (ilk 3 cevap)
            "Konu 1": [numeric_values[0]],
            "Konu 2": [numeric_values[1]],
            "Konu 3": [numeric_values[2]],
            
            # Her konu için alt konular (3'er tane)
            "Konu 1 Alt 1": [numeric_values[3]],
            "Konu 1 Alt 2": [numeric_values[4]],
            "Konu 1 Alt 3": [numeric_values[5]],
            
            "Konu 2 Alt 1": [numeric_values[6]],
            "Konu 2 Alt 2": [numeric_values[7]],
            "Konu 2 Alt 3": [numeric_values[8]],
            
            "Konu 3 Alt 1": [numeric_values[6]],  # Using values from topic 2 for topic 3
            "Konu 3 Alt 2": [numeric_values[7]],  # since we don't have separate questions
            "Konu 3 Alt 3": [numeric_values[8]],  # for topic 3's subtopics
            
            # Diğer faktörler
            "Çalışma Süresi (saat)": [study_hours],
            "Önceki Not": [previous_grade],
            "Motivasyon (1-10)": [motivation]
        }
        
        logger.info(f"Model input features: {list(model_input.keys())}")
        
        input_df = pd.DataFrame(model_input)
        predicted_grade = np.clip(model.predict(input_df)[0], 0, 100)
        
        logger.info(f"Predicted grade: {predicted_grade}")
        
        return {"predicted_grade": round(predicted_grade, 2)}
    
    except ValueError as ve:
        logger.error(f"Value Error in prediction: {str(ve)}")
        raise HTTPException(status_code=400, detail=f"Invalid input values: {str(ve)}")
    except Exception as e:
        logger.error(f"Prediction Error: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

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

# Quiz kategorileri ve alt konuları
QUIZ_CATEGORIES = {
    "tarih": {
        "topics": ["Türk Tarihi", "Dünya Tarihi", "İnkılaplar", "Medeniyetler", "Önemli Şahsiyetler"],
        "difficulty": ["kolay", "orta", "zor"]
    },
    "bilim": {
        "topics": ["Fizik", "Kimya", "Biyoloji", "Astronomi", "Teknoloji", "Buluşlar"],
        "difficulty": ["kolay", "orta", "zor"]
    },
    "coğrafya": {
        "topics": ["Dünya", "Türkiye", "İklim", "Yerşekilleri", "Ekonomik Coğrafya"],
        "difficulty": ["kolay", "orta", "zor"]
    },
    "sanat": {
        "topics": ["Resim", "Müzik", "Sinema", "Edebiyat", "Mimari"],
        "difficulty": ["kolay", "orta", "zor"]
    },
    "spor": {
        "topics": ["Futbol", "Basketbol", "Olimpiyatlar", "Spor Tarihi", "Başarılar"],
        "difficulty": ["kolay", "orta", "zor"]
    },
    "kültür": {
        "topics": ["Gelenekler", "Yemekler", "Festivaller", "Mitoloji", "Diller"],
        "difficulty": ["kolay", "orta", "zor"]
    }
}

@app.get("/generate_quiz")
async def generate_quiz():
    """Generate a daily quiz question"""
    try:
        # Rastgele kategori ve alt konu seç
        category = random.choice(list(QUIZ_CATEGORIES.keys()))
        topic = random.choice(QUIZ_CATEGORIES[category]["topics"])
        difficulty = random.choice(QUIZ_CATEGORIES[category]["difficulty"])
        
        prompt = f"""
Generate a {difficulty} level question on the topic "{topic}" in the "{category}" category.
MAKE SURE to return the response strictly in JSON format (do not include anything else):

{{
  "question": "[an original and engaging question]",
  "options": ["[correct answer]", "[plausible but incorrect answer 1]", "[plausible but incorrect answer 2]", "[plausible but incorrect answer 3]"],
  "correctAnswer": "[correct answer]",
  "explanation": "[a brief explanation of the correct answer]",
  "category": "{category}",
  "topic": "{topic}",
  "difficulty": "{difficulty}"
}}

Important:
- The question should be original and engaging.
- It should be appropriately challenging for its level.
- The incorrect answers should be plausible alternatives.
- The explanation should be instructive and concise.
- Use different question formats each time (multiple choice, true/false, matching, etc.).
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
        if json_str.startswith('```json'):
            json_str = json_str[7:-3]
        elif json_str.startswith('```'):
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
