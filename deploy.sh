#!/bin/bash

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying backend...${NC}"
cd backend
./deploy.sh
cd ..

echo -e "${BLUE}🚀 Deploying frontend...${NC}"
cd frontend
npm install
npm run build
# Deploy to S3 (update the bucket name below!)
aws s3 sync build/ s3://usublease-storage --delete
cd ..

echo -e "${GREEN}✅ Both backend and frontend deployed!${NC}"
echo
# Print the CloudFront or S3 URL for testing
# Replace with your actual CloudFront distribution domain if you have one
CLOUDFRONT_URL="https://d2t4zss95r9hsi.cloudfront.net/" # <-- Replace with your CloudFront domain
S3_WEBSITE_URL="http://usublease-website.s3-website-us-east-1.amazonaws.com/" # <-- Replace with your S3 website endpoint if not using CloudFront

echo -e "${BLUE}🌐 Visit your deployed frontend at:${NC}"
echo -e "${GREEN}$CLOUDFRONT_URL${NC} (CloudFront, recommended)"
echo -e "${GREEN}$S3_WEBSITE_URL${NC} (S3 static site, if enabled)"
echo -e "${BLUE}If you don't see your site, check your S3 bucket and CloudFront distribution settings.${NC}"