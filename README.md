# ☁️ SkyChat Web

A modern, real-time messenger built with Node.js and Socket.io. This version is optimized for web deployment (e.g., Render, Railway, Fly.io).

## Features
- **Real-time Chat**: Instant messaging for multiple users.
- **Presence List**: See who is currently online.
- **Responsive Design**: Looks great on mobile browsers and desktops.
- **Glassmorphism UI**: Beautiful, premium aesthetic with smooth animations.

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   node server.js
   ```
3. Open [http://localhost:3000](http://localhost:3000)

## Global Access (Development)
To let friends connect to your local PC:
```bash
node start-public.js
```

## Production Deployment (Recommended: Render.com)
1. Push this code to a **GitHub repository**.
2. Connect the repository to **Render.com** (choose "Web Service").
3. Set the Build Command to `npm install`.
4. Set the Start Command to `node server.js`.
5. Your app will be live on a `*.onrender.com` URL!

---
*Created with ❤️ by SkyChat Team*
