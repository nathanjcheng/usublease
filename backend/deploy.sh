#!/bin/bash

# USublease AWS Backend Deployment Script
echo "🚀 Deploying USublease AWS Backend..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install AWS CDK globally if not already installed
if ! command -v cdk &> /dev/null; then
    echo "📦 Installing AWS CDK..."
    npm install -g aws-cdk
fi

# Bootstrap CDK (only needed once per account/region)
echo "🔧 Bootstrapping CDK..."
cdk bootstrap

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy the stack
echo "🚀 Deploying stack..."
cdk deploy --require-approval never

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the output values to your frontend .env file"
echo "2. Update the frontend aws-config.js with the new values"
echo "3. Test the application" 