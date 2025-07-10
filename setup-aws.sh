#!/bin/bash

# USublease AWS Migration Setup Script
# This script helps set up the frontend for AWS backend integration

echo "🚀 USublease AWS Migration Setup"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js version 16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Navigate to frontend directory
if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found. Please run this script from the project root."
    exit 1
fi

cd frontend

echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ .env file created"
        echo "⚠️  Please update .env file with your AWS configuration"
    else
        echo "❌ env.example file not found"
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update the .env file with your AWS configuration"
echo "2. Follow the AWS_SETUP.md guide to set up your backend"
echo "3. Run 'npm start' to start the development server"
echo ""
echo "📚 Documentation:"
echo "- AWS Backend Setup: AWS_SETUP.md"
echo "- Frontend Setup: FRONTEND_SETUP.md"
echo ""
echo "🔧 Configuration needed in .env:"
echo "- REACT_APP_USER_POOL_ID"
echo "- REACT_APP_USER_POOL_CLIENT_ID"
echo "- REACT_APP_API_ENDPOINT"
echo "- REACT_APP_S3_BUCKET"
echo ""
echo "Happy coding! 🚀" 