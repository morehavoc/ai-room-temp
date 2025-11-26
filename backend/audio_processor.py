import os
import tempfile
import logging
from typing import Optional, Tuple
from werkzeug.utils import secure_filename
from pydub import AudioSegment
from config import Config

logger = logging.getLogger(__name__)

class AudioProcessor:
    """Handles audio file processing and validation."""
    
    @staticmethod
    def validate_audio_file(file) -> Tuple[bool, Optional[str]]:
        """
        Validate uploaded audio file.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not file:
            return False, "No audio file provided"
        
        if file.filename == '':
            return False, "No file selected"
        
        if not Config.is_allowed_file(file.filename):
            return False, f"Invalid file format. Supported formats: {', '.join(Config.ALLOWED_EXTENSIONS)}"
        
        # Check file size (approximate, as we haven't saved it yet)
        file.seek(0, 2)  # Seek to end
        size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if size > Config.MAX_FILE_SIZE_BYTES:
            return False, f"File too large. Maximum size: {Config.MAX_FILE_SIZE_MB}MB"
        
        return True, None
    
    @staticmethod
    def save_temporary_file(file) -> str:
        """
        Save uploaded file to a temporary location.
        
        Returns:
            Path to temporary file
        """
        # Create upload directory if it doesn't exist
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        
        # Create secure filename
        filename = secure_filename(file.filename)
        
        # Create temporary file with proper extension
        suffix = f".{filename.rsplit('.', 1)[1].lower()}"
        temp_fd, temp_path = tempfile.mkstemp(
            suffix=suffix,
            dir=Config.UPLOAD_FOLDER
        )
        
        try:
            # Save file to temporary location
            with os.fdopen(temp_fd, 'wb') as tmp_file:
                file.save(tmp_file)
            
            logger.info(f"Saved temporary audio file: {temp_path}")
            return temp_path
            
        except Exception as e:
            # Clean up on error
            try:
                os.close(temp_fd)
                os.unlink(temp_path)
            except:
                pass
            raise e
    
    @staticmethod
    def validate_audio_duration(file_path: str) -> Tuple[bool, Optional[str], Optional[float]]:
        """
        Validate audio duration using pydub.
        
        Returns:
            Tuple of (is_valid, error_message, duration_seconds)
        """
        try:
            audio = AudioSegment.from_file(file_path)
            duration_seconds = len(audio) / 1000.0  # Convert milliseconds to seconds
            
            if duration_seconds > Config.MAX_AUDIO_DURATION_SECONDS:
                return False, f"Audio too long. Maximum duration: {Config.MAX_AUDIO_DURATION_SECONDS} seconds", duration_seconds
            
            if duration_seconds < 1:
                return False, "Audio too short. Minimum duration: 1 second", duration_seconds
            
            logger.info(f"Audio duration: {duration_seconds:.2f} seconds")
            return True, None, duration_seconds
            
        except Exception as e:
            logger.error(f"Error validating audio duration: {str(e)}")
            return False, f"Invalid audio file: {str(e)}", None
    
    @staticmethod
    def cleanup_file(file_path: str) -> None:
        """
        Safely remove temporary file.
        """
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
                logger.info(f"Cleaned up temporary file: {file_path}")
        except Exception as e:
            logger.error(f"Error cleaning up file {file_path}: {str(e)}")
    
    @staticmethod
    def prepare_audio_for_transcription(file_path: str) -> str:
        """
        Prepare audio file for OpenAI Whisper transcription.
        This can include format conversion, normalization, etc.
        
        For now, we'll return the file as-is since OpenAI Whisper
        supports multiple formats.
        
        Returns:
            Path to prepared audio file
        """
        try:
            # Validate the audio file can be loaded
            audio = AudioSegment.from_file(file_path)
            
            # For now, return original file
            # In the future, we might want to:
            # - Convert to a standard format (e.g., WAV)
            # - Normalize audio levels
            # - Remove silence
            # - Apply noise reduction
            
            return file_path
            
        except Exception as e:
            logger.error(f"Error preparing audio for transcription: {str(e)}")
            raise Exception(f"Cannot process audio file: {str(e)}")
    
    @staticmethod
    def get_audio_info(file_path: str) -> dict:
        """
        Extract basic information about the audio file.
        
        Returns:
            Dictionary with audio metadata
        """
        try:
            audio = AudioSegment.from_file(file_path)
            
            return {
                'duration_seconds': len(audio) / 1000.0,
                'channels': audio.channels,
                'frame_rate': audio.frame_rate,
                'sample_width': audio.sample_width,
                'file_size_bytes': os.path.getsize(file_path)
            }
            
        except Exception as e:
            logger.error(f"Error getting audio info: {str(e)}")
            return {}