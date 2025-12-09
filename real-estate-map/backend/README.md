# Clintonville Real Estate Backend API

This is the backend API for the Clintonville Real Estate Investment Map application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-here
```

3. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get a specific property
- `PUT /api/properties/:id` - Update a property
- `POST /api/properties` - Create a new property

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user

## Real-time Features

The server uses Socket.io for real-time collaboration:
- Property updates are broadcast to all connected clients
- Users can join property rooms for collaborative editing
- Note updates are shared in real-time

## Data Storage

Currently uses in-memory storage. In production, this should be replaced with:
- PostgreSQL or MongoDB for data persistence
- Redis for session management
- Proper authentication with JWT tokens
