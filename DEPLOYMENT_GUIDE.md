# USublease Frontend Deployment Guide

This guide will help you deploy your React frontend to AWS and connect it to your `usublease.com` domain.

## Prerequisites

1. **AWS Account** (already set up)
2. **Domain**: usublease.com (already purchased)
3. **AWS CLI** configured
4. **Node.js** installed

## Step 1: Build the React App

First, build your React app for production:

```bash
cd frontend
npm run build
```

This creates a `build` folder with optimized static files.

## Step 2: Create S3 Bucket for Website Hosting

```bash
# Create S3 bucket for website hosting
aws s3 mb s3://usublease-website --region us-east-1

# Enable static website hosting
aws s3 website s3://usublease-website --index-document index.html --error-document index.html
```

## Step 3: Configure S3 Bucket Policy

Create a bucket policy file `website-bucket-policy.json`:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::usublease-website/*"
        }
    ]
}
```

Apply the policy:

```bash
aws s3api put-bucket-policy --bucket usublease-website --policy file://website-bucket-policy.json
```

## Step 4: Upload Website Files

```bash
# Upload all files from build folder to S3
aws s3 sync build/ s3://usublease-website --delete

# Set cache headers for static assets
aws s3 cp build/ s3://usublease-website --recursive --cache-control "max-age=31536000,public" --exclude "*.html" --exclude "*.json"
aws s3 cp build/ s3://usublease-website --recursive --cache-control "no-cache,no-store,must-revalidate" --include "*.html" --include "*.json"
```

## Step 5: Create CloudFront Distribution

### 5.1 Create CloudFront Distribution

Go to AWS CloudFront Console and create a new distribution:

**Origin Settings:**
- Origin Domain: `usublease-website.s3-website-us-east-1.amazonaws.com`
- Origin Path: (leave empty)
- Origin ID: `usublease-website`

**Default Cache Behavior:**
- Viewer Protocol Policy: `Redirect HTTP to HTTPS`
- Allowed HTTP Methods: `GET, HEAD, OPTIONS`
- Cache Policy: `CachingOptimized`
- Origin Request Policy: `CORS-S3Origin`

**Settings:**
- Price Class: `Use Only U.S., Canada and Europe`
- Alternate Domain Names (CNAMEs): `usublease.com`, `www.usublease.com`
- SSL Certificate: `Request a certificate`

### 5.2 Request SSL Certificate

1. Go to AWS Certificate Manager (ACM)
2. Request a certificate for:
   - `usublease.com`
   - `*.usublease.com`
3. Validate via DNS (recommended)
4. Wait for certificate to be issued

## Step 6: Configure Route 53 DNS

### 6.1 Create Hosted Zone

```bash
# Create hosted zone for usublease.com
aws route53 create-hosted-zone --name usublease.com --caller-reference $(date +%s)
```

### 6.2 Update Domain Nameservers

1. Get the nameservers from the hosted zone:
```bash
aws route53 get-hosted-zone --id YOUR_HOSTED_ZONE_ID
```

2. Update your domain registrar with these nameservers

### 6.3 Create DNS Records

Create a file `dns-records.json`:

```json
{
    "Changes": [
        {
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "usublease.com",
                "Type": "A",
                "AliasTarget": {
                    "HostedZoneId": "Z2FDTNDATAQYW2",
                    "DNSName": "YOUR_CLOUDFRONT_DOMAIN.cloudfront.net",
                    "EvaluateTargetHealth": false
                }
            }
        },
        {
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "www.usublease.com",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "usublease.com"
                    }
                ]
            }
        }
    ]
}
```

Apply the DNS records:

```bash
aws route53 change-resource-record-sets --hosted-zone-id YOUR_HOSTED_ZONE_ID --change-batch file://dns-records.json
```

## Step 7: Update Environment Variables

Update your frontend environment variables for production:

```bash
# Create production .env file
cat > frontend/.env.production << EOF
REACT_APP_AWS_REGION=us-east-1
REACT_APP_USER_POOL_ID=your-user-pool-id
REACT_APP_USER_POOL_CLIENT_ID=your-app-client-id
REACT_APP_API_ENDPOINT=https://your-api-gateway-url.amazonaws.com/prod
REACT_APP_S3_BUCKET=usublease-storage
REACT_APP_COOKIE_DOMAIN=usublease.com
EOF
```

## Step 8: Update Cognito App Client

Update your Cognito app client to include the production domain:

1. Go to AWS Cognito Console
2. Select your User Pool
3. Go to App Integration → App Client Settings
4. Add these callback URLs:
   - `https://usublease.com/`
   - `https://www.usublease.com/`
5. Add these sign-out URLs:
   - `https://usublease.com/`
   - `https://www.usublease.com/`

## Step 9: Create Deployment Script

Create a deployment script `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying USublease to production..."

# Build the app
echo "📦 Building React app..."
cd frontend
npm run build

# Upload to S3
echo "☁️ Uploading to S3..."
aws s3 sync build/ s3://usublease-website --delete

# Set cache headers
echo "⚡ Setting cache headers..."
aws s3 cp build/ s3://usublease-website --recursive --cache-control "max-age=31536000,public" --exclude "*.html" --exclude "*.json"
aws s3 cp build/ s3://usublease-website --recursive --cache-control "no-cache,no-store,must-revalidate" --include "*.html" --include "*.json"

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id YOUR_CLOUDFRONT_DISTRIBUTION_ID --paths "/*"

echo "✅ Deployment complete! Your site is live at https://usublease.com"
```

Make it executable:

```bash
chmod +x deploy.sh
```

## Step 10: Set Up CI/CD (Optional)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd frontend
        npm install
        
    - name: Build app
      run: |
        cd frontend
        npm run build
      env:
        REACT_APP_AWS_REGION: ${{ secrets.AWS_REGION }}
        REACT_APP_USER_POOL_ID: ${{ secrets.USER_POOL_ID }}
        REACT_APP_USER_POOL_CLIENT_ID: ${{ secrets.USER_POOL_CLIENT_ID }}
        REACT_APP_API_ENDPOINT: ${{ secrets.API_ENDPOINT }}
        REACT_APP_S3_BUCKET: ${{ secrets.S3_BUCKET }}
        REACT_APP_COOKIE_DOMAIN: usublease.com
        
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
        
    - name: Deploy to S3
      run: |
        aws s3 sync frontend/build/ s3://usublease-website --delete
        aws s3 cp frontend/build/ s3://usublease-website --recursive --cache-control "max-age=31536000,public" --exclude "*.html" --exclude "*.json"
        aws s3 cp frontend/build/ s3://usublease-website --recursive --cache-control "no-cache,no-store,must-revalidate" --include "*.html" --include "*.json"
        
    - name: Invalidate CloudFront
      run: |
        aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

## Step 11: Security and Performance

### 11.1 Security Headers

Add security headers to CloudFront:

```json
{
    "SecurityHeadersConfig": {
        "StrictTransportSecurity": {
            "Override": true,
            "IncludeSubdomains": true,
            "Preload": true,
            "AccessControlMaxAgeSec": 31536000
        },
        "XContentTypeOptions": {
            "Override": true
        },
        "XFrameOptions": {
            "Override": true,
            "FrameOption": "SAMEORIGIN"
        },
        "XSSProtection": {
            "Override": true,
            "Protection": true,
            "ModeBlock": true
        },
        "ReferrerPolicy": {
            "Override": true,
            "ReferrerPolicy": "strict-origin-when-cross-origin"
        }
    }
}
```

### 11.2 Error Pages

Configure custom error pages in CloudFront:
- 403: `/index.html`
- 404: `/index.html`

## Step 12: Monitoring and Analytics

### 12.1 CloudWatch Monitoring

Set up CloudWatch alarms for:
- CloudFront 4xx/5xx errors
- S3 bucket access
- API Gateway errors

### 12.2 Google Analytics

Add Google Analytics to your React app:

```bash
npm install react-ga
```

Update `App.js`:

```javascript
import ReactGA from 'react-ga';

// Initialize GA
ReactGA.initialize('GA_TRACKING_ID');

// Track page views
ReactGA.pageview(window.location.pathname);
```

## Step 13: Testing

### 13.1 Test Your Deployment

1. Visit `https://usublease.com`
2. Test user registration/login
3. Test all major features
4. Check mobile responsiveness
5. Test performance with PageSpeed Insights

### 13.2 SSL Certificate Validation

Ensure your SSL certificate is properly validated and working.

## Cost Estimation

**Monthly costs (estimated):**
- S3: ~$0.50 (for website hosting)
- CloudFront: ~$1-5 (depending on traffic)
- Route 53: ~$0.50
- Certificate Manager: Free
- **Total: ~$2-6/month**

## Troubleshooting

### Common Issues

1. **CORS Errors**: Update API Gateway CORS settings to include your domain
2. **Authentication Issues**: Verify Cognito app client settings
3. **DNS Issues**: Check nameserver configuration
4. **SSL Issues**: Ensure certificate is validated

### Useful Commands

```bash
# Check S3 website
aws s3 website s3://usublease-website

# List CloudFront distributions
aws cloudfront list-distributions

# Check Route 53 records
aws route53 list-resource-record-sets --hosted-zone-id YOUR_HOSTED_ZONE_ID

# Test DNS resolution
nslookup usublease.com
dig usublease.com
```

## Next Steps

1. **Set up monitoring** and alerts
2. **Implement analytics** tracking
3. **Set up backup** strategies
4. **Plan for scaling** as traffic grows
5. **Consider CDN** optimization for global users

## Support

- **AWS Documentation**: https://docs.aws.amazon.com/
- **CloudFront Documentation**: https://docs.aws.amazon.com/cloudfront/
- **Route 53 Documentation**: https://docs.aws.amazon.com/route53/

Your website will be live at `https://usublease.com` once you complete these steps! 