# ☁️ SkyChat

Real-time chat application with rooms, JWT authentication, and admin controls.

## Tech Stack

- **Frontend:** React + React Router + Vite
- **Backend:** Node.js + Express
- **Realtime:** Socket.io
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **Storage:** In-memory (session-level persistence)

## Getting Started

```bash
# Install all dependencies
npm run install:all

# Also install root dependencies
npm install

# Start development (server + client)
npm run dev
```

- **Client:** http://localhost:5173
- **Server API:** http://localhost:3001

## Admin Account

- **Username:** `admin`
- **Password:** `admin123`

Admin can clear all messages in any room.

## Features

- ✅ Register / Login with JWT
- ✅ Auto-login on refresh
- ✅ Global rooms (General, Tech Talk, Music)
- ✅ Custom rooms with optional passwords
- ✅ Real-time messaging via Socket.io
- ✅ Delete own messages
- ✅ Admin: clear entire chat room
- ✅ Ping indicator with color-coded latency
- ✅ Session-level message persistence
- ✅ Responsive design

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Verify token |
| GET | /api/rooms | Yes | List all rooms |
| POST | /api/rooms | Yes | Create custom room |
| GET | /api/rooms/:id/messages | Yes | Get room messages |
| DELETE | /api/messages/:id | Yes | Delete own message |
| DELETE | /api/rooms/:id/messages | Admin | Clear room messages |
| GET | /api/ping | No | Health check |

## Production

```bash
npm run build
npm start
```
