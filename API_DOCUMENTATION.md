# 🏔️ Coal Mine Safety & Productivity Management System

## 📋 API Documentation

### Base URL
```
Production: https://your-api-domain.com/api
Development: http://localhost:3000/api
```

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "worker"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "worker"
  }
}
```

---

## 🚨 Alert Endpoints

### Get All Alerts
```http
GET /api/alerts?type=critical&resolved=false&page=1&limit=10
Authorization: Bearer TOKEN
```

### Create Alert
```http
POST /api/alerts
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "message": "High methane levels detected in Section B",
  "type": "critical",
  "createdBy": "MINE_ID"
}
```

### Resolve Alert
```http
PATCH /api/alerts/:alertId/resolve
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "userId": "USER_ID"
}
```

---

## 🔮 Predictive Analytics Endpoints

### Generate Safety Prediction
```http
POST /api/mines/:mineId/predict
Authorization: Bearer TOKEN
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "riskScore": 75,
    "riskLevel": "high",
    "predictedIncidents": [
      {
        "type": "equipment_failure",
        "probability": 85,
        "estimatedTimeframe": "within_24h",
        "recommendedActions": [
          "Immediate equipment inspection required",
          "Schedule emergency maintenance"
        ]
      }
    ],
    "recommendations": [...],
    "confidence": 87
  }
}
```

### Get Predictions
```http
GET /api/mines/:mineId/predictions?limit=10&page=1
Authorization: Bearer TOKEN
```

### Get High-Risk Mines
```http
GET /api/high-risk-mines
Authorization: Bearer TOKEN
```

### Get Dashboard Analytics
```http
GET /api/mines/:mineId/analytics
Authorization: Bearer TOKEN
```

---

## 🆘 Emergency Response Endpoints

### Create Emergency (SOS)
```http
POST /api/emergency
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "mineId": "MINE_ID",
  "emergencyType": "fire",
  "severity": "critical",
  "description": "Fire in equipment storage area",
  "location": {
    "area": "Storage Area B",
    "level": "Underground Level 2",
    "latitude": 12.9716,
    "longitude": 77.5946
  }
}
```

### Get Active Emergencies
```http
GET /api/emergencies/active
Authorization: Bearer TOKEN
```

### Update Emergency Status
```http
PATCH /api/emergency/:id/status
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "status": "responding",
  "notes": "Response team dispatched"
}
```

### Assign Response Team
```http
POST /api/emergency/:id/assign-team
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "teamMembers": [
    {
      "userId": "USER_ID_1",
      "role": "coordinator"
    },
    {
      "userId": "USER_ID_2",
      "role": "medic"
    }
  ]
}
```

### Initiate Evacuation
```http
POST /api/emergency/:id/evacuate
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "personnelCount": 25,
  "evacuationRoutes": ["Main Exit", "Emergency Exit A"]
}
```

---

## 🎓 Training & Gamification Endpoints

### Get All Trainings
```http
GET /api/trainings?category=safety_procedures&isActive=true
Authorization: Bearer TOKEN
```

### Create Training (Admin Only)
```http
POST /api/training
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "title": "Advanced Fire Safety Procedures",
  "description": "Comprehensive fire safety training",
  "category": "safety_procedures",
  "type": "video",
  "difficulty": "intermediate",
  "duration": 45,
  "points": 150,
  "isMandatory": true
}
```

### Enroll in Training
```http
POST /api/training/:id/enroll
Authorization: Bearer TOKEN
```

### Update Training Progress
```http
PATCH /api/training/:id/progress
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "progress": 75,
  "score": 85,
  "timeSpent": 30
}
```

### Get User Trainings
```http
GET /api/user/trainings
Authorization: Bearer TOKEN
```

### Get Leaderboard
```http
GET /api/leaderboard?limit=50
Authorization: Bearer TOKEN
```

### Get User Stats
```http
GET /api/leaderboard/me
Authorization: Bearer TOKEN
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalPoints": 1250,
    "level": 5,
    "rank": 12,
    "badges": [...],
    "achievements": [...],
    "statistics": {
      "trainingsCompleted": 15,
      "averageScore": 87.5,
      "certificatesEarned": 8
    }
  }
}
```

---

## 📊 Advanced Analytics Endpoints

### Generate Analytics Report
```http
POST /api/mines/:mineId/analytics/generate
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "reportType": "monthly",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```

### Get Latest Report
```http
GET /api/mines/:mineId/analytics/latest?reportType=daily
Authorization: Bearer TOKEN
```

### Export Report
```http
GET /api/analytics/:id/export?format=pdf
Authorization: Bearer TOKEN
```

---

## 🛠️ Maintenance Endpoints

### Get All Maintenance Tasks
```http
GET /api/maintenance?status=pending&priority=5
Authorization: Bearer TOKEN
```

### Create Maintenance Task
```http
POST /api/maintenance
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "mineId": "MINE_ID",
  "task": "Replace conveyor belt motor",
  "equipmentId": "EQ-12345",
  "dueDate": "2025-11-25",
  "priority": 4,
  "category": "preventive",
  "estimatedDuration": 6,
  "description": "Scheduled maintenance for conveyor motor"
}
```

### Get Overdue Tasks
```http
GET /api/maintenance/overdue/:mineId
Authorization: Bearer TOKEN
```

---

## 📦 Resource Management Endpoints

### Get All Resources
```http
GET /api/resources?mineId=MINE_ID&type=coal
Authorization: Bearer TOKEN
```

### Create Resource
```http
POST /api/resources
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "mineId": "MINE_ID",
  "name": "Diesel Fuel",
  "type": "fuel",
  "used": 500,
  "available": 2000,
  "unit": "liters",
  "cost": {
    "pricePerUnit": 1.5
  }
}
```

### Consume Resource
```http
POST /api/resources/:id/consume
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "amount": 50,
  "notes": "Refueling equipment"
}
```

### Restock Resource
```http
POST /api/resources/:id/restock
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "amount": 1000,
  "notes": "Weekly supply delivery"
}
```

---

## 🌐 WebSocket Events

### Connect to WebSocket
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

### Join Mine Room
```javascript
socket.emit('join:mine', 'MINE_ID');
```

### Location Update
```javascript
socket.emit('location:update', {
  mineId: 'MINE_ID',
  userId: 'USER_ID',
  location: {
    latitude: 12.9716,
    longitude: 77.5946,
    area: 'Section A'
  },
  vitalSigns: {
    heartRate: 75,
    oxygenLevel: 98
  }
});
```

### Emergency SOS
```javascript
socket.emit('emergency:sos', {
  mineId: 'MINE_ID',
  emergencyType: 'gas_leak',
  location: {
    area: 'Tunnel B',
    level: 'Underground Level 3'
  },
  description: 'High methane detected'
});
```

### Listen for Alerts
```javascript
socket.on('alert:new', (alert) => {
  console.log('New alert:', alert);
});

socket.on('emergency:alert', (emergency) => {
  console.log('EMERGENCY:', emergency);
});

socket.on('equipment:updated', (data) => {
  console.log('Equipment status:', data);
});
```

---

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": []
}
```

---

## ⚠️ Rate Limits

- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes
- Emergency: 10 requests per minute
- Analytics: 20 requests per hour
- File Upload: 50 requests per hour

---

## 🔒 Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Express-validator
- **NoSQL Injection Protection**: Mongo-sanitize
- **XSS Protection**: XSS-clean
- **CORS**: Configurable origins
- **JWT Authentication**: Secure tokens

---

## 🚀 Getting Started

### Installation
```bash
cd CoalMine-B
npm install
```

### Environment Variables
Create `.env` file:
```env
PORT=3000
DB_URI=mongodb://localhost:27017/coalmine
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
SESSION_SECRET=your_session_secret
```

### Run Development Server
```bash
npm run dev
```

### Run Production Server
```bash
npm start
```

---

## 📧 Support

For issues or questions, contact: aryamangupta2121@gmail.com

---

**Version:** 1.0.0  
**Last Updated:** November 19, 2025
