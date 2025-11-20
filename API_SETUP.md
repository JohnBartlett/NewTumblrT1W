# API Server Setup

The application now uses a **Node.js/Express backend** to handle database operations, as Prisma cannot run in the browser.

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────┐
│  React Frontend │ ──HTTP──│ Express Server  │ ──ORM──│ PostgreSQL   │
│  (Port 5173)    │         │  (Port 3001)    │        │  (Port 5432) │
└─────────────────┘         └─────────────────┘         └──────────────┘
```

## Running the Application

### Start Everything (Recommended)
```bash
npm run dev
```
This starts both:
- **Backend API** on `http://localhost:3001`
- **Frontend** on `http://localhost:5173`

### Start Individually
```bash
# Start backend only
npm run server

# Start frontend only
npm run client
```

## API Endpoints

### Authentication

**Register**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "myusername",
  "password": "securepassword",
  "displayName": "My Name" // optional
}

Response: UserSession
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "emailOrUsername": "user@example.com", // or "myusername"
  "password": "securepassword"
}

Response: UserSession
```

**Get User**
```http
GET /api/users/:id

Response: UserSession
```

### User Preferences

**Get Preferences**
```http
GET /api/users/:id/preferences

Response: UserPreferences
```

**Update Preferences**
```http
PUT /api/users/:id/preferences
Content-Type: application/json

{
  "theme": "dark",
  "viewMode": "images-only",
  "fontSize": 18
}

Response: UserPreferences
```

### Stored Images

**Store Images**
```http
POST /api/stored-images
Content-Type: application/json

{
  "userId": "user-id",
  "images": [
    {
      "postId": "123456",
      "blogName": "photo-blog",
      "url": "https://example.com/image.jpg",
      "width": 1920,
      "height": 1080,
      "tags": ["art", "digital"],
      "description": "Amazing artwork",
      "notes": 1234,
      "cost": 49.99, // Optional: monetary value in dollars
      "timestamp": "2025-10-23T10:00:00.000Z"
    }
  ]
}

Response: { success: true, stored: 1, skipped: 0, failed: 0, total: 1, images: [...] }
```

**Get Stored Images**
```http
GET /api/stored-images/:userId?limit=50&offset=0&blogName=photo-blog

Response: { images: [...], total: 100, limit: 50, offset: 0 }
```

**Update Stored Image Cost**
```http
PATCH /api/stored-images/:id
Content-Type: application/json

{
  "userId": "user-id",
  "cost": 79.99
}

Response: StoredImage
```

**Delete Stored Image**
```http
DELETE /api/stored-images/:id?userId=user-id

Response: { message: "Image deleted successfully" }
```

**Get Stored Images Stats**
```http
GET /api/stored-images/:userId/stats

Response: { 
  total: 100, 
  totalCost: 1234.56,
  byBlog: [
    { blogName: "photo-blog", count: 50, totalCost: 678.90 },
    { blogName: "art-blog", count: 50, totalCost: 555.66 }
  ]
}
```

### Health Check
```http
GET /api/health

Response: { "status": "ok" }
```

## Environment Variables

The frontend connects to the API using:
```bash
VITE_API_URL=http://localhost:3001
```

Default: `http://localhost:3001` (if not set)

---

## Complete Environment Variables

### Required Variables

```bash
# Tumblr API Credentials (Required)
VITE_TUMBLR_API_KEY=your_oauth_consumer_key_here
```

### Optional OAuth Variables

```bash
# OAuth Consumer Secret (for authenticated features)
TUMBLR_CONSUMER_SECRET=your_consumer_secret_here

# App URL (defaults to http://localhost:5173)
VITE_APP_URL=http://localhost:5173
```

### Backend Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tumblr_dev"

# Server Port (defaults to 3001)
PORT=3001

# Node Environment
NODE_ENV=development
```

### Frontend Build Variables

```bash
# API URL (defaults to http://localhost:3001)
VITE_API_URL=http://localhost:3001
```

---

## Authenticated vs Unauthenticated Endpoints

### Unauthenticated (API Key Only)

**Available with just `VITE_TUMBLR_API_KEY`:**

```http
GET  /api/tumblr/blog/:blog/info
GET  /api/tumblr/blog/:blog/posts
GET  /api/tumblr/blog/:blog/avatar/:size
GET  /api/tumblr/blog/:blog/post/:postId/notes
GET  /api/tumblr/tagged
```

**Limitations:**
- Public blogs only
- ~50 notes per post maximum
- No write operations
- No dashboard access

### Authenticated (OAuth Required)

**Requires OAuth setup with `TUMBLR_CONSUMER_SECRET`:**

```http
POST /api/auth/tumblr/connect
POST /api/auth/tumblr/callback
POST /api/auth/tumblr/disconnect
GET  /api/auth/tumblr/status/:userId
GET  /api/tumblr/oauth/blog/:blog/posts
GET  /api/tumblr/oauth/blog/:blog/notes/:postId
```

**Capabilities:**
- Private blogs (if user follows them)
- Full notes data (all likes, reblogs, comments)
- Like/unlike posts (future)
- Reblog posts (future)
- Create posts (future)

**See `OAUTH_GUIDE.md` for complete OAuth setup instructions.**

---

## Frontend API Client

Located at: `src/services/api/auth.api.ts`

Example usage:
```typescript
import { authApi } from '@/services/api/auth.api';

// Register
const user = await authApi.register({
  email: 'user@example.com',
  username: 'myusername',
  password: 'password123'
});

// Login
const session = await authApi.login({
  emailOrUsername: 'user@example.com',
  password: 'password123'
});

// Get user by ID
const user = await authApi.getUserById(userId);
```

## Development

### Watch Mode
The server runs in watch mode using `tsx watch`, so it automatically restarts when you make changes to `server/index.ts`.

### Debugging
Server logs appear in the terminal with the `[SERVER]` prefix.

### Port Configuration
To change the API port, set the `PORT` environment variable:
```bash
PORT=4000 npm run server
```

## Production Build

For production, you'll need to:
1. Build the frontend: `npm run build`
2. Serve the backend with a process manager (PM2, systemd, etc.)
3. Use a reverse proxy (nginx) to route requests

## Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- CORS is enabled for local development
- In production, restrict CORS to your frontend domain
- Add authentication middleware for protected routes
- Consider adding rate limiting
- Use HTTPS in production

