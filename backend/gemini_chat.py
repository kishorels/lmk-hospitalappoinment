import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from groq import Groq
from typing import Dict, List

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Health-focused system prompt
HEALTH_SYSTEM_PROMPT = """You are MedBook AI, a helpful and empathetic health assistant. Your role is to:
1. Listen to users describe their symptoms or health concerns
2. Ask clarifying questions to understand better
3. Provide general health information and guidance
4. Suggest what type of specialist they might need
5. Recommend when to seek emergency care

IMPORTANT GUIDELINES:
- Never diagnose conditions definitively - always suggest possibilities
- Encourage users to consult healthcare professionals for proper diagnosis
- Be empathetic and understanding
- For emergency symptoms (chest pain, difficulty breathing, severe bleeding), immediately advise emergency care
- Keep responses concise but informative (2-3 paragraphs max)
- Use simple language that anyone can understand
- Always end with a question to continue the conversation"""

class GroqHealthChat:
    def __init__(self):
        self.api_key = GROQ_API_KEY
        self.client = None
        self.chat_histories: Dict[str, List[dict]] = {}
        
        if self.api_key:
            self.client = Groq(api_key=self.api_key)
            logger.info("Groq AI configured successfully")
        else:
            logger.warning("GROQ_API_KEY not set. Chat will use fallback responses.")
    
    def get_or_create_history(self, user_id: str) -> List[dict]:
        """Get existing chat history or create new one"""
        if user_id not in self.chat_histories:
            self.chat_histories[user_id] = [
                {"role": "system", "content": HEALTH_SYSTEM_PROMPT}
            ]
        return self.chat_histories[user_id]
    
    async def send_message(self, user_id: str, message: str) -> str:
        """Send a message and get AI response"""
        if self.client is None:
            return self._fallback_response(message)
        
        history = self.get_or_create_history(user_id)
        history.append({"role": "user", "content": message})
        
        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # Free, fast, and high quality
                messages=history,
                temperature=0.7,
                max_tokens=500
            )
            
            ai_message = response.choices[0].message.content
            history.append({"role": "assistant", "content": ai_message})
            
            # Keep history manageable (last 20 messages)
            if len(history) > 21:
                self.chat_histories[user_id] = [history[0]] + history[-20:]
            
            return ai_message
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            return "I apologize, but I'm having trouble processing your request right now. Please try again or consult a healthcare professional for immediate concerns."
    
    def _fallback_response(self, message: str) -> str:
        """Basic fallback when Groq is not available"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['emergency', 'chest pain', 'can\'t breathe', 'severe']):
            return "⚠️ If you're experiencing a medical emergency, please call emergency services immediately or go to the nearest hospital."
        
        if any(word in message_lower for word in ['headache', 'head', 'migraine']):
            return "Headaches can have many causes. Common remedies include rest, hydration, and pain relievers. If headaches are severe, frequent, or accompanied by other symptoms, please consult a doctor. Would you like to tell me more about your symptoms?"
        
        if any(word in message_lower for word in ['fever', 'temperature', 'hot']):
            return "Fever is often a sign your body is fighting an infection. Stay hydrated, rest, and monitor your temperature. If it exceeds 103°F (39.4°C) or persists for more than 3 days, please see a doctor. What other symptoms are you experiencing?"
        
        if any(word in message_lower for word in ['cold', 'cough', 'runny nose', 'sneeze']):
            return "Cold symptoms usually resolve within 7-10 days. Rest, fluids, and over-the-counter medications can help. If symptoms worsen or you develop difficulty breathing, seek medical attention. Is there anything specific you'd like advice on?"
        
        return "I understand you have health concerns. While I can provide general guidance, please remember that I'm an AI assistant and cannot provide medical diagnoses. For accurate diagnosis and treatment, please consult a qualified healthcare professional. Can you tell me more about what you're experiencing?"
    
    def clear_session(self, user_id: str):
        """Clear chat history for a user"""
        if user_id in self.chat_histories:
            del self.chat_histories[user_id]

# Singleton instance
health_chat = GroqHealthChat()
