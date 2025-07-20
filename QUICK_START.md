# 🚀 Quick Start: Deploy USublease to usublease.com

## Prerequisites ✅
- [x] AWS Account (already set up)
- [x] Domain: usublease.com (already purchased)
- [x] AWS CLI installed and configured

## Step 1: Deploy to S3 (5 minutes)

Run the deployment script:

```bash
./deploy.sh
```

This will:
- Build your React app
- Create S3 bucket (if needed)
- Upload files to S3
- Set proper cache headers

## Step 2: Set Up CloudFront (10 minutes)

1. **Go to AWS CloudFront Console**
2. **Create Distribution:**
   - Origin Domain: `usublease-website.s3-website-us-east-1.amazonaws.com`
   - Viewer Protocol: `Redirect HTTP to HTTPS`
   - Alternate Domain Names: `usublease.com`, `www.usublease.com`
   - SSL Certificate: `Request a certificate`

3. **Request SSL Certificate:**
   - Go to Certificate Manager
   - Request certificate for `usublease.com` and `*.usublease.com`
   - Validate via DNS

## Step 3: Configure DNS (5 minutes)

1. **Create Route 53 Hosted Zone:**
   ```bash
   aws route53 create-hosted-zone --name usublease.com
   ```

2. **Update Domain Nameservers:**
   - Get nameservers from Route 53
   - Update your domain registrar with these nameservers

3. **Create DNS Records:**
   - Point `usublease.com` to CloudFront
   - Point `www.usublease.com` to `usublease.com`

## Step 4: Update Cognito Settings (5 minutes)

1. **Go to AWS Cognito Console**
2. **Update App Client Settings:**
   - Add callback URLs: `https://usublease.com/`, `https://www.usublease.com/`
   - Add sign-out URLs: `https://usublease.com/`, `https://www.usublease.com/`

## Step 5: Update Environment Variables

Create `frontend/.env.production`:

```env
REACT_APP_AWS_REGION=us-east-1
REACT_APP_USER_POOL_ID=your-user-pool-id
REACT_APP_USER_POOL_CLIENT_ID=your-app-client-id
REACT_APP_API_ENDPOINT=https://your-api-gateway-url.amazonaws.com/prod
REACT_APP_S3_BUCKET=usublease-storage
REACT_APP_COOKIE_DOMAIN=usublease.com
```

## Step 6: Deploy Again

```bash
./deploy.sh
```

## 🎉 You're Live!

Your website will be available at:
- **https://usublease.com**
- **https://www.usublease.com**

## 📊 Estimated Costs

- **S3**: ~$0.50/month
- **CloudFront**: ~$1-5/month
- **Route 53**: ~$0.50/month
- **Total**: ~$2-6/month

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**: Update API Gateway CORS settings
2. **SSL Issues**: Ensure certificate is validated
3. **DNS Issues**: Check nameserver configuration

### Useful Commands:

```bash
# Check deployment
aws s3 ls s3://usublease-website

# List CloudFront distributions
aws cloudfront list-distributions

# Test DNS
nslookup usublease.com
```

## 📚 Full Documentation

See `DEPLOYMENT_GUIDE.md` for detailed instructions and advanced configuration.

## 🆘 Need Help?

1. Check AWS documentation
2. Review the deployment guide
3. Check CloudWatch logs for errors
4. Verify all environment variables are set correctly

---

**Your website will be live at https://usublease.com in about 30 minutes!** 🚀 