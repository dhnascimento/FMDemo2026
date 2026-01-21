#!/bin/bash
# FileMaker DDR Analyzer - Start Script

echo "FileMaker DDR Analyzer"
echo "====================="
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Check if dependencies are installed
if ! python3 -c "import flask" &> /dev/null; then
    echo "Installing Python dependencies..."
    pip install -r backend/requirements.txt
fi

# Start the Flask server
echo "Starting Flask server..."
cd backend
python3 app.py
