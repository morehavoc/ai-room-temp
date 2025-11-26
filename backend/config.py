import os
from dotenv import load_dotenv

# Load .env file from the parent directory (project root)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
# Also try loading from current directory as fallback
load_dotenv()

class Config:
    # OpenAI Configuration
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable is required")
    
    # Server Configuration
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Audio Processing Configuration
    MAX_FILE_SIZE_MB = int(os.getenv('MAX_FILE_SIZE', 25))
    MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
    
    # Supported audio formats
    ALLOWED_EXTENSIONS = set([
        'wav', 'mp3', 'm4a', 'flac', 'ogg', 'aac', 'wma', 'webm'
    ])
    
    # Processing limits
    MAX_AUDIO_DURATION_SECONDS = 300  # 5 minutes
    
    # CORS settings
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    
    # Temporary file settings
    UPLOAD_FOLDER = '/tmp/audio_uploads'
    
    # OpenAI model settings
    WHISPER_MODEL = 'whisper-1'
    GPT_MODEL = 'gpt-3.5-turbo'
    
    @staticmethod
    def is_allowed_file(filename):
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS