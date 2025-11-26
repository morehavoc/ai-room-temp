import os
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import RequestEntityTooLarge

from config import Config
from audio_processor import AudioProcessor
from temperature_analyzer import TemperatureAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = Config.MAX_FILE_SIZE_BYTES

# Configure CORS
CORS(app, 
     origins=Config.CORS_ORIGINS,
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=False)

# Initialize components
audio_processor = AudioProcessor()

# Initialize temperature analyzer with error handling
try:
    temperature_analyzer = TemperatureAnalyzer()
    logger.info("Temperature analyzer initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize temperature analyzer: {str(e)}")
    logger.error("Please check your OpenAI API key in the .env file")
    raise SystemExit(f"Startup failed: {str(e)}")

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'version': '1.0.0'
    })

@app.route('/analyze-audio', methods=['POST'])
def analyze_audio():
    """
    Main endpoint for analyzing audio and returning temperature score.
    
    Expects:
        POST request with multipart/form-data containing 'audio' file
        
    Returns:
        JSON response with temperature analysis
    """
    temp_file_path = None
    
    try:
        logger.info(f"Received audio analysis request from {request.remote_addr}")
        logger.info(f"Request headers: {dict(request.headers)}")
        logger.info(f"Request files: {list(request.files.keys())}")
        logger.info(f"Content type: {request.content_type}")
        
        # Check if audio file is present
        if 'audio' not in request.files:
            logger.warning("No audio file in request")
            return jsonify({
                'error': 'No audio file provided',
                'details': 'Request must include an audio file in the "audio" field',
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }), 400
        
        audio_file = request.files['audio']
        logger.info(f"Received audio file: {audio_file.filename}, size: {audio_file.content_length if hasattr(audio_file, 'content_length') else 'unknown'}")
        
        # Validate the audio file
        is_valid, error_message = audio_processor.validate_audio_file(audio_file)
        if not is_valid:
            logger.warning(f"Audio file validation failed: {error_message}")
            return jsonify({
                'error': 'Invalid audio file',
                'details': error_message,
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }), 400
        
        logger.info(f"Processing audio file: {audio_file.filename}")
        
        # Save audio file temporarily
        try:
            temp_file_path = audio_processor.save_temporary_file(audio_file)
        except Exception as e:
            logger.error(f"Failed to save temporary file: {str(e)}")
            return jsonify({
                'error': 'File processing error',
                'details': 'Failed to process uploaded file',
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }), 500
        
        # Validate audio duration and properties
        is_valid_duration, duration_error, duration = audio_processor.validate_audio_duration(temp_file_path)
        if not is_valid_duration:
            return jsonify({
                'error': 'Invalid audio duration',
                'details': duration_error,
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }), 400
        
        # Prepare audio for transcription
        try:
            processed_file_path = audio_processor.prepare_audio_for_transcription(temp_file_path)
        except Exception as e:
            logger.error(f"Failed to prepare audio: {str(e)}")
            return jsonify({
                'error': 'Audio processing error',
                'details': str(e),
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }), 500
        
        # Get audio metadata
        audio_info = audio_processor.get_audio_info(processed_file_path)
        logger.info(f"Audio info: {audio_info}")
        
        # Analyze the audio file
        try:
            analysis_result = temperature_analyzer.analyze_audio_file(processed_file_path)
        except Exception as e:
            logger.error(f"Analysis failed: {str(e)}")
            return jsonify({
                'error': 'Analysis failed',
                'details': f'Unable to analyze audio: {str(e)}',
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }), 500
        
        # Check if analysis was successful
        if not analysis_result.get('success', False):
            return jsonify({
                'error': 'Analysis incomplete',
                'details': analysis_result.get('error', 'Analysis failed for unknown reason'),
                'temperature': analysis_result.get('temperature', 30),  # Return safe default
                'confidence': analysis_result.get('confidence', 0.1),
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }), 500
        
        # Prepare successful response
        response_data = {
            'temperature': analysis_result['temperature'],
            'confidence': analysis_result['confidence'],
            'analysis_summary': analysis_result['analysis_summary'],
            'timestamp': analysis_result['timestamp'],
            'audio_duration': duration,
            'transcript_length': analysis_result.get('transcript_length', 0)
        }
        
        # Optionally include additional analysis data (for debugging)
        if app.config.get('DEBUG', False):
            response_data.update({
                'topics': analysis_result.get('topics', []),
                'emotional_indicators': analysis_result.get('emotional_indicators', []),
                'audio_info': audio_info,
                'transcript': analysis_result.get('transcript', '')[:500]  # Truncated for debug
            })
        
        logger.info(f"Analysis completed successfully: temperature={response_data['temperature']}")
        return jsonify(response_data)
    
    except RequestEntityTooLarge:
        return jsonify({
            'error': 'File too large',
            'details': f'Maximum file size is {Config.MAX_FILE_SIZE_MB}MB',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 413
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Internal server error',
            'details': 'An unexpected error occurred',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 500
    
    finally:
        # Always clean up temporary files
        if temp_file_path:
            audio_processor.cleanup_file(temp_file_path)

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'details': 'The requested endpoint does not exist',
        'available_endpoints': ['/health', '/analyze-audio'],
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'error': 'Method not allowed',
        'details': 'The HTTP method is not allowed for this endpoint',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'details': 'An unexpected server error occurred',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }), 500

if __name__ == '__main__':
    # Ensure upload directory exists
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    
    logger.info(f"Starting AI Room Temperature server on port {Config.PORT}")
    logger.info(f"Debug mode: {Config.DEBUG}")
    logger.info(f"Max file size: {Config.MAX_FILE_SIZE_MB}MB")
    logger.info(f"Allowed file types: {', '.join(Config.ALLOWED_EXTENSIONS)}")
    logger.info(f"CORS origins: {Config.CORS_ORIGINS}")
    
    # Run the Flask app
    app.run(
        host='0.0.0.0',
        port=Config.PORT,
        debug=Config.DEBUG
    )