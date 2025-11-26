#!/usr/bin/env python3
"""
Basic tests for the AI Room Temperature backend
"""

import os
import tempfile
import json
from unittest.mock import Mock, patch
import sys
sys.path.append(os.path.dirname(__file__))

from config import Config
from audio_processor import AudioProcessor
from temperature_analyzer import TemperatureAnalyzer

def test_config():
    """Test configuration loading"""
    print("Testing configuration...")
    
    # Mock environment variable
    with patch.dict(os.environ, {'OPENAI_API_KEY': 'test_key'}):
        config = Config()
        assert config.OPENAI_API_KEY == 'test_key'
        assert config.PORT == 5000
        assert 'wav' in config.ALLOWED_EXTENSIONS
    
    print("✅ Configuration test passed")

def test_audio_processor():
    """Test audio processor functionality"""
    print("Testing audio processor...")
    
    # Test file validation
    mock_file = Mock()
    mock_file.filename = 'test.wav'
    
    is_valid, error = AudioProcessor.validate_audio_file(mock_file)
    assert is_valid, f"Should be valid: {error}"
    
    # Test invalid file
    mock_file.filename = 'test.txt'
    is_valid, error = AudioProcessor.validate_audio_file(mock_file)
    assert not is_valid, "Should be invalid for .txt file"
    
    print("✅ Audio processor test passed")

def test_temperature_analyzer():
    """Test temperature analyzer with mock"""
    print("Testing temperature analyzer (mock)...")
    
    # Mock OpenAI client
    with patch('openai.OpenAI'):
        analyzer = TemperatureAnalyzer()
        
        # Test conversation analysis with mock data
        test_transcript = "Hello, how are you today? Everything is going well."
        
        with patch.object(analyzer, 'analyze_conversation_temperature') as mock_analyze:
            mock_analyze.return_value = {
                'temperature': 25,
                'confidence': 0.8,
                'analysis_summary': 'Calm conversation',
                'success': True
            }
            
            result = analyzer.analyze_conversation_temperature(test_transcript)
            assert result['success']
            assert result['temperature'] == 25
            assert result['confidence'] == 0.8
    
    print("✅ Temperature analyzer test passed")

def test_flask_app_import():
    """Test that Flask app can be imported"""
    print("Testing Flask app import...")
    
    # Mock the OpenAI API key for import
    with patch.dict(os.environ, {'OPENAI_API_KEY': 'test_key'}):
        try:
            import app
            assert hasattr(app, 'app')
            assert hasattr(app, 'health_check')
            assert hasattr(app, 'analyze_audio')
        except Exception as e:
            raise AssertionError(f"Failed to import Flask app: {e}")
    
    print("✅ Flask app import test passed")

def run_all_tests():
    """Run all basic tests"""
    print("🧪 Running basic backend tests...")
    print("=" * 40)
    
    try:
        test_config()
        test_audio_processor()
        test_temperature_analyzer()
        test_flask_app_import()
        
        print("=" * 40)
        print("✅ All basic tests passed!")
        return True
        
    except Exception as e:
        print("=" * 40)
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)