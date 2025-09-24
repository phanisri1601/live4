# LiveCode Chatbot Application

A Flask-based chatbot application with Firebase integration, Twilio SMS support, and Google Cloud deployment capabilities.

## Features

- **AI Chatbot**: Powered by Google Gemini AI
- **User Authentication**: JWT-based auth with OTP verification
- **SMS Integration**: Twilio for OTP delivery
- **Database**: Firebase Realtime Database
- **Cloud Ready**: Deployable to Google Cloud Run/App Engine

## Local Development

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set Environment Variables**:
   Create a `.env` file with:
   ```
   FIREBASE_DB_URL=https://livecode-35eda-default-rtdb.firebaseio.com/
   JWT_SECRET=your-jwt-secret
   GEMINI_API_KEY=your-gemini-api-key
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   TWILIO_NUMBER=your-twilio-number
   ```

3. **Run the Application**:
   ```bash
   python app.py
   ```

## Google Cloud Deployment

### Option 1: Cloud Run (Recommended)

1. **Enable APIs**:
   - Cloud Run API
   - Cloud Build API
   - Secret Manager API

2. **Deploy from GitHub**:
   - Connect your GitHub repository
   - Deploy using the provided `Dockerfile`
   - Set environment variables in Cloud Run console

3. **Set up Secrets**:
   - Upload Firebase service account key to Secret Manager
   - Grant access to Cloud Run service account

### Option 2: App Engine

1. **Deploy using app.yaml**:
   ```bash
   gcloud app deploy
   ```

2. **Set environment variables** in `app.yaml`

## API Endpoints

- `POST /auth/send_otp` - Send OTP via SMS
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/verify` - Verify JWT token
- `GET /debug/twilio` - Debug Twilio configuration

## Project Structure

```
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── Dockerfile            # Container configuration
├── app.yaml              # App Engine configuration
├── cloudbuild.yaml       # Cloud Build configuration
├── templates/            # HTML templates
├── static/              # Static assets
└── README.md            # This file
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_DB_URL` | Firebase Realtime Database URL | Yes |
| `JWT_SECRET` | Secret for JWT token signing | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Yes |
| `TWILIO_NUMBER` | Twilio phone number | Yes |

## Security Notes

- Never commit `.env` files or service account keys
- Use Secret Manager for production secrets
- Enable HTTPS in production
- Set up proper CORS policies
- Implement rate limiting for production use

## Troubleshooting

### Twilio Error 20003
- Verify Account SID and Auth Token are correct
- Ensure phone number belongs to the same account
- Check if using live vs test credentials

### Firebase Connection Issues
- Verify service account key is valid
- Check database URL is correct
- Ensure proper IAM permissions

### Deployment Issues
- Check Cloud Build logs
- Verify all environment variables are set
- Ensure Dockerfile builds successfully