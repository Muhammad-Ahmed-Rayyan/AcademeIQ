import os
import time
import asyncio
from typing import AsyncGenerator, List, Dict
from google import genai
from google.genai import types

# System prompt outlining the personality, rules, and functions of AcademeIQ
SYSTEM_PROMPT = """You are AcademeIQ, a personal academic concierge agent designed for university students. 
You act as a knowledgeable, supportive, and precise academic peer—not a generic corporate assistant. 

Your core rules of engagement:
1. SECURITY & CONFIRMATION: Never execute any write action (such as sending an email, creating calendar events, or deleting/modifying Google Drive files) without showing a structured preview and explicitly asking for approval first. 
2. STRUCTURED ANSWERS: When the user asks for summaries of deadlines, emails, or schedules, present them in clear, structured lists or tables. Use markdown formatting to make the content readable and premium.
3. PERSONALITY: Be direct, clear, and academically focused. Do not use emojis in your responses. Keep responses concise and practical. 
4. CLARIFICATION: If a request is vague, ask clarifying questions instead of guessing.

Currently, you are in Phase 2 (Chat & Integration shell). In this phase, you are simulating or executing chat requests. Maintain conversation context using the provided history.
"""

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        # Determine if we should run in mock mode
        self.is_mock = not self.api_key or "your_gemini" in self.api_key.lower()
        self.client = None

        if not self.is_mock:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Error initializing Gemini client: {e}. Falling back to mock mode.")
                self.is_mock = True

    async def generate_chat_stream(self, history: List[Dict[str, str]], new_message: str) -> AsyncGenerator[str, None]:
        """
        Generates a streaming response for the chat conversation.
        """
        if self.is_mock:
            # Yield simulation text in chunks to mimic typing
            mock_responses = {
                "hello": f"Hello! I am AcademeIQ, your academic concierge. How can I help you manage your courses or calendar today?",
                "deadline": f"Searching your calendar and emails...\n\nI found the following upcoming deadlines:\n- **Computer Vision Assignment 2**: Due on July 4, 2026 (Critical - 2 days remaining)\n- **KBS Quiz 3**: Due on July 8, 2026\n\nWould you like me to schedule a study plan block for these?",
                "study plan": f"Sure! Let's build a study plan for your upcoming exams. \n\nI can allocate 2 hours every evening, avoiding your existing classes. Should I proceed and draft a proposal for Google Calendar?",
                "email": f"I can help you draft an email to your professor. For example:\n\n**Subject:** [CS 401] Extension Request - assignment 2\n\n**Body:**\nDear Dr. Ahmed,\nI hope you are doing well. I am writing to request a brief 2-day extension on Assignment 2 due to a project deadline conflict. Thank you for your consideration.\n\nSincerely,\n[Your Name]\n\nWould you like me to save this as a draft in your Gmail?"
            }

            # Simple keyword matching for mock responses
            lower_msg = new_message.lower()
            response_text = mock_responses["hello"]
            for key, val in mock_responses.items():
                if key in lower_msg:
                    response_text = val
                    break

            # Stream words with slight delays
            words = response_text.split(" ")
            for i, word in enumerate(words):
                yield word + (" " if i < len(words) - 1 else "")
                await asyncio.sleep(0.04) # Simulate network streaming speed
            return

        # Real Gemini API flow
        try:
            # Format history for Gemini SDK
            # Gemini expects a list of types.Content or simple dicts: {'role': 'user'|'model', 'parts': [{'text': ...}]}
            contents = []
            for h in history:
                role = "user" if h.get("sender") == "user" else "model"
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=h.get("text", ""))]
                    )
                )
            
            # Add new user message
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=new_message)]
                )
            )

            # Generate stream
            response = self.client.models.generate_content_stream(
                model="gemini-2.5-flash",
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.7,
                )
            )

            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    # Small yield yield delay
                    await asyncio.sleep(0.01)

        except Exception as e:
            error_msg = f"\n\n[Error calling Gemini API: {str(e)}. Switching to local simulation.]\n\n"
            yield error_msg
            # Fallback mock response
            yield "It seems there was an issue communicating with the Gemini server. Let me know if you would like me to perform this action offline."
