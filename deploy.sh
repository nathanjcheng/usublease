#!/bin/bash

# USublease Deployment Script
# This script builds and deploys the React app to AWS S3 and CloudFront

set -e  # Exit on any error

echo "🚀 Starting USublease deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
S3_BUCKET="usublease-website"
CLOUDFRONT_DISTRIBUTION_ID=""  # You'll need to fill this in
AWS_REGION="us-east-1"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    print_error "Please run this script from the project root directory."
    exit 1
fi

# Step 1: Build the React app
print_status "Building React app..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Build the app
print_status "Running production build..."
npm run build

if [ ! -d "build" ]; then
    print_error "Build failed. Check for errors above."
    exit 1
fi

print_success "Build completed successfully!"

# Step 2: Create S3 bucket if it doesn't exist
print_status "Checking S3 bucket..."
if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
    print_status "Creating S3 bucket: $S3_BUCKET"
    aws s3 mb "s3://$S3_BUCKET" --region $AWS_REGION
    
    # Enable static website hosting
    print_status "Enabling static website hosting..."
    aws s3 website "s3://$S3_BUCKET" --index-document index.html --error-document index.html
    
    # Create bucket policy
    print_status "Creating bucket policy..."
    cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$S3_BUCKET/*"
        }
    ]
}
EOF
    
    aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file:///tmp/bucket-policy.json
    rm /tmp/bucket-policy.json
    
    print_success "S3 bucket created and configured!"
else
    print_status "S3 bucket already exists."
fi

# Step 3: Upload files to S3
print_status "Uploading files to S3..."
aws s3 sync build/ "s3://$S3_BUCKET" --delete

# Step 4: Set cache headers
print_status "Setting cache headers..."
aws s3 cp build/ "s3://$S3_BUCKET" --recursive --cache-control "max-age=31536000,public" --exclude "*.html" --exclude "*.json"
aws s3 cp build/ "s3://$S3_BUCKET" --recursive --cache-control "no-cache,no-store,must-revalidate" --include "*.html" --include "*.json"

print_success "Files uploaded to S3!"

# Step 5: Invalidate CloudFront cache (if distribution ID is provided)
if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    print_status "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
    print_success "CloudFront cache invalidated!"
else
    print_warning "CloudFront distribution ID not set. Skipping cache invalidation."
    print_warning "To set it up, edit this script and add your CloudFront distribution ID."
fi

# Step 6: Get the website URL
WEBSITE_URL=$(aws s3api get-bucket-website --bucket $S3_BUCKET --query 'IndexDocument.Suffix' --output text 2>/dev/null || echo "index.html")

print_success "Deployment completed successfully!"
echo ""
echo "🌐 Your website is now available at:"
echo "   S3 Website URL: http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
echo ""
echo "📝 Next steps:"
echo "   1. Set up CloudFront distribution"
echo "   2. Configure Route 53 DNS"
echo "   3. Request SSL certificate"
echo "   4. Update Cognito app client settings"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions."

cd .. 