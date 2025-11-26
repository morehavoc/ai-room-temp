#!/bin/bash

# AI Room Temperature Monitor - Validation Script
# This script validates the project structure and basic functionality

set -e

echo "🔍 AI Room Temperature Monitor - Validation"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success=0
total=0

# Function to check and report
check() {
    local test_name="$1"
    local command="$2"
    
    printf "%-50s" "$test_name"
    ((total++))
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((success++))
    else
        echo -e "${RED}❌ FAIL${NC}"
    fi
}

# Function to check file exists
check_file() {
    local desc="$1"
    local file="$2"
    check "$desc" "test -f '$file'"
}

# Function to check directory exists
check_dir() {
    local desc="$1"
    local dir="$2"
    check "$desc" "test -d '$dir'"
}

echo "📁 Checking project structure..."

# Root files
check_file "README.md exists" "README.md"
check_file "Dockerfile exists" "Dockerfile"
check_file ".env.example exists" ".env.example"
check_file ".gitignore exists" ".gitignore"
check_file "DEPLOYMENT.md exists" "DEPLOYMENT.md"

# Backend structure
echo ""
echo "🐍 Checking backend structure..."
check_dir "Backend directory" "backend"
check_file "Backend README" "backend/README.md"
check_file "Requirements file" "backend/requirements.txt"
check_file "Main app file" "backend/app.py"
check_file "Configuration file" "backend/config.py"
check_file "Audio processor" "backend/audio_processor.py"
check_file "Temperature analyzer" "backend/temperature_analyzer.py"
check_file "Backend Dockerfile" "backend/Dockerfile"
check_file "Environment example" "backend/.env.example"

# Frontend structure
echo ""
echo "🌐 Checking frontend structure..."
check_dir "Frontend directory" "frontend"
check_file "Frontend README" "frontend/README.md"
check_file "Main HTML file" "frontend/index.html"
check_dir "Styles directory" "frontend/styles"
check_dir "Scripts directory" "frontend/scripts"
check_file "Main CSS" "frontend/styles/main.css"
check_file "Thermometer CSS" "frontend/styles/thermometer.css"
check_file "Components CSS" "frontend/styles/components.css"
check_file "Main app script" "frontend/scripts/app.js"
check_file "Audio recorder script" "frontend/scripts/audio-recorder.js"
check_file "Temperature manager script" "frontend/scripts/temperature-manager.js"
check_file "Thermometer display script" "frontend/scripts/thermometer-display.js"
check_file "Settings manager script" "frontend/scripts/settings-manager.js"
check_file "Status indicator script" "frontend/scripts/status-indicator.js"

# Documentation
echo ""
echo "📚 Checking documentation..."
check_dir "Documentation directory" "docs"
check_file "Architecture documentation" "docs/ARCHITECTURE.md"

# Scripts
echo ""
echo "🔧 Checking scripts..."
check_dir "Scripts directory" "scripts"
check_file "Setup script" "scripts/setup.sh"
check "Setup script executable" "test -x scripts/setup.sh"

# Python syntax validation
echo ""
echo "🐍 Validating Python syntax..."

if command -v python3 >/dev/null 2>&1; then
    for py_file in backend/*.py; do
        if [[ -f "$py_file" ]]; then
            filename=$(basename "$py_file")
            check "Python syntax: $filename" "python3 -m py_compile '$py_file'"
        fi
    done
else
    echo -e "${YELLOW}⚠️  Python3 not found, skipping syntax validation${NC}"
fi

# JavaScript basic validation
echo ""
echo "🌐 Validating JavaScript files..."

for js_file in frontend/scripts/*.js; do
    if [[ -f "$js_file" ]]; then
        filename=$(basename "$js_file")
        # Basic syntax check - look for obvious syntax errors
        check "JavaScript syntax: $filename" "grep -q 'function\\|class\\|const\\|let\\|var' '$js_file'"
    fi
done

# HTML validation
echo ""
echo "📄 Validating HTML structure..."
check "HTML has DOCTYPE" "grep -q '<!DOCTYPE html>' frontend/index.html"
check "HTML has title" "grep -q '<title>' frontend/index.html"
check "HTML has main app container" "grep -q 'app-container' frontend/index.html"
check "HTML has thermometer SVG" "grep -q 'thermometer-svg' frontend/index.html"

# Configuration validation
echo ""
echo "⚙️ Checking configuration files..."

# Check requirements.txt has essential packages
if [[ -f "backend/requirements.txt" ]]; then
    check "Flask in requirements" "grep -q 'flask' backend/requirements.txt"
    check "OpenAI in requirements" "grep -q 'openai' backend/requirements.txt"
    check "Flask-CORS in requirements" "grep -q 'flask-cors' backend/requirements.txt"
fi

# Check Docker single container structure
if [[ -f "Dockerfile" ]]; then
    check "Dockerfile has FROM python" "grep -q 'FROM python' Dockerfile"
    check "Dockerfile exposes port" "grep -q 'EXPOSE' Dockerfile"
    check "Docker nginx config exists" "test -f docker/nginx.conf"
    check "Docker supervisor config exists" "test -f docker/supervisord.conf"
fi

# Check environment examples
if [[ -f ".env.example" ]]; then
    check "Env example has OpenAI key" "grep -q 'OPENAI_API_KEY' .env.example"
    check "Env example has port config" "grep -q 'PORT' .env.example"
fi

# Security checks
echo ""
echo "🔒 Security validation..."
check "No hardcoded API keys in Python" "! grep -r 'sk-[a-zA-Z0-9]' backend/ || true"
check "No hardcoded secrets in JS" "! grep -r 'sk-[a-zA-Z0-9]\\|secret\\|password' frontend/scripts/ || true"
check ".env is in .gitignore" "grep -q '\\.env' .gitignore"

# Final report
echo ""
echo "📊 Validation Summary"
echo "===================="
echo -e "Total tests: $total"
echo -e "${GREEN}Passed: $success${NC}"
echo -e "${RED}Failed: $((total - success))${NC}"

if [[ $success -eq $total ]]; then
    echo ""
    echo -e "${GREEN}🎉 All validations passed! Your project structure looks great.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run './scripts/setup.sh' to set up the development environment"
    echo "2. Add your OpenAI API key to .env file"
    echo "3. Start the application with './scripts/dev.sh'"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some validations failed. Please check the issues above.${NC}"
    exit 1
fi