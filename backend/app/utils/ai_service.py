"""
AI Service Layer - Handles all AI model interactions
Supports: Dummy AI (mock), Llama 3.1 8B (Ollama), Llama 3.1 70B (Ollama)
"""

import requests
import json
import re
import random
from typing import Dict, Any, List, Optional
from datetime import datetime


class AIService:
    """
    Unified interface for AI inference across different providers.
    
    Supported providers:
    - 'dummy': Mock AI responses (for testing)
    - 'ollama-8b': Llama 3.1 8B via Ollama (local, free)
    - 'ollama-70b': Llama 3.1 70B via Ollama (local, requires GPU)
    """
    
    # Available providers
    PROVIDERS = {
        'dummy': 'Dummy AI (Mock responses)',
        'ollama-8b': 'Llama 3.1 8B (Ollama, local)',
        'ollama-70b': 'Llama 3.1 70B (Ollama, requires GPU)'
    }
    
    def __init__(self, provider: str = "ollama-8b"):
        """
        Initialize AI service.
        
        Args:
            provider: 'dummy', 'ollama-8b', or 'ollama-70b'
        """
        if provider not in self.PROVIDERS:
            raise ValueError(
                f"Unknown provider: {provider}. "
                f"Must be one of: {list(self.PROVIDERS.keys())}"
            )
        
        self.provider = provider
        
        # Ollama configuration
        self.ollama_url = "http://localhost:11434/api/generate"
        
        # Map providers to Ollama model names
        self.model_map = {
            'ollama-8b': 'llama3.1:8b',
            'ollama-70b': 'llama3.1:70b'
        }
    
    def get_provider_name(self) -> str:
        """Get human-readable provider name."""
        return self.PROVIDERS.get(self.provider, self.provider)
    
    def analyze_case(
        self,
        case_text: str,
        question: str,
        context: str = "",
        answer_type: str = "text",
        answer_options: Optional[List[str]] = None,
        feedback_examples: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Analyze a court case using AI.
        
        Args:
            case_text: Full opinion text
            question: Research question to answer
            context: Project/module context
            answer_type: 'yes_no', 'multiple_choice', 'integer', 'date', 'text'
            answer_options: List of options for multiple_choice
            feedback_examples: List of previous corrections for in-context learning
        
        Returns:
            {
                'answer': str,
                'reasoning': str,
                'confidence': float (0.0-1.0),
                'tokens_used': int,
                'cost': float,
                'model_used': str
            }
        """
        if self.provider == 'dummy':
            return self._analyze_with_dummy(
                case_text, question, answer_type, answer_options
            )
        elif self.provider.startswith('ollama-'):
            return self._analyze_with_ollama(
                case_text, question, context, answer_type,
                answer_options, feedback_examples
            )
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")
    
    # ==================== DUMMY AI ====================
    
    def _analyze_with_dummy(
        self,
        case_text: str,
        question: str,
        answer_type: str,
        answer_options: Optional[List[str]]
    ) -> Dict[str, Any]:
        """Generate mock AI responses for testing."""
        
        # Generate dummy answer based on type
        if answer_type == "yes_no":
            answer = random.choice(["Yes", "No"])
            reasoning = f"The court opinion {'does' if answer == 'Yes' else 'does not'} appear to address this issue based on the language used."
        
        elif answer_type == "multiple_choice" and answer_options:
            answer = random.choice(answer_options)
            reasoning = f"Based on the opinion text, '{answer}' appears most relevant to the research question."
        
        elif answer_type == "integer":
            answer = str(random.randint(0, 10))
            reasoning = f"The opinion mentions this {answer} time(s) based on keyword analysis."
        
        elif answer_type == "date":
            year = random.randint(2020, 2024)
            month = random.randint(1, 12)
            day = random.randint(1, 28)
            answer = f"{year}-{month:02d}-{day:02d}"
            reasoning = f"The date {answer} appears in the opinion text in relation to this question."
        
        else:  # text
            templates = [
                "The court addressed this by focusing on constitutional principles.",
                "The opinion discusses this issue in the context of precedent.",
                "The court's reasoning centers on statutory interpretation.",
                "This is analyzed through the lens of jurisdictional authority."
            ]
            answer = random.choice(templates)
            reasoning = "This conclusion is drawn from the overall argumentation in the opinion."
        
        # Random confidence
        confidence = round(random.uniform(0.65, 0.95), 2)
        
        # Mock token count
        tokens_used = random.randint(800, 1500)
        
        return {
            'answer': answer,
            'reasoning': reasoning,
            'confidence': confidence,
            'tokens_used': tokens_used,
            'cost': 0.0,
            'model_used': 'dummy-ai-v1',
            'timestamp': datetime.utcnow().isoformat()
        }
    
    # ==================== OLLAMA ====================
    
    def _build_prompt(
        self,
        case_text: str,
        question: str,
        context: str,
        answer_type: str,
        answer_options: Optional[List[str]],
        feedback_examples: Optional[List[Dict]]
    ) -> str:
        """Build structured prompt for Ollama analysis."""
        
        # Truncate case text if too long
        max_case_length = 4000
        if len(case_text) > max_case_length:
            case_text = case_text[:max_case_length] + "\n\n[...case text truncated...]"
        
        prompt_parts = [
            "You are a legal AI assistant analyzing court opinions.",
            ""
        ]
        
        # Add context
        if context:
            prompt_parts.extend([
                "PROJECT CONTEXT:",
                context,
                ""
            ])
        
        # Add feedback examples (in-context learning)
        if feedback_examples and len(feedback_examples) > 0:
            prompt_parts.extend([
                "PREVIOUS CORRECTIONS - Learn from these mistakes:",
                ""
            ])
            
            for i, example in enumerate(feedback_examples[:10], 1):
                prompt_parts.extend([
                    f"Example {i}:",
                    f"  Wrong answer: {example.get('wrong_answer', 'N/A')}",
                    f"  Correct answer: {example.get('correct_answer', 'N/A')}",
                    f"  Reason: {example.get('correction_reason', 'N/A')}",
                    ""
                ])
        
        # Add research question
        prompt_parts.extend([
            "RESEARCH QUESTION:",
            question,
            ""
        ])
        
        # Add answer format instructions
        if answer_type == "yes_no":
            prompt_parts.extend([
                "ANSWER FORMAT:",
                "Your answer must be exactly 'Yes' or 'No'.",
                ""
            ])
        elif answer_type == "multiple_choice" and answer_options:
            options_str = ", ".join(f'"{opt}"' for opt in answer_options)
            prompt_parts.extend([
                "ANSWER FORMAT:",
                f"Choose exactly ONE from: {options_str}",
                ""
            ])
        elif answer_type == "integer":
            prompt_parts.extend([
                "ANSWER FORMAT:",
                "Provide a single integer number.",
                ""
            ])
        elif answer_type == "date":
            prompt_parts.extend([
                "ANSWER FORMAT:",
                "Provide a date in YYYY-MM-DD format.",
                ""
            ])
        else:
            prompt_parts.extend([
                "ANSWER FORMAT:",
                "Provide a clear, concise answer (1-3 sentences).",
                ""
            ])
        
        # Add case text
        prompt_parts.extend([
            "COURT OPINION TO ANALYZE:",
            case_text,
            "",
            "INSTRUCTIONS:",
            "1. Carefully read the court opinion",
            "2. Answer based ONLY on the opinion text",
            "3. Provide reasoning citing specific parts",
            "4. Rate confidence from 0.0 to 1.0",
            "",
            "Respond in this EXACT format:",
            "ANSWER: [your answer]",
            "REASONING: [explain why, cite the opinion]",
            "CONFIDENCE: [0.0 to 1.0]"
        ])
        
        return "\n".join(prompt_parts)
    
    def _analyze_with_ollama(
        self,
        case_text: str,
        question: str,
        context: str,
        answer_type: str,
        answer_options: Optional[List[str]],
        feedback_examples: Optional[List[Dict]]
    ) -> Dict[str, Any]:
        """Call local Ollama API for inference."""
        
        # Check if 70B is requested but not available
        if self.provider == 'ollama-70b':
            try:
                # Try to verify model exists
                check_response = requests.get(
                    "http://localhost:11434/api/tags",
                    timeout=5
                )
                models = check_response.json().get('models', [])
                model_names = [m.get('name', '') for m in models]
                
                if 'llama3.1:70b' not in model_names:
                    raise Exception(
                        "Llama 3.1 70B model not found. "
                        "Please download it first: ollama pull llama3.1:70b"
                    )
            except:
                raise Exception(
                    "Llama 3.1 70B not available. "
                    "Download with: ollama pull llama3.1:70b"
                )
        
        # Build prompt
        prompt = self._build_prompt(
            case_text, question, context, answer_type,
            answer_options, feedback_examples
        )
        
        # Get model name
        ollama_model = self.model_map[self.provider]
        
        # Call Ollama API
        try:
            response = requests.post(
                self.ollama_url,
                json={
                    "model": ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 500,
                        "top_p": 0.9
                    }
                },
                timeout=120
            )
            
            response.raise_for_status()
            result = response.json()
            
        except requests.exceptions.ConnectionError:
            raise Exception(
                "Cannot connect to Ollama. "
                "Make sure Ollama is running (it should auto-start). "
                "Check Task Manager for 'ollama.exe'."
            )
        except requests.exceptions.Timeout:
            raise Exception("Ollama request timed out after 2 minutes.")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Ollama API error: {str(e)}")
        
        # Extract response
        ai_text = result.get('response', '').strip()
        
        if not ai_text:
            raise Exception("Ollama returned empty response")
        
        # Parse response
        parsed = self._parse_ai_response(ai_text, answer_type, answer_options)
        
        # Get token count
        tokens_used = result.get('eval_count', 0) + result.get('prompt_eval_count', 0)
        
        return {
            'answer': parsed['answer'],
            'reasoning': parsed['reasoning'],
            'confidence': parsed['confidence'],
            'tokens_used': tokens_used,
            'cost': 0.0,
            'model_used': ollama_model,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _parse_ai_response(
        self,
        ai_text: str,
        answer_type: str,
        answer_options: Optional[List[str]]
    ) -> Dict[str, Any]:
        """Parse AI response into structured format."""
        
        # Extract ANSWER
        answer_match = re.search(
            r'ANSWER:\s*(.+?)(?:\n|$)',
            ai_text,
            re.IGNORECASE
        )
        answer = answer_match.group(1).strip() if answer_match else "Unable to determine"
        
        # Extract REASONING
        reasoning_match = re.search(
            r'REASONING:\s*(.+?)(?:\nCONFIDENCE:|$)',
            ai_text,
            re.IGNORECASE | re.DOTALL
        )
        reasoning = reasoning_match.group(1).strip() if reasoning_match else "No reasoning provided"
        reasoning = re.sub(r'\s+', ' ', reasoning).strip()
        
        # Extract CONFIDENCE
        confidence_match = re.search(
            r'CONFIDENCE:\s*([\d.]+)',
            ai_text,
            re.IGNORECASE
        )
        
        if confidence_match:
            try:
                confidence = float(confidence_match.group(1))
                confidence = max(0.0, min(1.0, confidence))
            except ValueError:
                confidence = 0.5
        else:
            confidence = 0.5
        
        # Validate answer
        answer = self._validate_answer(answer, answer_type, answer_options)
        
        return {
            'answer': answer,
            'reasoning': reasoning,
            'confidence': confidence
        }
    
    def _validate_answer(
        self,
        answer: str,
        answer_type: str,
        answer_options: Optional[List[str]]
    ) -> str:
        """Validate and clean answer based on type."""
        
        if answer_type == "yes_no":
            if re.search(r'\byes\b', answer, re.IGNORECASE):
                return "Yes"
            elif re.search(r'\bno\b', answer, re.IGNORECASE):
                return "No"
            return "Unable to determine"
        
        elif answer_type == "multiple_choice" and answer_options:
            if answer in answer_options:
                return answer
            
            for option in answer_options:
                if option.lower() == answer.lower():
                    return option
            
            for option in answer_options:
                if option.lower() in answer.lower() or answer.lower() in option.lower():
                    return option
            
            return "Unable to determine"
        
        elif answer_type == "integer":
            numbers = re.findall(r'-?\d+', answer)
            if numbers:
                return numbers[0]
            return "0"
        
        elif answer_type == "date":
            date_match = re.search(r'(\d{4})-(\d{2})-(\d{2})', answer)
            if date_match:
                return date_match.group(0)
            return "Unable to determine"
        
        if len(answer) > 500:
            answer = answer[:500] + "..."
        
        return answer


# Global instance - will be updated based on user selection
_ai_service_instance = None

def get_ai_service(provider: str = "ollama-8b") -> AIService:
    """
    Get AI service instance with specified provider.
    
    Args:
        provider: 'dummy', 'ollama-8b', or 'ollama-70b'
    
    Returns:
        AIService instance
    """
    global _ai_service_instance
    
    # Create new instance if provider changed
    if _ai_service_instance is None or _ai_service_instance.provider != provider:
        _ai_service_instance = AIService(provider=provider)
    
    return _ai_service_instance