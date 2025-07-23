# USublease: Local Development & Deployment Guide

## Local Development

### 1. Frontend (React)

#### Prerequisites
- Node.js (v16+ recommended)
- npm (v8+ recommended)

#### Steps
```bash
cd frontend
npm install         # Install dependencies
npm start           # Start the React dev server
```
- Open [http://localhost:3000](http://localhost:3000) in your browser.
- The app will reload automatically on code changes.

#### Environment Variables
- Copy your `.env.production` or create a `.env` file in `frontend/` with the necessary AWS and API keys (see `QUICK_START.md`).

---

### 2. Backend (FastAPI + AWS Lambda)

#### Prerequisites
- Python 3.10+
- pip
- (Optional) [Firebase service account JSON] for local Firestore emulation

#### Steps
```bash
cd backend/app
pip install -r ../requirements.txt
uvicorn main:app --reload
```
- The API will be available at [http://localhost:8000](http://localhost:8000)
- API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

#### Testing
```bash
cd backend
pytest
```

---

## Deployment

### 1. Frontend (React) to AWS S3/CloudFront

#### One-Command Deploy (from project root):
```bash
./deploy.sh
```
- This builds the React app and uploads it to S3.
- Make sure your AWS CLI is configured (`aws configure`).
- See `QUICK_START.md` and `DEPLOYMENT_GUIDE.md` for more details.

### 2. Backend (AWS CDK/Lambda)

#### Deploy Infrastructure & Lambdas:
```bash
cd backend
./deploy.sh
```
- This will build and deploy the backend stack using AWS CDK.
- Make sure your AWS CLI is configured and you have permissions.

---

## Troubleshooting
- **CORS errors:** Check CORS settings in both FastAPI and API Gateway.
- **AWS CLI errors:** Ensure you have run `aws configure` and have the right permissions.
- **Frontend not connecting to backend:** Check your `.env` and `aws-config.js` for correct API endpoints.
- **Build errors:** Make sure dependencies are installed and Node/Python versions are compatible.

---

## Useful Links
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [QUICK_START.md](./QUICK_START.md)
- [frontend/README.md](./frontend/README.md) 