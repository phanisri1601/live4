# AI Chatbot System

A complete AI-powered chatbot system with admin dashboard and embeddable widget functionality.

## Features

- 🤖 **AI-Powered Responses**: Uses Google Gemini AI for intelligent conversations
- 📊 **Admin Dashboard**: Comprehensive dashboard for managing leads, appointments, and conversations
- 🎨 **Customizable Widget**: Embeddable chatbot widget for any website
- 📚 **Knowledge Base**: Upload and manage company information to train the chatbot
- 🔐 **User Management**: Role-based access control (Admin/Sub-Admin)
- 📈 **Analytics**: Real-time data visualization and reporting
- 🔄 **Real-time Updates**: Firebase integration for live data synchronization

## Quick Start

### 1. Setup the Chatbot Server

```bash
cd chatbotc
pip install -r requirements.txt
python app.py
```

The chatbot server will run on `http://localhost:5001`

### 2. Setup the Admin Dashboard

```bash
cd scratchdash
npm install
npm start
```

The dashboard will run on `http://localhost:3000`

### 3. Configure Firebase

1. Copy your Firebase service account key to both projects
2. Update the Firebase configuration in both applications
3. Ensure Firebase Realtime Database is enabled

## Usage

### Admin Dashboard

1. **Login**: Use `admin` / `password` for initial login
2. **Upload Knowledge Base**: Go to Knowledge Base section and upload a JSON file with your company information
3. **Manage Users**: Create sub-admin users with specific permissions
4. **View Analytics**: Monitor leads, appointments, and conversations in real-time

### Embedding the Chatbot

Add this script tag to any website:

```html
<script src="http://localhost:5001/static/chatbot-widget.js"></script>
```

Optional customization:

```html
<script>
ChatbotWidget.updateConfig({
    primaryColor: '#your-color',
    secondaryColor: '#your-secondary-color',
    position: 'bottom-right' // or 'bottom-left', 'top-right', 'top-left'
});
</script>
```

### Knowledge Base Format

Upload a JSON file with your company information. Use the sample format:

```json
{
    "company_info": {
        "name": "Your Company Name",
        "type": "Your Business Type",
        "location": "Your City, Country"
    },
    "services": {
        "online_services": ["Service 1", "Service 2"],
        "offline_services": ["Service 3", "Service 4"]
    },
    "common_questions": {
        "what are your services": "We offer...",
        "how can i contact you": "You can reach us..."
    }
}
```

## API Endpoints

### Chatbot Server (`http://localhost:5001`)

- `POST /send_message` - Send message to chatbot
- `POST /upload_knowledge_base` - Upload knowledge base JSON
- `GET /get_knowledge_base` - Get current knowledge base
- `POST /reload_knowledge_base` - Reload knowledge base
- `POST /create_lead` - Create new lead
- `POST /schedule_appointment` - Schedule appointment
- `GET /get_appointments` - Get appointments
- `POST /cancel_appointment` - Cancel appointment

## Configuration

### Environment Variables

Create a `.env` file in the `chatbotc` directory:

```
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_DB_URL=your_firebase_database_url
GOOGLE_APPLICATION_CREDENTIALS=path_to_service_account_key.json
```

### Widget Customization

The chatbot widget can be customized with the following options:

```javascript
ChatbotWidget.updateConfig({
    apiUrl: 'http://localhost:5001', // Your chatbot server URL
    position: 'bottom-right', // Widget position
    theme: 'default', // Theme (default, dark, light)
    primaryColor: '#667eea', // Primary color
    secondaryColor: '#764ba2' // Secondary color
});
```

## File Structure

```
chatbotc/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Chatbot interface
├── static/
│   ├── chatbot-widget.js # Embeddable widget script
│   ├── example.html      # Example website
│   └── sample-knowledge-base.json # Knowledge base template
└── README.md

scratchdash/
├── src/
│   ├── App.js           # Main React application
│   ├── components/
│   │   ├── Dashboard.js # Admin dashboard
│   │   └── Login.js     # Login component
│   ├── firebase.js      # Firebase configuration
│   └── gemini.js        # AI integration
├── package.json         # Node.js dependencies
└── README.md
```

## Deployment

### Production Setup

1. **Update API URLs**: Change `localhost:5000` to your production server URL in:
   - `scratchdash/src/components/Dashboard.js`
   - `chatbotc/static/chatbot-widget.js`

2. **Environment Variables**: Set production environment variables

3. **Firebase Security**: Configure Firebase security rules for production

4. **HTTPS**: Ensure all communications use HTTPS in production

### Docker Deployment (Optional)

Create `Dockerfile` for the chatbot server:

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

## Troubleshooting

### Common Issues

1. **Firebase Connection**: Ensure Firebase credentials are correct and database is enabled
2. **CORS Issues**: Add CORS headers if embedding on different domains
3. **API Key**: Verify Gemini API key is valid and has proper permissions
4. **Port Conflicts**: Ensure ports 5000 and 3000 are available

### Support

For issues and questions:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure Firebase database has proper read/write permissions
4. Test API endpoints directly using tools like Postman

## License

This project is open source and available under the MIT License.