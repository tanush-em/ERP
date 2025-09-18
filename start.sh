#!/bin/bash

# College ERP System Startup Script
echo "🎓 Starting College ERP System..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check if MongoDB is running (optional check)
echo "📦 Checking system requirements..."

# Function to start backend
start_backend() {
    echo "🔧 Starting Backend Server..."
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "📦 Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install requirements
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Create sample data if it doesn't exist
    echo "📊 Setting up sample data..."
    python create_sample_data.py
    
    # Start the Flask server
    echo "🚀 Starting Flask backend on http://localhost:5000"
    python app.py &
    BACKEND_PID=$!
    
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "🔧 Starting Frontend Server..."
    cd frontend
    
    # Install dependencies
    echo "📦 Installing Node.js dependencies..."
    npm install
    
    # Start the Next.js server
    echo "🚀 Starting Next.js frontend on http://localhost:3000"
    npm run dev &
    FRONTEND_PID=$!
    
    cd ..
}

# Function to handle cleanup
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    echo "✅ Servers stopped successfully!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start both servers
start_backend
start_frontend

echo ""
echo "🎉 College ERP System is starting up!"
echo ""
echo "📍 Access the application at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "🔐 Test Credentials:"
echo "   Admin:    admin / admin123"
echo "   Student:  student / student123"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait
