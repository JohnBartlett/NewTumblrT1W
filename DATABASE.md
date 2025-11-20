# Database Documentation

This application uses **PostgreSQL** with **Prisma ORM** for robust data storage and user management.

## Database Schema

### Users Table
Stores user account information:
- `id`: Unique identifier (UUID)
- `email`: User email (unique)
- `username`: Username (unique)
- `passwordHash`: Bcrypt hashed password (12 salt rounds)
- `displayName`: Optional display name
- `avatar`: Profile picture URL
- `bio`: User biography
- `role`: User role (USER, ADMIN, MODERATOR)
- `emailVerified`: Email verification status (boolean)
- `emailVerificationToken`: Token for email verification
- `passwordResetToken`: Token for password reset
- `passwordResetExpiry`: Password reset token expiration
- `lastLoginAt`: Last login timestamp
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

### UserPreferences Table (v0.80.0 Updated)
Stores user interface preferences:
- `theme`: light/dark/system
- `fontSize`: Font size (px)
- `viewMode`: full/images-only
- `reducedMotion`: Boolean
- `enableHaptics`: Boolean
- `enableGestures`: Boolean
- `allowDuplicateImageUrls`: Boolean (v0.60.6) - Allow storing same image URL from different blogs
- `maxStoredNotes`: Integer (v0.80.0) - Maximum notes to store per image (default 50, range 10-200)
- `blogFilterLimit`: Integer (v0.80.0) - Number of blogs to show in Stored Images filter (default 20, range 5-100)

### Posts Table
User-created posts:
- `type`: text/photo/quote/link/video/audio
- `content`: Post content
- `tags`: JSON array of tags
- `timestamp`: Post creation time
- `published`: Boolean (published/draft)

### Blogs Table
User-created blog pages:
- `name`: Unique blog identifier
- `title`: Blog display title
- `description`: Blog description
- `url`: Blog URL
- `avatar`: Blog avatar image
- `headerImage`: Blog header banner
- `theme`: Blog theme name
- `posts`: Post count
- `followers`: Follower count

### StoredImage Table (v0.80.0 Updated)
Permanently stored images saved by users:
- `id`: Unique identifier (UUID)
- `userId`: User who stored the image
- `postId`: Original Tumblr post ID
- `blogName`: Source blog name
- `url`: Image URL
- `width`: Image width (pixels)
- `height`: Image height (pixels)
- `tags`: JSON array of tags
- `description`: Image caption/description
- `notes`: Engagement count (integer)
- `notesData`: JSON array of actual notes (v0.80.0) - stores real likes, reblogs, comments
- `cost`: Monetary value in dollars (Float, optional)
- `timestamp`: Original post creation time
- `storedAt`: When user stored the image

**Notes Data Structure (v0.80.0):**
```json
[
  {
    "type": "like|reblog|comment|posted",
    "blog_name": "username",
    "avatar_url": {"64": "https://..."},
    "timestamp": 1234567890,
    "reply_text": "optional comment",
    "reblog_parent_blog_name": "optional"
  }
]
```
- Limited by `UserPreferences.maxStoredNotes` (default 50)
- Includes blog name, avatar, timestamp, comment text
- Reduces database size while preserving essential data

**Unique Constraints:**
- `@@unique([userId, postId])` - Prevents storing same post twice

**Deduplication (v0.60.5-v0.60.6):**
- URL-based deduplication prevents storing same image from different blogs (reblogs)
- User-controlled via `UserPreferences.allowDuplicateImageUrls` setting
- Default: Strict mode (no duplicate URLs)
- Optional: Allow duplicates mode (same image from different blogs OK)

**Indexes:**
- `(userId)` - Fast user queries
- `(userId, url)` - Fast duplicate URL detection (v0.60.5)
- `(blogName)` - Filter by blog
- `(storedAt)` - Sort by storage date
- `(timestamp)` - Sort by original post date

### Additional Tables
- **Drafts**: Unpublished post drafts
- **SavedPost**: User's saved posts
- **LikedPost**: User's liked posts  
- **Follow**: User follow relationships
- **SearchHistory**: User's search queries

### ApiCallStats Table (v0.82.0+)

Persistent tracking of Tumblr API usage for quota monitoring:

```sql
ApiCallStats {
  id        String   @id @default(uuid())
  date      String   @unique  // Format: "YYYY-MM-DD"
  count     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Purpose:**
- Track daily API call usage
- Persist across server restarts
- Historical data for analytics
- Rate limit monitoring

**Auto-Management:**
- Auto-creates today's record on first API call
- Auto-increments on each Tumblr API request
- Auto-resets at midnight (new date record)
- Old records retained for historical analysis

**Query Examples:**
```typescript
// Get today's stats
const today = new Date().toISOString().split('T')[0];
const stats = await prisma.apiCallStats.findUnique({
  where: { date: today }
});

// Get last 7 days
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const history = await prisma.apiCallStats.findMany({
  where: {
    createdAt: { gte: weekAgo }
  },
  orderBy: { date: 'desc' }
});
```

---

### OAuth Fields in User Table (v0.82.0+)

Tumblr OAuth 1.0a integration fields:

```sql
User {
  // ... existing fields ...
  
  // OAuth Fields
  tumblrOAuthToken       String?   // Access token
  tumblrOAuthTokenSecret String?   // Access token secret
  tumblrUsername         String?   // Tumblr username
  tumblrConnectedAt      DateTime? // Connection timestamp
}
```

**Security Notes:**
- Tokens encrypted in transit (HTTPS)
- Never exposed to frontend
- Used only in backend API calls
- Revoked on disconnect

**See `OAUTH_GUIDE.md` for complete OAuth documentation.**

---

### Notes Data JSON Schema

The `StoredImage.notesData` field stores notes as a JSON array:

```typescript
interface NoteData {
  // Note type
  type: 'like' | 'reblog' | 'comment' | 'posted';
  
  // User who created the note
  blog_name: string;
  
  // User avatar (optional)
  avatar_url?: {
    64?: string;  // 64x64 avatar URL
  };
  
  // When the note was created
  timestamp?: number;  // Unix timestamp
  
  // Comment text (for reblogs with comments)
  reply_text?: string;
  
  // Parent blog for reblogs
  reblog_parent_blog_name?: string;
}
```

**Example:**
```json
[
  {
    "type": "like",
    "blog_name": "photoarchive",
    "avatar_url": {
      "64": "https://64.media.tumblr.com/avatar_123.jpg"
    },
    "timestamp": 1698345600
  },
  {
    "type": "comment",
    "blog_name": "artlover",
    "reply_text": "Beautiful photo!",
    "timestamp": 1698345650
  },
  {
    "type": "reblog",
    "blog_name": "reblogger",
    "reblog_parent_blog_name": "photoarchive",
    "timestamp": 1698345700
  }
]
```

**Limitations:**
- Limited by `UserPreferences.maxStoredNotes` (default 50, range 10-200)
- Reduces database size while preserving essential data
- Includes all note types: likes, reblogs, comments, original posts

**Storage Size:**
```
Average note: ~150 bytes
50 notes: ~7.5 KB per image
1000 images: ~7.5 MB total (acceptable)
```

---

## Authentication System

### Registration
```typescript
// Create a new user
const user = await AuthService.register({
  email: 'user@example.com',
  username: 'myusername',
  password: 'securepassword',
  displayName: 'My Name' // optional
});
```

### Login
```typescript
// Login with email or username
const session = await AuthService.login({
  emailOrUsername: 'user@example.com', // or 'myusername'
  password: 'securepassword'
});
```

### Password Security
- Passwords are hashed using **bcrypt** with 12 salt rounds
- Never stored in plain text
- Validated on every login attempt
- Password strength requirements:
  - Minimum 8 characters
  - At least one letter
  - At least one number
  
### Email Verification
- New accounts receive a verification email (in dev: check console)
- Users must verify email to access all features
- Verification tokens are unique and secure
- Can resend verification emails

### Password Reset
- Secure password reset via email token
- Tokens expire after 1 hour
- Prevents account enumeration attacks
- Can request reset by email or username

### Account Recovery
- Find account by email address
- Returns masked username for security
- Helps users recover forgotten usernames

## User Data Management

### Preferences
```typescript
// Get user preferences
const prefs = await PreferencesService.getPreferences(userId);

// Update preferences
await PreferencesService.updatePreferences(userId, {
  theme: 'dark',
  viewMode: 'images-only',
  fontSize: 18
});
```

### Posts
```typescript
// Create a post
const post = await PostsService.createPost(userId, {
  type: 'photo',
  content: 'https://example.com/image.jpg',
  tags: ['photography', 'nature'],
  published: true
});

// Get user's posts
const posts = await PostsService.getUserPosts(userId, {
  limit: 20,
  offset: 0,
  publishedOnly: true
});

// Like a post
await PostsService.likePost(userId, postId);

// Save a post
await PostsService.savePost(userId, postId);
```

### Stored Images
```typescript
// Store images with optional cost
const result = await fetch('/api/stored-images', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-id',
    images: [{
      postId: '123',
      blogName: 'photo-blog',
      url: 'https://example.com/image.jpg',
      width: 1920,
      height: 1080,
      tags: ['art', 'digital'],
      description: 'Amazing artwork',
      notes: 1234,
      cost: 49.99, // Optional: monetary value
      timestamp: new Date()
    }]
  })
});

// Update image cost
await fetch('/api/stored-images/image-id', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-id',
    cost: 79.99
  })
});

// Get stored images with stats
const stats = await fetch('/api/stored-images/user-id/stats');
// Returns: { total: 100, totalCost: 1234.56, byBlog: [...] }
```

## User Roles & Permissions

### Role Types
- **USER**: Standard user with basic permissions
- **MODERATOR**: Can moderate content and view system stats
- **ADMIN**: Full system access including user management

### Admin Functions
Admins can:
- View all users
- Update user roles
- Delete users (except themselves)
- View system statistics
- Manage content across the platform

## Database Configuration

### PostgreSQL Setup
The application connects to PostgreSQL using an environment variable:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Example for local development:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/tumblr_dev"
```

**Note**: Database credentials are excluded from git via `.gitignore`.

## Prisma Commands

### Generate Prisma Client
```bash
npx prisma generate
```

### Run Migrations
```bash
npm run db:migrate
# or
npx prisma migrate dev
```

### Seed Database with Test Data
```bash
npm run db:seed
```

Test accounts created by seed:
- **Admin**: `admin@tumblr.local` / `admin` / `Admin123!`
- **Test User**: `test@tumblr.local` / `testuser` / `Test123!`
- **Moderator**: `moderator@tumblr.local` / `moderator` / `Mod123!`

### View Database
```bash
npm run db:studio
# or
npx prisma studio
```

### Reset Database (⚠️ Deletes all data)
```bash
npm run db:reset
```

## Session Management

- User sessions are stored in **localStorage** using the user ID
- Sessions persist across browser refreshes
- Logout clears the session from localStorage

## Data Privacy & Security

- All passwords are hashed with bcrypt (12 salt rounds)
- Email verification tokens are cryptographically secure
- Password reset tokens expire after 1 hour
- User sessions are tracked with `lastLoginAt`
- Role-based access control for sensitive operations
- Database can be backed up using PostgreSQL tools (`pg_dump`)

## Production Deployment

### Environment Variables
Set these in production:
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="app-password"
EMAIL_FROM="noreply@yourdomain.com"
SESSION_SECRET="your-secure-random-string"
BASE_URL="https://yourdomain.com"
```

### Database Migrations
Always run migrations in production:
```bash
npx prisma migrate deploy
```

### Backups
Regular PostgreSQL backups recommended:
```bash
pg_dump -U username -d database_name -F c -b -v -f backup.dump
```

## API Endpoints for Stored Images (v0.81.0)

### Check if Post is Stored (Optimized)
```typescript
GET /api/stored-images/:userId/post/:postId

// Response:
{
  "stored": boolean,
  "image"?: {
    id, postId, blogName, url, width, height,
    tags, description, notes, notesData, cost,
    timestamp, storedAt
  }
}

// Purpose: Fast O(1) lookup for ImageViewer optimization
// Index used: @@unique([userId, postId])
// Use case: Check if image is stored before making Tumblr API call
```

**Performance:**
- Uses Prisma's `findUnique` with compound index
- O(1) database query time
- Enables smart API quota conservation
- Returns full image data including parsed notes

### Get All Stored Images (Paginated)
```typescript
GET /api/stored-images/:userId?limit=50&offset=0&blogName=optional

// Response:
{
  "images": StoredImage[],
  "total": number,
  "limit": number,
  "offset": number
}
```

### Store Multiple Images
```typescript
POST /api/stored-images
Body: {
  userId: string,
  images: [{
    postId, blogName, url, width, height,
    tags, description, notes, notesData, cost,
    timestamp
  }]
}

// Handles deduplication automatically
// Respects user's allowDuplicateImageUrls preference
// Limits notesData to user's maxStoredNotes setting
```

## Future Enhancements

Potential features to add:
- [ ] Two-factor authentication (2FA)
- [ ] OAuth providers (Google, GitHub, etc.)
- [ ] Database encryption at rest
- [ ] Automated backup system
- [ ] Data export/import functionality
- [ ] Audit logging for admin actions

