@echo off
echo 🎓 Starting College ERP System...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18 or higher.
    pause
    exit /b 1
)

echo 📦 Checking system requirements...

REM Start backend
echo 🔧 Starting Backend Server...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install requirements
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

REM Create sample data
echo 📊 Setting up sample data...
python create_sample_data.py

REM Start Flask server in background
echo 🚀 Starting Flask backend on http://localhost:5000
start "Backend Server" python app.py

cd ..

REM Start frontend
echo 🔧 Starting Frontend Server...
cd frontend

REM Install dependencies
echo 📦 Installing Node.js dependencies...
npm install

REM Start Next.js server in background
echo 🚀 Starting Next.js frontend on http://localhost:3000
start "Frontend Server" npm run dev

cd ..

echo.
echo 🎉 College ERP System is starting up!
echo.
echo 📍 Access the application at:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo.
echo 🔐 Test Credentials:
echo    Admin:    admin / admin123
echo    Student:  student / student123
echo.
echo Press any key to continue...
pause >nul
