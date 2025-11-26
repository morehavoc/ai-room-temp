import logging
from typing import Dict, Optional
from datetime import datetime
import openai
from config import Config

logger = logging.getLogger(__name__)

class TemperatureAnalyzer:
    """Analyzes conversation transcripts to determine 'temperature' score."""
    
    def __init__(self):
        try:
            # Set API key for backwards compatibility
            openai.api_key = Config.OPENAI_API_KEY
            
            # Initialize OpenAI client with explicit API key
            self.client = openai.OpenAI(
                api_key=Config.OPENAI_API_KEY
            )
            
            logger.info("OpenAI client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {str(e)}")
            raise Exception(f"OpenAI initialization failed: {str(e)}. Please check your API key and internet connection.")
    
    def transcribe_audio(self, audio_file_path: str) -> Dict:
        """
        Transcribe audio using OpenAI Whisper.
        
        Returns:
            Dictionary with transcription results
        """
        try:
            logger.info(f"Starting transcription for: {audio_file_path}")
            
            with open(audio_file_path, 'rb') as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model=Config.WHISPER_MODEL,
                    file=audio_file,
                    response_format="json"
                )
            
            # Clean and validate transcript text
            transcript_text = transcript.text.strip() if transcript.text else ""
            
            result = {
                'text': transcript_text,
                'success': True,
                'duration': getattr(transcript, 'duration', None)
            }
            
            logger.info(f"Transcription completed. Length: {len(transcript_text)} characters")
            
            # Check if transcript is meaningful
            if len(transcript_text) < 3:
                logger.warning("Transcription resulted in very short or empty text")
                result['warning'] = 'Very short or empty transcription'
            
            return result
            
        except Exception as e:
            logger.error(f"Transcription error: {str(e)}")
            return {
                'text': '',
                'success': False,
                'error': str(e)
            }
    
    def analyze_conversation_temperature(self, transcript: str) -> Dict:
        """
        Analyze transcript to determine conversation 'temperature'.
        
        Returns:
            Dictionary with temperature analysis results
        """
        transcript = transcript.strip() if transcript else ""
        
        # Handle completely empty transcripts
        if not transcript:
            return {
                'temperature': 20,  # Very low for silence
                'confidence': 0.9,  # High confidence that silence = low temperature
                'analysis_summary': 'No speech detected - silence or background noise only',
                'success': True,
                'topics': [],
                'emotional_indicators': ['silence']
            }
        
        # Handle very short transcripts (likely just noise, coughs, etc.)
        if len(transcript) < 10:
            return {
                'temperature': 22,  # Slightly higher than silence
                'confidence': 0.7,
                'analysis_summary': f'Minimal speech detected: "{transcript[:50]}" - likely background sounds',
                'success': True,
                'topics': [],
                'emotional_indicators': ['minimal_speech']
            }
        
        # Handle short but potentially meaningful transcripts
        if len(transcript) < 30:
            # Check for common non-conversational sounds
            noise_words = ['um', 'uh', 'hmm', 'ah', 'oh', 'mm', 'mhm', 'yeah', 'yep', 'okay', 'ok']
            words = transcript.lower().split()
            
            if len(words) <= 3 and all(word in noise_words for word in words):
                return {
                    'temperature': 24,
                    'confidence': 0.8,
                    'analysis_summary': f'Only filler words detected: "{transcript}" - no meaningful conversation',
                    'success': True,
                    'topics': [],
                    'emotional_indicators': ['filler_words']
                }
            
            # Short but potentially meaningful - analyze with caution
            logger.info(f"Analyzing short transcript: '{transcript}'")
        
        # Proceed with normal analysis for longer transcripts
        
        try:
            logger.info("Starting temperature analysis")
            
            # Construct the analysis prompt
            system_prompt = """You are an expert at analyzing conversation dynamics and emotional temperature.

Your task is to analyze a conversation transcript and rate its "temperature" on a scale of 1-100, where:
- 1-20: Very calm, peaceful discussion
- 21-40: Normal conversation, maybe slightly animated
- 41-60: Moderately heated, some tension or excitement
- 61-80: Quite heated, heated debate, strong emotions
- 81-100: Very hot, angry arguments, shouting, highly controversial

Consider these factors:
1. Emotional intensity (anger, frustration, excitement)
2. Controversial topics (politics, religion, sensitive subjects)
3. Language tone (argumentative, confrontational, heated debate)
4. Interruptions and talking over each other
5. Use of strong language or inflammatory words

Respond with a JSON object containing:
- temperature: integer 1-100
- confidence: float 0.0-1.0 (how confident you are in this score)
- reasoning: brief explanation of your scoring
- topics: list of main topics discussed
- emotional_indicators: list of emotional cues detected

Be objective and consistent in your scoring."""

            user_prompt = f"""Analyze this conversation transcript and rate its temperature:

TRANSCRIPT:
{transcript}

Remember to respond with valid JSON only."""

            response = self.client.chat.completions.create(
                model=Config.GPT_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Lower temperature for more consistent analysis
                max_tokens=500
            )
            
            # Parse the response
            analysis_text = response.choices[0].message.content.strip() if response.choices[0].message.content else ""
            logger.info(f"Raw analysis response: {analysis_text}")
            
            # Handle empty response from GPT
            if not analysis_text:
                logger.warning("GPT returned empty response")
                return {
                    'temperature': 25,
                    'confidence': 0.3,
                    'analysis_summary': 'AI analysis returned empty response - defaulting to neutral temperature',
                    'success': True,
                    'topics': [],
                    'emotional_indicators': ['empty_ai_response']
                }
            
            # Try to parse as JSON
            import json
            try:
                analysis_data = json.loads(analysis_text)
            except json.JSONDecodeError:
                # Fallback: extract temperature from text if JSON parsing fails
                logger.warning("Failed to parse JSON response, attempting text extraction")
                temperature = self._extract_temperature_from_text(analysis_text)
                analysis_data = {
                    'temperature': temperature,
                    'confidence': 0.5,
                    'reasoning': 'Fallback analysis due to JSON parsing error',
                    'topics': [],
                    'emotional_indicators': []
                }
            
            # Validate and clean the data
            result = self._validate_analysis_result(analysis_data, transcript)
            result['success'] = True
            
            logger.info(f"Temperature analysis completed: {result['temperature']}")
            return result
            
        except Exception as e:
            logger.error(f"Analysis error: {str(e)}")
            # Return a safe fallback
            return {
                'temperature': 30,  # Neutral default
                'confidence': 0.2,
                'analysis_summary': f'Analysis failed: {str(e)}',
                'success': False,
                'error': str(e)
            }
    
    def _extract_temperature_from_text(self, text: str) -> int:
        """
        Fallback method to extract temperature from text response.
        """
        import re
        
        # Look for temperature mentions in the text
        temp_patterns = [
            r'temperature[:\s]*(\d+)',
            r'score[:\s]*(\d+)',
            r'rating[:\s]*(\d+)',
            r'(\d+)[/\s]*100',
            r'(\d+)\s*out\s*of\s*100'
        ]
        
        for pattern in temp_patterns:
            match = re.search(pattern, text.lower())
            if match:
                temp = int(match.group(1))
                return max(1, min(100, temp))  # Clamp to valid range
        
        # If no temperature found, estimate based on keywords
        hot_keywords = ['angry', 'heated', 'argument', 'fighting', 'shouting', 'politics', 'controversial']
        cool_keywords = ['calm', 'peaceful', 'quiet', 'normal', 'friendly', 'casual']
        
        hot_count = sum(1 for keyword in hot_keywords if keyword in text.lower())
        cool_count = sum(1 for keyword in cool_keywords if keyword in text.lower())
        
        if hot_count > cool_count:
            return 65
        elif cool_count > hot_count:
            return 25
        else:
            return 40  # Neutral
    
    def _validate_analysis_result(self, analysis_data: Dict, transcript: str) -> Dict:
        """
        Validate and clean analysis results.
        """
        # Ensure temperature is in valid range
        temperature = analysis_data.get('temperature', 40)
        if not isinstance(temperature, (int, float)):
            temperature = 40
        temperature = max(1, min(100, int(temperature)))
        
        # Ensure confidence is in valid range
        confidence = analysis_data.get('confidence', 0.5)
        if not isinstance(confidence, (int, float)):
            confidence = 0.5
        confidence = max(0.0, min(1.0, float(confidence)))
        
        # Create analysis summary
        reasoning = analysis_data.get('reasoning', 'No reasoning provided')
        topics = analysis_data.get('topics', [])
        emotional_indicators = analysis_data.get('emotional_indicators', [])
        
        # Create a concise summary
        analysis_summary = reasoning
        if topics:
            topics_str = ', '.join(topics[:3])  # Limit to first 3 topics
            analysis_summary += f" Topics: {topics_str}."
        if emotional_indicators:
            indicators_str = ', '.join(emotional_indicators[:3])  # Limit to first 3 indicators
            analysis_summary += f" Emotional indicators: {indicators_str}."
        
        # Trim summary if too long
        if len(analysis_summary) > 200:
            analysis_summary = analysis_summary[:197] + "..."
        
        return {
            'temperature': temperature,
            'confidence': confidence,
            'analysis_summary': analysis_summary,
            'topics': topics,
            'emotional_indicators': emotional_indicators,
            'transcript_length': len(transcript),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
    
    def analyze_audio_file(self, audio_file_path: str) -> Dict:
        """
        Complete pipeline: transcribe audio and analyze temperature.
        
        Returns:
            Dictionary with complete analysis results
        """
        logger.info(f"Starting complete audio analysis for: {audio_file_path}")
        
        # Step 1: Transcribe audio
        transcription_result = self.transcribe_audio(audio_file_path)
        
        if not transcription_result['success']:
            return {
                'success': False,
                'error': f"Transcription failed: {transcription_result.get('error', 'Unknown error')}",
                'temperature': 30,  # Safe default
                'confidence': 0.1,
                'analysis_summary': 'Analysis failed due to transcription error'
            }
        
        transcript = transcription_result['text']
        logger.info(f"Transcription successful, analyzing temperature for {len(transcript)} characters")
        
        # Check if transcription had warnings (empty or very short audio)
        if 'warning' in transcription_result:
            logger.info(f"Transcription warning: {transcription_result['warning']}")
        
        # Step 2: Analyze temperature
        temperature_result = self.analyze_conversation_temperature(transcript)
        
        # Combine results
        final_result = {
            'success': temperature_result['success'],
            'temperature': temperature_result['temperature'],
            'confidence': temperature_result['confidence'],
            'analysis_summary': temperature_result['analysis_summary'],
            'transcript': transcript,
            'transcript_length': len(transcript),
            'topics': temperature_result.get('topics', []),
            'emotional_indicators': temperature_result.get('emotional_indicators', []),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        
        if not temperature_result['success']:
            final_result['error'] = temperature_result.get('error', 'Analysis failed')
        
        logger.info(f"Complete analysis finished: temperature={final_result['temperature']}, confidence={final_result['confidence']}")
        return final_result