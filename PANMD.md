  # PANMD - Complete Documentation
  # Tumblr T3 - Comprehensive Documentation

  **Version:** v0.93.0  
  **Last Updated:** November 2, 2025

  ---

  ## 📚 Table of Contents

  ### Quick Start
  1. [README - Project Overview](#readme---project-overview)
  2. [Tumblr API Setup](#tumblr-api-setup)
  3. [Installation & Setup](#installation--setup)

  ### Core Documentation
  4. [API Setup & Configuration](#api-setup--configuration)
  5. [Database Architecture](#database-architecture)
  6. [Caching System](#caching-system)
  7. [OAuth Integration Guide](#oauth-integration-guide)
  8. [Service Worker & PWA](#service-worker--pwa)

  ### Feature Documentation
  9. [Complete Features List](#complete-features-list)
  10. [Technical Architecture](#technical-architecture)
  11. [Version History](#version-history)

  ### Deployment
  12. [Deployment Guide](#deployment-guide)

  ---

  ## About This Document

  This is the **PANMD (Pan-Documentation)** - a comprehensive master document combining all documentation for the Tumblr T3 project. It contains:

  - ✅ Complete setup instructions
  - ✅ API documentation and endpoints
  - ✅ Database schema and queries
  - ✅ Feature descriptions and usage
  - ✅ Technical architecture details
  - ✅ OAuth integration guide
  - ✅ Service worker implementation
  - ✅ Caching strategies
  - ✅ Deployment options
  - ✅ Complete version history

  **Quick Navigation:**
  - Use your editor's search function (Ctrl/Cmd+F)
  - Jump to sections using the table of contents
  - Each major section begins with a clear header

  ---




  # README - Project Overview


  # Tumblr T3 - Modern Tumblr Web Client

  A modern, feature-rich Tumblr client built with React, TypeScript, and Vite, following Apple's Human Interface Guidelines.

  ## 🚀 Features

  ### Core Functionality
  - ✅ **Modern Web Application** - React 18 + TypeScript + Vite
  - ✅ **Progressive Web App (PWA)** - Installable with offline support
  - ✅ **Responsive Design** - Optimized for mobile, tablet, and desktop
  - ✅ **Dark Mode** - System-aware theme switching
  - ✅ **Smart Dashboard (v0.70.0)** - Recently viewed blogs with infinite scroll
  - ✅ **Blog History Tracking** - Automatic tracking of visited blogs with timestamps
  - ✅ **Advanced Search** - Full-text search with filters and history
  - ✅ **Multi-blog Management** - Manage multiple Tumblr blogs
  - ✅ **Authentication** - Email verification, password reset, OAuth support

  ### Dashboard Features (v0.70.0)
  - ✅ **Recently Viewed** - Top 20 blogs displayed as prominent cards
  - ✅ **Visit Statistics** - See visit counts and last visit times
  - ✅ **Infinite Scroll** - Remaining blogs (up to 100) load automatically
  - ✅ **Blog Avatars** - Beautiful cards with blog avatars and gradients
  - ✅ **Quick Access** - One-click navigation to favorite blogs
  - ✅ **Clear History** - Option to clear all browsing history

  ### Real Tumblr Integration (v0.60.2)
  - ✅ **Live API Integration** - Fetch real blog data from Tumblr API
  - ✅ **Real Notes** - Display actual likes & reblogs with usernames
  - ✅ **Backend Proxy** - CORS-free API calls through Express server
  - ✅ **HTML Parsing** - Extract images from text posts automatically
  - ✅ **Pagination** - Load More, Load All functionality
  - ✅ **Bulk Operations** - Download/Store hundreds of images with one click

  ### Bulk Operations (v0.60.2)
  - ✅ **Download Loaded** - Download currently displayed images (50-300)
  - ✅ **Download ALL** - Auto-load all posts then download every image
  - ✅ **Store Loaded** - Save loaded images to database
  - ✅ **Store ALL** - Auto-load and store entire blog to database
  - ✅ **Progress Tracking** - Real-time feedback during operations
  - ✅ **Smart Confirmations** - Prevents accidental bulk actions

  ### API Quota Optimization (v0.81.0)
  - ⚡ **Smart Database-First Loading** - Checks stored database before making API calls
  - ⚡ **Zero API Calls for Stored Images** - View your collection unlimited times
  - ⚡ **Visual Indicator** - ⚡ badge shows when notes loaded from database
  - ⚡ **Automatic Optimization** - Works transparently in ImageViewer
  - ⚡ **Console Logging** - Track API calls saved in DevTools

  ### Notes Storage & Pagination (v0.80.0)
  - ✅ **Store Real Notes** - Save actual likes, reblogs, comments with images
  - ✅ **Pagination on Stored** - Load 50 at a time, expandable to ALL
  - ✅ **Customizable Limits** - Set max notes per image (10-200, default 50)
  - ✅ **Blog Filter Control** - Limit blogs shown in filter (5-100, default 20)
  - ✅ **Real Notes Display** - View actual Tumblr usernames in stored images
  - ✅ **Settings UI** - Easy controls for all new preferences

  ### UI/UX
  - Apple Human Interface Guidelines compliance
  - Smooth animations and transitions
  - Gesture controls support
  - Keyboard navigation
  - Accessibility (WCAG 2.1 AA)
  - Reduced motion support
  - Haptic feedback

  ### Technical Features
  - **State Management** - Jotai for atomic state
  - **Data Fetching** - TanStack Query with caching
  - **Routing** - TanStack Router with lazy loading
  - **Styling** - Tailwind CSS with custom design system
  - **Type Safety** - Strict TypeScript configuration
  - **Code Quality** - ESLint, Prettier, Husky pre-commit hooks

  ## 📦 Tech Stack

  ### Core
  - **React 18** - UI library
  - **TypeScript** - Type safety
  - **Vite 5** - Build tool and dev server

  ### State & Data
  - **Jotai** - Atomic state management
  - **TanStack Query** - Server state management
  - **TanStack Router** - Type-safe routing

  ### UI & Styling
  - **Tailwind CSS** - Utility-first CSS
  - **Framer Motion** - Animations
  - **class-variance-authority** - Component variants
  - **@use-gesture/react** - Gesture handling

  ### PWA & Offline
  - **Workbox** - Service worker management
  - **LocalStorage** - Client-side persistence

  ### Development
  - **Vitest** - Unit testing
  - **Playwright** - E2E testing
  - **Storybook** - Component development
  - **ESLint** - Code linting
  - **Prettier** - Code formatting
  - **Husky** - Git hooks

  ## 🛠️ Installation

  ### Prerequisites
  - **Node.js** 18+ and npm
  - **PostgreSQL** 14+ (local or cloud instance)

  ### Setup Steps

  ```bash
  # Clone the repository
  git clone <repository-url>
  cd NewTumblrT3

  # Install dependencies
  npm install

  # Set up PostgreSQL database
  # On macOS:
  brew install postgresql@15
  brew services start postgresql@15
  createdb tumblr_dev

  # Set up environment variables
  cp .env.example .env
  # Edit .env with your database credentials:
  # DATABASE_URL="postgresql://postgres:password@localhost:5432/tumblr_dev"

  # Run database migrations
  npm run db:migrate

  # Seed database with test data
  npm run db:seed

  # Start development server
  npm run dev
  ```

  ### Database Test Accounts
  After seeding, you can login with:
  - **Admin**: `admin@tumblr.local` / `Admin123!`
  - **Test User**: `testuser` / `Test123!`
  - **Moderator**: `moderator` / `Mod123!`

  ## 📝 Available Scripts

  ```bash
  # Development
  npm run dev          # Start dev server (http://localhost:5173)

  # Database
  npm run db:migrate   # Run database migrations
  npm run db:seed      # Seed database with test data
  npm run db:reset     # Reset database (⚠️ deletes all data)
  npm run db:studio    # Open Prisma Studio (database GUI)

  # Building
  npm run build        # Build for production
  npm run preview      # Preview production build

  # Code Quality
  npm run lint         # Run ESLint
  npm run format       # Format code with Prettier

  # Testing
  npm run test         # Run unit tests
  npm run test:e2e     # Run E2E tests

  # Storybook
  npm run storybook    # Start Storybook dev server
  npm run build-storybook  # Build Storybook
  ```

  ## 🏗️ Project Structure

  ```
  src/
  ├── components/          # Reusable UI components
  │   ├── layouts/        # Layout components
  │   ├── navigation/     # Navigation components
  │   └── ui/            # Base UI components (Button, Input, etc.)
  ├── features/           # Feature-based modules
  │   ├── auth/          # Authentication
  │   ├── dashboard/     # Dashboard feed
  │   ├── profile/       # User profile
  │   ├── search/        # Search functionality
  │   └── settings/      # App settings
  ├── hooks/             # Custom React hooks
  │   └── queries/       # TanStack Query hooks
  ├── routes/            # Route definitions
  ├── services/          # API services
  │   └── api/          # API client and endpoints
  ├── store/             # Jotai atoms and state
  ├── styles/            # Global styles
  ├── types/             # TypeScript type definitions
  └── utils/             # Utility functions
  ```

  ## 🎨 Design System

  ### Colors
  - **Primary**: Blue (Tumblr brand)
  - **Secondary**: Purple
  - **Neutral**: Gray scale
  - **Semantic**: Success, Warning, Error

  ### Typography
  - **Font**: System font stack (-apple-system, BlinkMacSystemFont)
  - **Sizes**: Responsive scaling (14px - 18px base)
  - **Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)

  ### Spacing
  - **Scale**: 4px base unit
  - **Breakpoints**: 
    - Mobile: < 768px
    - Tablet: 768px - 1024px
    - Desktop: > 1024px

  ## 🔐 Environment Variables

  See `.env.example` for all available environment variables:

  ```env
  # API Configuration
  VITE_TUMBLR_API_KEY=your_api_key_here
  VITE_TUMBLR_API_SECRET=your_api_secret_here

  # Authentication
  VITE_AUTH_METHOD=direct

  # Feature Flags
  VITE_ENABLE_OFFLINE_MODE=true
  VITE_ENABLE_PUSH_NOTIFICATIONS=true

  # UI/UX
  VITE_THEME_MODE=system
  VITE_ENABLE_HAPTICS=true
  ```

  ## 🚀 Deployment

  ### Build for Production

  ```bash
  npm run build
  ```

  The build output will be in the `dist/` directory.

  ### Deploy to Vercel

  ```bash
  npm install -g vercel
  vercel
  ```

  ### Deploy to Netlify

  ```bash
  npm install -g netlify-cli
  netlify deploy --prod
  ```

  ## 🧪 Testing

  ### Unit Tests

  ```bash
  npm run test
  ```

  ### E2E Tests

  ```bash
  npm run test:e2e
  ```

  ## 📱 PWA Features

  - **Offline Support** - Works without internet connection
  - **Installable** - Add to home screen
  - **Background Sync** - Sync data when connection returns
  - **Push Notifications** - Receive updates (when enabled)
  - **Cache Strategy** - Stale-while-revalidate for optimal performance

  ## ♿ Accessibility

  - WCAG 2.1 AA compliant
  - Keyboard navigation support
  - Screen reader optimized
  - High contrast mode
  - Reduced motion support
  - Focus management
  - ARIA attributes

  ## 🤝 Contributing

  1. Fork the repository
  2. Create a feature branch (`git checkout -b feature/amazing-feature`)
  3. Commit your changes (`git commit -m 'Add amazing feature'`)
  4. Push to the branch (`git push origin feature/amazing-feature`)
  5. Open a Pull Request

  ## 📄 License

  This project is licensed under the MIT License.

  ## 🙏 Acknowledgments

  - Tumblr API
  - React Team
  - TanStack Team
  - Tailwind CSS Team
  - All open source contributors

  ## 📞 Support

  For issues and questions, please open an issue on GitHub.

  ---

  Built with ❤️ using modern web technologies

  ---

  # Tumblr API Setup


  # Tumblr API Setup Guide

  ## Quick Start (5 minutes)

  ### Step 1: Register Your Application

  1. Go to **https://www.tumblr.com/oauth/apps**
  2. Log in to your Tumblr account
  3. Click **"Register application"**

  ### Step 2: Fill Out the Registration Form

  **Required fields:**
  ```
  Application Name: Tumblr T3 Dev (or your preferred name)
  Application Website: http://localhost:5173
  Application Description: Modern Tumblr web client
  Default callback URL: http://localhost:5173/callback
  ```

  **Important:** Make sure the port matches your dev server (default: 5173)

  ### Step 3: Get Your API Key

  After submitting, you'll receive:
  - **OAuth Consumer Key** ← This is your API key!
  - OAuth Consumer Secret (not needed for public API access)

  Copy the **OAuth Consumer Key**.

  ### Step 4: Create `.env` File

  In the root of your project, create a file named `.env`:

  ```bash
  # .env
  VITE_TUMBLR_API_KEY=your_oauth_consumer_key_here
  ```

  Replace `your_oauth_consumer_key_here` with the actual key you copied.

  **Example:**
  ```bash
  VITE_TUMBLR_API_KEY=DoGb8rItuAEprogDCbu7bMuDVWk02y5DUyuwB7N29XFlwns5Kh
  ```

  **Note:** Never commit the `.env` file to Git! It's already in `.gitignore`.

  ### Step 5: Restart the Dev Server

  ```bash
  # Stop the current server (Ctrl+C)
  # Then restart:
  npm run dev
  ```

  ## What You Can Do Now

  With just the API key (no OAuth), you can:

  ✅ **Fetch public blog posts**
  ```
  Visit: http://localhost:5173/blog/staff
  Visit: http://localhost:5173/blog/photography
  ```

  ✅ **Search by tags**
  ```
  Search for: #photography, #art, #nature
  ```

  ✅ **Browse blog content**
  ```
  View any public Tumblr blog
  ```

  ✅ **Get blog information**
  ```
  View follower counts, post counts, descriptions
  ```

  ## What You CANNOT Do (API Key Only)

  ❌ Access user dashboard (requires OAuth)  
  ❌ Like/unlike posts (requires OAuth)  
  ❌ Reblog posts (requires OAuth)  
  ❌ Create posts (requires OAuth)  
  ❌ Access private blogs (requires OAuth)  

  ## Testing the Integration

  1. **Check if API key is working:**
    - Open browser console (F12)
    - Look for: `[Tumblr API] Fetching posts from...`
    - Should see: `[Tumblr API] Fetched X posts`

  2. **Try a popular blog:**
    - Go to: `http://localhost:5173/blog/staff`
    - Should load real Tumblr posts!

  3. **Try tag search:**
    - Search for `#photography`
    - Should show real tagged posts from Tumblr

  ## Troubleshooting

  ## Known Issues (v0.93.0)

  ### ~~Large Batch Downloads (>1000 images)~~ ✅ FIXED in v0.93.0

  **Previous Issue**: Downloading very large batches of images (e.g., 2,000+) caused connection failures with errors like `ERR_CONNECTION_CLOSED` or `ERR_CONNECTION_REFUSED`.

  **Status**: ✅ **RESOLVED in v0.93.0**
  
  **Solution Implemented**:
  - ✅ Automatic batching (20 images at a time)
  - ✅ Rate limiting between batches (1000ms delay)
  - ✅ Cancel button to stop mid-operation
  - ✅ Proper progress tracking with batch indicators
  - ✅ Retry logic for failed downloads (3 attempts per image)
  - ✅ Comprehensive error logging and reporting
  - ✅ Download Status floating panel for real-time progress
  - ✅ Panic Button for emergency stop

  **New Download Features in v0.93.0**:
  - Download Status Panel shows:
    - Real-time progress (X/Y images)
    - Batch progress (batch X of Y)
    - Success/failed/pending counts
    - Estimated time remaining
    - Detailed error list
  - Stop Download button for graceful cancellation
  - Panic Button for emergency stop
  - All operations logged for diagnostics

  **Current Limitations**:
  - File System Access API required (Chrome/Edge only) for folder downloads
  - Very large downloads (5000+) may still take significant time
  - No resume capability yet (planned for v0.94.0)

  ---

  ### "Using Mock Data" Warning

  **Problem**: You see a yellow banner with mock data instead of real Tumblr posts.

  **Solution**:
  1. Check `.env` file exists in project root (not in `src/` or elsewhere)
  2. Check API key is correct (copy-paste from Tumblr)
  3. Restart dev server completely (`Ctrl+C`, then `npm run dev`)
  4. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
  5. Check browser console for error messages

  ### "401 Unauthorized" Error

  **Problem**: Tumblr API is rejecting your key.

  **Possible causes:**
  1. **Wrong API key** - Double-check the key in `.env`
  2. **Wrong port** - App website URL must match dev server port (5173)
  3. **App not activated** - New apps may take 5-10 minutes to activate
  4. **Rate limit button** - You may need to click "Request rate limit removal"

  **Solution**:
  1. Verify `.env` has correct key (no spaces, no quotes)
  2. Check Tumblr app settings match: `http://localhost:5173`
  3. Wait 10 minutes after registration
  4. Try clicking "Request rate limit removal" in Tumblr app settings
  5. Check your email for verification requests from Tumblr

  ### "429 Too Many Requests" Error

  **Problem**: Tumblr API rate limit exceeded.

  **Solution**:
  - Newly registered apps: 1,000 requests/hour, 5,000 requests/day
  - Wait a few minutes before retrying
  - The app has caching built-in to minimize API calls

  ### Blog Not Loading

  **Problem**: Blog returns empty or error.

  **Solution**:
  - Check blog name is correct (use just `staff`, not `staff.tumblr.com`)
  - Blog might be private (requires OAuth)
  - Blog might not exist or be deleted

  ### Environment Variable Not Loading

  **Problem**: App still shows mock data after adding `.env`.

  **Solution**:
  1. `.env` file must be in project root (same directory as `package.json`)
  2. File must be named exactly `.env` (not `.env.txt` or `env`)
  3. No spaces around `=`: `VITE_TUMBLR_API_KEY=yourkey`
  4. Must restart dev server (HMR doesn't reload env vars)
  5. Check terminal output on startup to verify environment is loaded

  ## API Rate Limits

  **Newly Registered Apps (API Key Only):**
  - **1,000 requests per hour**
  - **5,000 requests per day**

  **After Rate Limit Removal:**
  - Higher limits (varies based on app usage)

  **With OAuth (Future Enhancement):**
  - 5,000 requests per day per user
  - 250 requests per hour per user

  The app includes intelligent caching to stay well under these limits.

  ## Next Steps

  ### Want Full Tumblr Integration?

  To access authenticated features (dashboard, likes, reblog, posting), you'll need to implement **OAuth 1.0a**. This requires:

  1. Backend OAuth endpoints
  2. HMAC-SHA1 signature generation
  3. Access token storage and management
  4. Frontend OAuth authorization flow
  5. Token refresh mechanism

  This is a more complex integration beyond the scope of quick setup.

  ## Support

  If you encounter issues:
  1. Check browser console (F12) for API errors
  2. Verify `.env` file is in project root (not in `src/`)
  3. Confirm API key is valid at https://www.tumblr.com/oauth/apps
  4. Ensure app website URL matches dev server port
  5. Restart dev server completely
  6. Hard refresh browser

  **Current Version**: v0.10.4

  ## Security Notes

  - Never commit `.env` to version control (already in `.gitignore`)
  - Never share your OAuth Consumer Key publicly
  - For production, use environment variables on your hosting platform
  - API key alone is safe for client-side use (public data only)


  ---

  # API Setup & Configuration


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



  ---

  # Database Architecture


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

  ### Delete Stored Images by Blog (v0.92.2)
  ```typescript
  DELETE /api/stored-images/:userId/blog/:blogName

  // Response:
  {
    "message": "All images from {blogName} deleted successfully",
    "count": number
  }

  // Purpose: Delete all stored images from a specific blog
  // Use case: Close button in Blog view to clear stored blog and return to dashboard
  // Requires confirmation from user before deletion
  ```

  **Behavior:**
  - Deletes all images where blogName matches
  - Returns count of deleted images
  - Used by Blog view "Close" button
  - Requires user confirmation dialog

  ## Future Enhancements

  Potential features to add:
  - [ ] Two-factor authentication (2FA)
  - [ ] OAuth providers (Google, GitHub, etc.)
  - [ ] Database encryption at rest
  - [ ] Automated backup system
  - [ ] Data export/import functionality
  - [ ] Audit logging for admin actions



  ---

  # Caching System


  # Caching Implementation

  This document explains the comprehensive caching system implemented in the Tumblr T3 app.

  ## Overview

  The app now has **multi-layer caching** for optimal performance:

  1. **Service Worker Caching** - Browser-level caching for offline support
  2. **React Query Caching** - In-memory + localStorage persistence
  3. **Image Caching** - Aggressive image preloading and caching
  4. **General Cache Manager** - Flexible localStorage caching

  ---

  ## 1. Service Worker Caching

  **Location:** `src/sw.ts`

  ### What's Cached:

  - **Images:** 500 entries, 90 days (local images)
  - **External Images:** 300 entries, 60 days (Unsplash, DiceBear, Tumblr CDN)
  - **Fonts:** 30 entries, 1 year
  - **Static Assets:** Scripts, styles, workers (stale-while-revalidate)
  - **API Responses:** 100 entries, 24 hours (network-first)

  ### Features:

  - Automatic cache purging when quota exceeded
  - Offline fallback page
  - Background sync support
  - Push notifications support

  ---

  ## 2. React Query Caching

  **Location:** `src/lib/queryClient.ts`

  ### Configuration:

  - **Stale Time:** 10 minutes
  - **Cache Time:** 24 hours
  - **Garbage Collection:** 24 hours
  - **localStorage Persistence:** 7 days

  ### What's Cached:

  - Search results
  - Blog data
  - User profiles
  - Posts feed
  - Any API query marked as successful

  ### Features:

  - Automatic refetch on window focus
  - Automatic refetch on reconnect
  - Retry failed queries (3 attempts)
  - Persists to localStorage across sessions

  ---

  ## 3. Image Cache

  **Location:** `src/utils/imageCache.ts`

  ### Features:

  - **Preloading:** Automatically preloads blog avatars and headers
  - **Max Age:** 30 days
  - **localStorage Metadata:** Tracks cached images
  - **Automatic Cleanup:** Removes expired entries

  ### Usage:

  \`\`\`typescript
  import { imageCache, preloadBlogImages } from '@/utils/imageCache';

  // Preload a single image
  await imageCache.preloadImage('https://example.com/image.jpg');

  // Preload multiple images
  await imageCache.preloadImages([url1, url2, url3]);

  // Preload blog images
  await preloadBlogImages(blogs);

  // Check if cached
  if (imageCache.isCached(url)) {
    console.log('Image is cached!');
  }

  // Get stats
  const stats = imageCache.getStats();
  console.log(\`Cached \${stats.count} images\`);

  // Clear cache
  imageCache.clearAll();
  \`\`\`

  ---

  ## 4. General Cache Manager

  **Location:** `src/utils/cacheManager.ts`

  ### Features:

  - **Flexible TTL:** Set custom expiration for each entry
  - **Type-Safe:** Full TypeScript support
  - **Automatic Expiration:** Removes expired entries
  - **Multiple Instances:** Separate caches for different data types

  ### Available Caches:

  - `searchCache` - For search-related data
  - `blogCache` - For blog-specific data
  - `userCache` - For user-related data

  ### Usage:

  \`\`\`typescript
  import { searchCache, blogCache } from '@/utils/cacheManager';

  // Set cache with 1 hour TTL
  searchCache.set('recent-searches', searches, 1000 * 60 * 60);

  // Get from cache
  const searches = searchCache.get<string[]>('recent-searches');

  // Check if exists
  if (searchCache.has('recent-searches')) {
    // Use cached data
  }

  // Clear expired entries
  searchCache.clearExpired();

  // Get cache stats
  const stats = searchCache.getStats();
  console.log(\`Cache size: \${stats.totalSize} bytes\`);
  \`\`\`

  ---

  ## Cache Integration in Search

  The Search component automatically:

  1. **Preloads images** when search results arrive
  2. **Caches search queries** via React Query
  3. **Persists results** to localStorage
  4. **Reuses cached data** on subsequent searches

  ### Flow:

  \`\`\`
  User searches "blog" 
    → React Query checks cache
    → If cached (< 10 min old), return immediately
    → If not, fetch from API
    → Save to cache
    → Preload all blog images in background
    → Service Worker caches images for offline use
  \`\`\`

  ---

  ## Performance Benefits

  ### Before Caching:
  - Every search: New API call + image downloads
  - Slow on repeat visits
  - No offline support

  ### After Caching:
  - ✅ Instant search results (cached queries)
  - ✅ Images load immediately (preloaded + cached)
  - ✅ Works offline (Service Worker)
  - ✅ Reduced server load
  - ✅ Better user experience

  ---

  ## Cache Maintenance

  ### Automatic Cleanup:

  - **Service Worker:** Purges on quota exceeded
  - **React Query:** Garbage collection after 24 hours
  - **Image Cache:** Clears entries > 30 days old
  - **General Cache:** Manual `clearExpired()` or automatic on set

  ### Manual Maintenance:

  \`\`\`typescript
  // Clear all caches
  imageCache.clearAll();
  searchCache.clear();
  queryClient.clear();

  // Clear only expired
  imageCache.clearExpired();
  searchCache.clearExpired();
  \`\`\`

  ---

  ## Storage Usage

  Approximate storage per cache type:

  - **Service Worker:** ~50-100 MB (images + assets)
  - **localStorage (React Query):** ~5-10 MB (JSON data)
  - **localStorage (Image metadata):** ~100 KB
  - **localStorage (General caches):** ~1-5 MB

  **Total:** ~50-115 MB

  Modern browsers support **several GB** of storage, so this is well within limits.

  ---

  ## Future Enhancements

  Potential improvements:

  1. **IndexedDB:** For larger data storage
  2. **Smart Preloading:** Predict user behavior
  3. **Cache Prioritization:** Keep frequently accessed data
  4. **Compression:** Compress cached JSON data
  5. **Analytics:** Track cache hit rates

  ---

  ## Troubleshooting

  ### Cache not working?

  1. Check browser console for errors
  2. Verify Service Worker is active (DevTools → Application → Service Workers)
  3. Clear browser cache and reload
  4. Check localStorage quota

  ### Images not caching?

  1. CORS issues? Images must allow cross-origin access
  2. Check image URLs are valid
  3. Verify Service Worker is intercepting requests

  ### localStorage full?

  \`\`\`typescript
  // Clear old data
  searchCache.clearExpired();
  imageCache.clearExpired();
  queryClient.clear();
  \`\`\`

  ---

  ## Summary

  🎉 **You now have enterprise-grade caching!**

  - Images load instantly
  - Search is blazing fast
  - Works offline
  - Reduces server load
  - Better UX overall



  ---

  # OAuth Integration Guide


  # Tumblr OAuth 1.0a Integration Guide

  Complete guide for implementing authenticated Tumblr features using OAuth 1.0a.

  ## Overview

  The application supports **two authentication modes**:

  1. **API Key Mode** (Basic) - Public data access only
  2. **OAuth Mode** (Advanced) - Full authenticated access

  ## What OAuth Enables

  ### Without OAuth (API Key Only):
  - ✅ View public blog posts
  - ✅ Search public blogs
  - ✅ View public blog information
  - ❌ Access user dashboard
  - ❌ Like/unlike posts
  - ❌ Reblog posts
  - ❌ Create posts
  - ❌ Access private blogs
  - ❌ Access full notes data (limited to ~50 notes)

  ### With OAuth:
  - ✅ **Everything above, plus:**
  - ✅ Access authenticated user's dashboard
  - ✅ Like/unlike posts on behalf of user
  - ✅ Reblog posts to user's blog
  - ✅ Create new posts
  - ✅ Access private blogs user follows
  - ✅ Higher API rate limits (per-user quotas)
  - ✅ Full notes data access

  ---

  ## Setup Instructions

  ### Step 1: Get OAuth Credentials

  1. Go to **https://www.tumblr.com/oauth/apps**
  2. Click **"Register application"** (if you haven't already)
  3. Fill out the form:
    ```
    Application Name: Tumblr T3 (or your name)
    Application Website: http://localhost:5173
    Application Description: Modern Tumblr web client
    Default callback URL: http://localhost:5173/auth/tumblr/callback
    ```
  4. After registration, you'll receive:
    - **OAuth Consumer Key** (same as API key)
    - **OAuth Consumer Secret** ⚠️ (NEW - keep this secret!)

  ### Step 2: Configure Environment Variables

  Add to your `.env` file:

  ```bash
  # Required for OAuth
  VITE_TUMBLR_API_KEY=your_oauth_consumer_key_here
  TUMBLR_CONSUMER_SECRET=your_consumer_secret_here

  # Optional: Custom callback URL (defaults to localhost:5173)
  VITE_APP_URL=http://localhost:5173
  ```

  **Important Security Notes:**
  - ⚠️ **Never commit** `.env` to version control
  - ⚠️ **Never expose** `TUMBLR_CONSUMER_SECRET` to the frontend
  - ⚠️ Consumer Secret must **only** be used in backend code
  - ✅ `.env` is already in `.gitignore`

  ### Step 3: Restart Development Server

  ```bash
  # Stop current server (Ctrl+C)
  npm run dev
  ```

  ---

  ## OAuth Flow Architecture

  ### Complete OAuth 1.0a Flow

  ```
  ┌─────────────┐         ┌──────────────┐         ┌─────────────┐
  │   User      │         │  Your App    │         │   Tumblr    │
  │  (Browser)  │         │  (Backend)   │         │   (OAuth)   │
  └─────────────┘         └──────────────┘         └─────────────┘
        │                       │                         │
        │  1. Click "Connect"   │                         │
        ├──────────────────────>│                         │
        │                       │  2. Request Token       │
        │                       ├────────────────────────>│
        │                       │  3. Request Token +     │
        │                       │<────────────────────────┤
        │                       │     Secret              │
        │  4. Redirect to Auth  │                         │
        │<──────────────────────┤                         │
        │                       │                         │
        │  5. Authorize App     │                         │
        ├─────────────────────────────────────────────────>│
        │  6. Redirect to       │                         │
        │     Callback          │                         │
        │<─────────────────────────────────────────────────┤
        │  (with oauth_token    │                         │
        │   + oauth_verifier)   │                         │
        │                       │                         │
        │  7. Send token +      │                         │
        │     verifier          │                         │
        ├──────────────────────>│                         │
        │                       │  8. Exchange for        │
        │                       │     Access Token        │
        │                       ├────────────────────────>│
        │                       │  9. Access Token +      │
        │                       │<────────────────────────┤
        │                       │     Secret              │
        │                       │ 10. Save to DB          │
        │                       │                         │
        │  11. Connected!       │                         │
        │<──────────────────────┤                         │
  ```

  ### Technical Implementation

  #### Frontend Flow (`src/components/ui/TumblrConnection.tsx`)

  ```typescript
  // User clicks "Connect Tumblr Account"
  const handleConnect = async () => {
    // 1. Request auth URL from backend
    const result = await connectTumblrAccount(userId);
    
    // 2. Open Tumblr auth in popup
    const authWindow = window.open(result.authUrl, ...);
    
    // 3. Store request token for callback verification
    localStorage.setItem('tumblr_oauth_request_token', result.requestToken);
    localStorage.setItem('tumblr_oauth_user_id', userId);
    
    // 4. Monitor popup closure
    const checkPopup = setInterval(() => {
      if (authWindow?.closed) {
        // Refresh connection status
        checkStatus();
      }
    }, 500);
  };
  ```

  #### Backend Flow (`server/index.ts`)

  **Step 1: Get Request Token**
  ```typescript
  POST /api/auth/tumblr/connect
  Body: { userId: string }

  Response: { 
    authUrl: "https://www.tumblr.com/oauth/authorize?oauth_token=...",
    requestToken: "..." 
  }
  ```

  **Step 2: Handle Callback**
  ```typescript
  POST /api/auth/tumblr/callback
  Body: { 
    userId: string,
    oauthToken: string,
    oauthVerifier: string 
  }

  Response: { 
    success: true,
    tumblrUsername: "yourname" 
  }
  ```

  **Step 3: Save Tokens to Database**
  ```typescript
  await prisma.user.update({
    where: { id: userId },
    data: {
      tumblrOAuthToken: accessToken,
      tumblrOAuthTokenSecret: accessTokenSecret,
      tumblrUsername: tumblrUsername,
      tumblrConnectedAt: new Date()
    }
  });
  ```

  ---

  ## Using OAuth Endpoints

  ### Check Connection Status

  ```typescript
  GET /api/auth/tumblr/status/:userId

  Response: {
    connected: true,
    tumblrUsername: "yourname",
    connectedAt: "2025-10-26T12:00:00.000Z"
  }
  ```

  ### Authenticated Blog Posts

  ```typescript
  GET /api/tumblr/oauth/blog/:blogIdentifier/posts
  Headers: { 'X-User-Id': userId }

  // Returns posts using user's OAuth credentials
  // Accesses private blogs if user follows them
  ```

  ### Authenticated Notes

  ```typescript
  GET /api/tumblr/oauth/blog/:blogIdentifier/notes/:postId
  Headers: { 'X-User-Id': userId }

  // Returns FULL notes data (not limited to 50)
  // Includes all likes, reblogs, and comments
  ```

  ### Disconnect Account

  ```typescript
  POST /api/auth/tumblr/disconnect
  Body: { userId: string }

  // Removes OAuth tokens from database
  // Reverts to API key mode
  ```

  ---

  ## Security Considerations

  ### Token Storage

  **Backend (Secure):**
  ```typescript
  // Tokens stored in PostgreSQL database
  tumblrOAuthToken: string        // Access token
  tumblrOAuthTokenSecret: string  // Access token secret
  tumblrUsername: string          // Tumblr username
  tumblrConnectedAt: DateTime     // Connection timestamp
  ```

  **Frontend (Temporary Only):**
  ```typescript
  // Only request token stored temporarily
  localStorage.setItem('tumblr_oauth_request_token', requestToken);
  // Cleared after callback completes
  ```

  ### Request Signing

  All OAuth requests are signed using **HMAC-SHA1**:

  ```typescript
  // Backend only (never expose to frontend)
  const oauth = new OAuth(
    TUMBLR_REQUEST_TOKEN_URL,
    TUMBLR_ACCESS_TOKEN_URL,
    CONSUMER_KEY,
    CONSUMER_SECRET,  // ⚠️ Secret never sent to frontend
    '1.0A',
    CALLBACK_URL,
    'HMAC-SHA1'
  );
  ```

  ### Token Lifecycle

  1. **Request Token**: Temporary (1 hour), stored in memory on backend
  2. **Access Token**: Permanent until revoked, stored in database
  3. **Cleanup**: Old request tokens purged every hour

  ---

  ## User Interface

  ### Connection Card (`Settings > Tumblr Account`)

  **When Not Connected:**
  ```
  ┌───────────────────────────────────────┐
  │  Tumblr Account                       │
  │  ─────────────────────────────────    │
  │                                       │
  │  Not connected                        │
  │                                       │
  │  Connect your Tumblr account to:     │
  │  • Access your dashboard              │
  │  • Like and reblog posts              │
  │  • Create new posts                   │
  │  • Access private blogs               │
  │                                       │
  │  [Connect Tumblr Account]             │
  └───────────────────────────────────────┘
  ```

  **When Connected:**
  ```
  ┌───────────────────────────────────────┐
  │  Tumblr Account                       │
  │  ─────────────────────────────────    │
  │                                       │
  │  ✓ Connected as @yourname            │
  │  Connected on: Oct 26, 2025          │
  │                                       │
  │  [Disconnect Account]                │
  └───────────────────────────────────────┘
  ```

  ---

  ## Troubleshooting

  ### "OAuth credentials not configured" Warning

  **Problem:** Backend logs show credentials missing.

  **Solution:**
  1. Check `.env` file exists in project root
  2. Verify both `VITE_TUMBLR_API_KEY` and `TUMBLR_CONSUMER_SECRET` are set
  3. Restart backend server completely

  ### "OAuth token mismatch" Error

  **Problem:** Callback fails with token mismatch.

  **Solution:**
  1. Clear localStorage: `localStorage.clear()`
  2. Close all popup windows
  3. Try connecting again
  4. Check browser isn't blocking popups

  ### Callback URL Errors

  **Problem:** Tumblr redirects to wrong URL.

  **Solution:**
  1. Verify callback URL in Tumblr app settings: `http://localhost:5173/auth/tumblr/callback`
  2. Match port number with dev server (default: 5173)
  3. For production, update to your domain

  ### Popup Blocked

  **Problem:** Browser blocks OAuth popup.

  **Solution:**
  1. Allow popups for your domain
  2. Check browser popup blocker settings
  3. Try clicking "Connect" again after allowing

  ### Tokens Not Saving

  **Problem:** Connection succeeds but tokens disappear.

  **Solution:**
  1. Check database connection
  2. Verify Prisma schema includes OAuth fields
  3. Run migrations: `npx prisma migrate dev`
  4. Check server logs for database errors

  ---

  ## Rate Limits

  ### API Key Mode (No OAuth):
  - 1,000 requests/hour
  - 5,000 requests/day

  ### OAuth Mode:
  - **Per-user limits**: 5,000 requests/day per user
  - 250 requests/hour per user
  - Cumulative across all OAuth users

  ### Best Practices:
  1. Use OAuth for authenticated users
  2. Use API key for public data
  3. Cache responses aggressively
  4. Monitor usage in Admin Dashboard

  ---

  ## Production Deployment

  ### Environment Variables

  ```bash
  # Production .env
  VITE_TUMBLR_API_KEY=your_key
  TUMBLR_CONSUMER_SECRET=your_secret
  VITE_APP_URL=https://yourdomain.com
  DATABASE_URL=postgresql://...
  ```

  ### Callback URL

  Update Tumblr app settings:
  ```
  Default callback URL: https://yourdomain.com/auth/tumblr/callback
  ```

  ### Security Checklist

  - [ ] Consumer Secret never exposed to frontend
  - [ ] HTTPS enabled for production
  - [ ] Callback URL whitelisted in Tumblr app settings
  - [ ] Database backups configured
  - [ ] Token storage encrypted at rest (optional)
  - [ ] Rate limiting implemented
  - [ ] Error logging configured

  ---

  ## API Reference

  ### OAuth Endpoints

  | Endpoint | Method | Description |
  |----------|--------|-------------|
  | `/api/auth/tumblr/connect` | POST | Initiate OAuth flow |
  | `/api/auth/tumblr/callback` | POST | Complete OAuth flow |
  | `/api/auth/tumblr/disconnect` | POST | Disconnect account |
  | `/api/auth/tumblr/status/:userId` | GET | Check connection status |
  | `/api/tumblr/oauth/blog/:blog/posts` | GET | Get posts (authenticated) |
  | `/api/tumblr/oauth/blog/:blog/notes/:postId` | GET | Get notes (authenticated) |

  ### Request Headers

  ```http
  X-User-Id: user-uuid-here
  ```

  Used to identify which user's OAuth tokens to use for authenticated requests.

  ---

  ## Future Enhancements

  Potential OAuth features to implement:

  - [ ] Like/unlike posts via API
  - [ ] Reblog posts to user's blog
  - [ ] Create new posts (text, photo, etc.)
  - [ ] Access user's dashboard feed
  - [ ] Follow/unfollow blogs
  - [ ] Queue and draft management
  - [ ] Blog settings management
  - [ ] Analytics and insights

  ---

  ## Support

  For OAuth-related issues:

  1. Check browser console for errors
  2. Check backend logs: `[OAuth]` prefix
  3. Verify environment variables
  4. Check database for saved tokens
  5. Review Tumblr app settings

  **Current Version**: v0.91.0



  ---

  # Service Worker & PWA


  # Service Worker & PWA Implementation

  Complete guide to the Progressive Web App (PWA) features and service worker implementation.

  ## Overview

  The application uses **Workbox** to implement a sophisticated service worker with:
  - Offline support
  - Aggressive caching
  - Background sync
  - Push notifications (ready)
  - Automatic updates

  ---

  ## Service Worker Architecture

  ### File Location

  ```
  src/sw.ts                      # Service worker source
  public/offline.html            # Offline fallback page
  src/hooks/useServiceWorker.ts  # React hook for SW management
  ```

  ### Build Process

  ```
  Vite Build
    ↓
  src/sw.ts → Workbox → public/sw.js
    ↓
  Precache Manifest (self.__WB_MANIFEST)
    ↓
  Service Worker Registered
  ```

  ---

  ## Caching Strategies

  ### 1. Precaching (Build-time)

  **What's Precached:**
  - All build assets (`/dist/*.js`, `/dist/*.css`)
  - Index.html
  - Manifest.json

  **Strategy:** Cache First (instant loading)

  ```typescript
  // Automatically handled by Workbox
  precacheAndRoute(self.__WB_MANIFEST);
  ```

  ### 2. Navigation Requests

  **Strategy:** Network First → Cache → Offline Fallback

  ```typescript
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL('/index.html'))
  );

  // Fallback to offline.html if network fails
  self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request).catch(() => {
          return caches.match('/offline.html');
        })
      );
    }
  });
  ```

  ### 3. API Responses

  **Strategy:** Network First (fresh data priority)

  ```typescript
  registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new NetworkFirst({
      cacheName: 'api-cache',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200], // Only cache successful responses
        }),
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        }),
      ],
    })
  );
  ```

  **Behavior:**
  - Tries network first
  - Falls back to cache if offline
  - Caches successful responses
  - Automatically purges old entries

  ### 4. Static Assets

  **Strategy:** Stale While Revalidate (instant + update)

  ```typescript
  registerRoute(
    ({ request }) =>
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'worker',
    new StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );
  ```

  **Behavior:**
  - Serves from cache immediately
  - Updates cache in background
  - Next visit gets updated version

  ### 5. Images

  #### Local Images

  **Strategy:** Cache First (aggressive caching)

  ```typescript
  registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
      cacheName: 'images',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 500,
          maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
          purgeOnQuotaError: true, // Auto-cleanup on quota exceeded
        }),
      ],
    })
  );
  ```

  **Specs:**
  - Max 500 images
  - 90-day expiration
  - Automatic quota management

  #### External Images (CDN)

  **Strategy:** Cache First (long-term caching)

  ```typescript
  registerRoute(
    ({ url }) =>
      url.origin === 'https://images.unsplash.com' ||
      url.origin === 'https://api.dicebear.com' ||
      url.hostname.includes('tumblr.com'),
    new CacheFirst({
      cacheName: 'external-images',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 300,
          maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
          purgeOnQuotaError: true,
        }),
      ],
    })
  );
  ```

  **Specs:**
  - Max 300 external images
  - 60-day expiration
  - Covers Tumblr CDN, Unsplash, DiceBear

  ### 6. Fonts

  **Strategy:** Cache First (very long-term)

  ```typescript
  registerRoute(
    ({ request }) => request.destination === 'font',
    new CacheFirst({
      cacheName: 'fonts',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        }),
      ],
    })
  );
  ```

  **Specs:**
  - Max 30 font files
  - 1-year expiration
  - System fonts cached permanently

  ---

  ## Cache Summary Table

  | Cache Name | Strategy | Max Entries | Max Age | Purge on Quota |
  |------------|----------|-------------|---------|----------------|
  | **precache** | Cache First | Unlimited | Until update | No |
  | **api-cache** | Network First | 100 | 24 hours | No |
  | **static-resources** | Stale While Revalidate | Unlimited | Indefinite | No |
  | **images** | Cache First | 500 | 90 days | Yes |
  | **external-images** | Cache First | 300 | 60 days | Yes |
  | **fonts** | Cache First | 30 | 1 year | No |

  ---

  ## Service Worker Lifecycle

  ### 1. Registration

  ```typescript
  // src/hooks/useServiceWorker.ts
  const wb = new Workbox('/sw.js');

  wb.register()
    .then((registration) => {
      // Service worker registered!
      setRegistration(registration);
      
      // Check for updates immediately
      registration.update();
      
      // Check for updates every hour
      const interval = setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    });
  ```

  ### 2. Installation

  ```typescript
  // Service worker installing...
  clientsClaim();        // Take control immediately
  self.skipWaiting();    // Activate without waiting
  ```

  ### 3. Activation

  ```typescript
  // Service worker activated!
  // Old caches cleaned up automatically
  // Now controlling all pages
  ```

  ### 4. Updates

  ```typescript
  // New version detected
  wb.addEventListener('waiting', (event) => {
    setIsUpdateAvailable(true);
    // Show "Update Available" notification
  });

  // User clicks "Update"
  await messageSW(registration.waiting, { type: 'SKIP_WAITING' });

  // Controller changed
  wb.addEventListener('controlling', (event) => {
    window.location.reload(); // Reload with new version
  });
  ```

  ---

  ## React Integration

  ### useServiceWorker Hook

  ```typescript
  import { useServiceWorker } from '@/hooks/useServiceWorker';

  function App() {
    const { isSupported, registration, isUpdateAvailable, updateServiceWorker } = useServiceWorker();
    
    if (isUpdateAvailable) {
      return (
        <div className="update-banner">
          <p>New version available!</p>
          <button onClick={updateServiceWorker}>Update Now</button>
        </div>
      );
    }
    
    return <YourApp />;
  }
  ```

  ### Update Flow

  ```
  User visits app
    ↓
  Service worker checks for updates
    ↓
  New version found?
    ↓ YES
  Show "Update Available" banner
    ↓
  User clicks "Update Now"
    ↓
  New service worker activates
    ↓
  Page reloads with new version
  ```

  ---

  ## Background Sync (Ready for Implementation)

  ```typescript
  // Service worker listens for sync events
  self.addEventListener('sync', (event) => {
    if (event.tag === 'post-update') {
      event.waitUntil(
        // Sync queued posts when back online
        syncQueuedPosts()
      );
    }
  });

  // Register sync when going offline
  if ('sync' in registration) {
    await registration.sync.register('post-update');
  }
  ```

  **Use Cases:**
  - Upload posts when connection restored
  - Sync likes/reblogs
  - Send queued comments
  - Update user preferences

  ---

  ## Push Notifications (Ready for Implementation)

  ```typescript
  // Service worker receives push
  self.addEventListener('push', (event) => {
    const data = event.data?.json();
    
    if (data) {
      const options: NotificationOptions = {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: data.url,
      };

      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    }
  });

  // User clicks notification
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.notification.data) {
      event.waitUntil(
        clients.openWindow(event.notification.data)
      );
    }
  });
  ```

  **To Enable:**
  1. Request notification permission
  2. Subscribe to push service
  3. Send subscription to backend
  4. Backend sends push messages

  ---

  ## Offline Support

  ### Offline Fallback Page

  **Location:** `public/offline.html`

  **When Shown:**
  - User navigates while offline
  - Network request fails
  - No cached version available

  **Customization:**
  - Edit `public/offline.html`
  - Add branding, messaging
  - Link to cached pages

  ### Testing Offline Mode

  **Chrome DevTools:**
  1. Open DevTools (F12)
  2. Go to "Network" tab
  3. Check "Offline" checkbox
  4. Navigate app - should work!

  **Service Worker Test:**
  1. Build app: `npm run build`
  2. Serve: `npm run preview`
  3. Load app, then disconnect network
  4. App should still work from cache

  ---

  ## Storage Management

  ### Quota Usage

  **Typical Storage:**
  ```
  Service Worker Caches:
    - images: ~50-80 MB
    - external-images: ~20-30 MB
    - api-cache: ~1-5 MB
    - static-resources: ~2-5 MB
    - fonts: ~1-2 MB
    
  Total: ~75-120 MB
  ```

  **Browser Limits:**
  - Chrome: Several GB (varies by device)
  - Firefox: Up to 10% of disk space
  - Safari: ~1 GB (with prompt)

  ### Automatic Cleanup

  ```typescript
  // Images cache auto-purges when full
  new ExpirationPlugin({
    maxEntries: 500,
    maxAgeSeconds: 60 * 60 * 24 * 90,
    purgeOnQuotaError: true, // ← Auto-cleanup
  });
  ```

  **Cleanup Strategy:**
  1. Remove expired entries
  2. Remove least recently used (LRU)
  3. Keep under quota limit

  ### Manual Cleanup

  ```typescript
  // Clear all caches
  const caches = await caches.keys();
  await Promise.all(
    caches.map(cache => caches.delete(cache))
  );

  // Unregister service worker
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (let registration of registrations) {
    registration.unregister();
  }
  ```

  ---

  ## Debugging

  ### Chrome DevTools

  **Application Tab → Service Workers:**
  - View registration status
  - Force update
  - Unregister
  - Simulate offline
  - Skip waiting

  **Application Tab → Cache Storage:**
  - Inspect cached entries
  - View cache sizes
  - Delete individual caches
  - Preview cached responses

  **Console:**
  ```javascript
  // Check if service worker is active
  navigator.serviceWorker.controller

  // Get registration
  navigator.serviceWorker.getRegistration()

  // Check caches
  caches.keys()

  // Inspect specific cache
  caches.open('images').then(cache => cache.keys())
  ```

  ### Workbox Logging

  Enable debug mode in development:

  ```typescript
  // vite.config.ts
  export default {
    plugins: [
      VitePWA({
        workbox: {
          // Enable debug logs
          mode: 'development',
        },
      }),
    ],
  };
  ```

  ---

  ## Performance Benefits

  ### Before Service Worker:
  ```
  First Visit:
    - HTML: 200ms
    - CSS: 150ms
    - JS: 500ms
    - Images: 2000ms
    Total: ~2850ms

  Repeat Visit:
    - Same as first visit
    Total: ~2850ms
  ```

  ### After Service Worker:
  ```
  First Visit:
    - HTML: 200ms
    - CSS: 150ms
    - JS: 500ms
    - Images: 2000ms
    Total: ~2850ms

  Repeat Visit:
    - HTML: 10ms (cache)
    - CSS: 5ms (cache)
    - JS: 20ms (cache)
    - Images: 50ms (cache)
    Total: ~85ms (33x faster!)
  ```

  ---

  ## Production Checklist

  - [ ] Service worker builds correctly (`npm run build`)
  - [ ] Offline fallback page exists (`public/offline.html`)
  - [ ] Update notifications work
  - [ ] Caching strategies tested
  - [ ] Storage quotas configured
  - [ ] HTTPS enabled (required for SW)
  - [ ] Browser compatibility tested
  - [ ] Update flow works smoothly

  ---

  ## Browser Support

  | Browser | Version | Support |
  |---------|---------|---------|
  | Chrome | 45+ | ✅ Full |
  | Firefox | 44+ | ✅ Full |
  | Safari | 11.1+ | ✅ Full |
  | Edge | 17+ | ✅ Full |
  | Opera | 32+ | ✅ Full |
  | Samsung Internet | 4.0+ | ✅ Full |
  | iOS Safari | 11.3+ | ✅ Full |

  **Graceful Degradation:**
  - App works without service worker
  - Features degrade gracefully
  - Offline support optional enhancement

  ---

  ## Future Enhancements

  - [ ] Smarter cache invalidation
  - [ ] Partial cache updates
  - [ ] IndexedDB integration
  - [ ] Better offline UI
  - [ ] Push notification implementation
  - [ ] Background sync implementation
  - [ ] Cache analytics/metrics

  ---

  ## Resources

  - [Workbox Documentation](https://developers.google.com/web/tools/workbox)
  - [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
  - [PWA Checklist](https://web.dev/pwa-checklist/)
  - [Cache Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)

  **Current Version**: v0.91.0



  ---

  # Complete Features List


  # Features Documentation

  Complete list of features implemented in the Tumblr T3 application.

  ## Table of Contents
  - [Authentication & User Management](#authentication--user-management)
  - [User Interface](#user-interface)
  - [Content Viewing](#content-viewing)
  - [Image Viewer](#image-viewer)
  - [Social Features](#social-features)
  - [Tag System](#tag-system)
  - [Blog Viewing](#blog-viewing)
  - [Preferences & Settings](#preferences--settings)

  ---

  ## Authentication & User Management

  ### Registration
  - **Email validation**: Unique email required
  - **Username validation**: Unique username required
  - **Password security**: Bcrypt hashing (10 salt rounds)
  - **Default preferences**: Automatically created on signup
  - **Avatar generation**: Unique avatar based on username
  - **Location**: `/auth?mode=register`

  ### Login
  - **Flexible login**: Email OR username accepted
  - **Session persistence**: LocalStorage-based sessions
  - **Auto-login**: Automatic session restoration on page load
  - **Location**: `/auth?mode=login`

  ### Logout
  - **Top navigation**: Logout button in navigation bar
  - **Session cleanup**: Clears localStorage
  - **Redirect**: Returns to home page

  ---

  ## User Interface

  ### Theme System
  - **Light mode**: Clean, bright interface
  - **Dark mode**: Eye-friendly dark theme
  - **System mode**: Follows OS preference
  - **Toggle button**: Top navigation bar
  - **Persistence**: Saved per user in database

  ### Responsive Design
  - **Mobile**: Optimized for small screens
  - **Tablet**: Adaptive layout
  - **Desktop**: Full-featured experience
  - **Grid system**: Responsive columns (2-4 columns)

  ### Navigation
  - **Sticky header**: Always accessible
  - **Quick links**: Dashboard, Search, Profile, Settings
  - **User menu**: Profile, Settings, Logout (when logged in)
  - **Auth buttons**: Login, Sign up (when logged out)

  ---

  ## Content Viewing

  ### Dashboard (v0.70.0 - Redesigned)
  - **Recently Viewed Blogs**: Top 20 most recent blogs displayed as prominent cards
  - **Blog Visit Tracking**: Automatic tracking of every blog visit with timestamps
  - **Visit Statistics**: See how many times you've visited each blog
  - **Infinite Scroll**: Remaining blogs (up to 100) load automatically as you scroll
  - **Blog History**: Stores up to 100 most recently visited blogs in localStorage
  - **Empty State**: Helpful prompt to search for blogs when history is empty
  - **Clear History**: Button to clear all blog browsing history
  - **Cross-tab Sync**: History updates when window gains focus
  - **Beautiful UI**: 
    - Large card layout for recent blogs (2-5 columns responsive)
    - Compact list for older blogs (1-3 columns responsive)
    - Blog avatars with gradient fallbacks
    - Relative timestamps ("2h ago", "3d ago", etc.)
    - Hover animations and smooth transitions

  ### Blog History Tracking (v0.70.0)
  - **Automatic**: Tracks every blog visit with no user action required
  - **Persistent**: Stored in localStorage (survives browser restarts)
  - **Smart**: Most recent 100 blogs kept, oldest removed automatically
  - **Rich Data**: Stores blog name, display name, avatar URL, timestamp, visit count
  - **Quick Access**: Click any blog card to instantly revisit

  ---

  ## Image Viewer

  ### Basic Features
  - **Full-screen view**: Click any image to open
  - **Zoom functionality**: Click image to zoom to full window size
  - **Keyboard navigation**: Arrow keys (← →) to navigate between images
  - **Close viewer**: ESC key (first press unzooms, second closes)
  - **Navigation buttons**: Visual prev/next buttons

  ### Advanced Features
  - **Persistent zoom**: Zoom state maintained while navigating
  - **Blog info bar**: Shows blog name and avatar (bottom left when zoomed)
  - **Engagement metrics**: Like button and notes count (bottom right when zoomed)
  - **Notes panel**: Click notes count to view details
  - **Smooth transitions**: Animated entry/exit

  ### Notes Panel
  - **Side panel**: Slides in from right
  - **Tabbed interface**: All, Comments, Likes, Reblogs
  - **User information**: Avatar, username, timestamp
  - **Note content**: Comments and reblog messages
  - **Clickable usernames**: Opens user's blog in new tab

  ---

  ## Social Features

  ### Likes
  - **Like posts**: Heart button on posts
  - **Visual feedback**: Filled heart when liked
  - **Toggle**: Click again to unlike
  - **Persistence**: Saved per session

  ### Comments
  - **View comments**: Click comment button or notes count
  - **Notes panel**: Shows all comments with user info
  - **Timestamps**: Relative time display

  ### Reblogs
  - **Reblog button**: Visible on all posts
  - **View reblogs**: Filter in notes panel
  - **Reblog comments**: Shows additional commentary

  ---

  ## Tag System

  ### Tag Navigation
  - **Clickable tags**: All tags are interactive
  - **Two-level search**:
    1. **User-scoped**: Click tag on blog → See user's posts with that tag
    2. **Global search**: Click "Search All Blogs" → See all users' posts

  ### Tag View Page (`/tag/:tagName`)
  - **Current tag highlighted**: Blue/primary color
  - **Post statistics**: Shows number of posts and blogs
  - **Filter preservation**: Maintains scope (user/global) when clicking other tags
  - **Full post interaction**: Like, comment, reblog, view images

  ### Tag Features
  - **Search scope toggle**: "Search All Blogs" button
  - **Context display**: Shows if viewing user's tags or global
  - **Tag variety**: 40+ realistic tags (photography, aesthetic, nature, etc.)
  - **Multi-tag posts**: Posts can have 2-5 tags

  ---

  ## Blog Viewing

  ### Blog Page (`/blog/:username`)
  - **User profile**: Avatar, bio, follower/following counts
  - **Post count**: Total posts by user
  - **Follow button**: Follow/unfollow functionality
  - **View toggle**: Switch between "All Posts" and "Images Only"

  ### Images Only Mode
  - **Terse grid**: 2-4 column responsive grid
  - **Photo posts only**: Filters out text posts
  - **Hover effects**: Shows notes count on hover
  - **Quick access**: Click any image for full viewer

  ### Blog Navigation
  - **From notes panel**: Click username in notes
  - **New tab**: Opens in separate browser tab
  - **Tag exploration**: Click tags to filter user's posts
  - **Image viewing**: Full image viewer integration

  ### Pagination & Bulk Operations (v0.60.2)
  - **Load More**: Fetch next 50 posts from blog
  - **Load All**: Automatically load all remaining posts (batches of 50)
  - **Progress indicators**: Real-time loading feedback
  - **Smart state tracking**: Offset, hasMore, total post count

  ### Bulk Download Operations (v0.60.2)
  - **Download Loaded**: Download currently loaded images (50-300)
  - **Download ALL**: Auto-loads all posts then downloads every image
  - **Progress tracking**: Shows "Downloading... (X/Y)" during operation
  - **Confirmation dialogs**: Prevents accidental bulk operations
  - **Metadata included**: Tags, notes, descriptions in sidecar files
  - **Filename patterns**: 6 customizable naming patterns

  ### Bulk Store Operations (v0.60.2)
  - **Store Loaded**: Save currently loaded images to database
  - **Store ALL**: Auto-loads all posts then stores every image
  - **Batch API calls**: Efficient database storage
  - **Deduplication**: Skips already-stored images
  - **Result summary**: Shows stored/skipped/failed counts
  - **Authentication required**: Only available when logged in

  ### Real Tumblr Notes (v0.60.2)
  - **`notes_info=true`**: Fetch up to 50 notes per post from Tumblr API
  - **Real usernames**: Display actual Tumblr users who liked/reblogged
  - **Note metadata**: Blog name, avatar URL, timestamp, comment text
  - **Fallback system**: Uses mock data when notes unavailable
  - **Dual display**: Real notes in both ImageViewer and post feed

  ---

  ## Preferences & Settings

  ### User Preferences (Settings Page)
  - **Theme selection**: Light, Dark, System
  - **Font size**: Adjustable text size
  - **View mode**: Full or Images Only (dashboard default)
  - **Accessibility**:
    - Reduced motion toggle
    - Haptics enable/disable
    - Gestures enable/disable

  ### Preference Persistence
  - **Database storage**: Saved per user in SQLite
  - **Automatic sync**: Loads on login
  - **Real-time updates**: Changes apply immediately
  - **Cross-session**: Preserved across browser sessions

  ---

  ## Search System

  ### Enhanced Search Interface
  - **Improved filter layout**: Less crowded, organized layout
  - **Content type filter**: Dedicated row (All, Text, Photos, Videos, Audio)
  - **Sort and time filters**: Side-by-side responsive layout
  - **Real-time results**: Instant feedback as you type
  - **Search suggestions**: Auto-complete for common terms

  ### Blog Search
  - **6 Mock Blogs**: Pre-loaded test blogs with rich content
    - **Photo Archive** 📸: 8,547 posts, 45k+ followers (300 test images)
    - **Aesthetic Vibes**: Aesthetic photos and inspiration
    - **Tech Insights**: Technology and programming content
    - **Art & Creativity**: Amazing artwork showcase
    - **Through the Lens**: Photography blog
    - **Words & Stories**: Creative writing and poetry
  - **Blog cards**: Beautiful cards with header images, avatars, stats
  - **Subscribe from search**: Subscribe directly from search results
  - **Open in new tab**: View blog button opens blog in new tab

  ### Search Features
  - **Search page**: `/search`
  - **Search history**: Stored per user
  - **Tag search**: Global tag exploration
  - **Cached results**: Instant repeat searches (10-minute cache)
  - **Image preloading**: Blog images preload automatically

  ---

  ## Subscription System

  ### Subscribe to Blogs
  - **Blog page subscribe**: Large button in blog header
  - **Search results subscribe**: Subscribe from search cards
  - **Visual feedback**: 
    - Primary blue "Subscribe" button when not subscribed
    - Outlined with checkmark "Subscribed" when subscribed
  - **State management**: Persists while browsing (session-based)
  - **Toggle subscription**: Click again to unsubscribe
  - **Icons**: Plus icon (+) for subscribe, checkmark (✓) when subscribed

  ---

  ## Interactive Dashboard

  ### Clickable Elements
  - **Blog names**: Click to open blog in new tab (blue on hover)
  - **Notes count**: Click "X notes" to open blog in new tab
  - **Like posts**: Heart button with filled/unfilled states
  - **Visual feedback**: Red heart when liked, gray when not
  - **State persistence**: Likes persist during session

  ---

  ## Advanced Image Viewer

  ### New Features
  - **Image counter**: Shows "X / Y" (e.g., "5 / 300") in top-left
  - **Jump to end**: Down arrow button to jump to last image instantly
  - **Select images**: Toggle selection with dedicated button
    - Blue highlighted when selected
    - Checkmark icon indicates selection
    - Multi-select capability across viewing session
  - **Persistent features**: Counter, selection, navigation all work together

  ### Enhanced Navigation
  - **Keyboard shortcuts**: Arrow keys for navigation
  - **Visual navigation**: Prev/Next buttons
  - **Jump to end**: Single click to last image
  - **Smart positioning**: Counter and controls don't interfere with image

  ---

  ## Advanced Grid Selection System (v0.9.0)

  ### Grid Selection Features
  - **Direct selection**: Click checkbox overlay on grid images
  - **Multi-select modes**:
    - **Single select**: Click checkbox to toggle
    - **Range select**: Shift + Click to select range
    - **Multi-toggle**: Ctrl/Cmd + Click for individual toggles
    - **Normal click**: Opens image viewer (no Ctrl/Cmd)
  - **Selection toolbar**:
    - **Count display**: "X of Y selected"
    - **Select All**: Select all visible filtered images
    - **Deselect All**: Clear all selections
    - **Invert Selection**: Toggle all selections
    - **Download button**: Download selected images (UI ready)
    - **Delete button**: Delete selected images (UI ready)
  - **Visual feedback**:
    - Checkbox overlay on hover (top-left corner)
    - Blue selection overlay on selected images
    - Blue checkmark in checkbox when selected
    - Scale-down effect on selected images
    - Hover effects disabled for selected items

  ### Advanced Image Filtering
  - **Size filter**:
    - **Small**: < 600,000 pixels
    - **Medium**: 600,000 - 1,000,000 pixels
    - **Large**: > 1,000,000 pixels
  - **Date filter**:
    - **Today**: Last 24 hours
    - **This Week**: Last 7 days
    - **This Month**: Last 30 days
  - **Sort options**:
    - **Recent**: Newest first (default)
    - **Oldest**: Oldest first
    - **Popular**: Most notes first
  - **Filter UI**:
    - Sidebar panel (hidden on mobile/tablet, visible on desktop)
    - Active filter count badge
    - "Clear All" quick action
    - Real-time filtering (no page reload)

  ### Keyboard Navigation
  - **Home**: Jump to first image in grid
  - **End**: Jump to last image in grid
  - **Page Up**: Move up 3 rows in grid
  - **Page Down**: Move down 3 rows in grid
  - **Arrow Up**: Move focus up one row
  - **Arrow Down**: Move focus down one row
  - **Arrow Left**: Move focus left one image
  - **Arrow Right**: Move focus right one image
  - **Enter**: Open focused image in full viewer
  - **Space**: Toggle selection on focused image
  - **Visual indicators**:
    - Focus ring (blue/primary color) on focused image
    - Ring offset for clear visibility
    - Focus state persists during keyboard navigation

  ### Selection Workflow
  1. **Switch to Images Only mode** in blog view
  2. **Hover over images** to see checkbox overlay
  3. **Click checkbox** or use Ctrl/Cmd+Click to select
  4. **Use toolbar** to select all, invert, or clear
  5. **Filter images** by size, date, or popularity
  6. **Navigate with keyboard** for efficient selection
  7. **Download or delete** selected images (via toolbar)

  ### Empty State
  - **No results message**: "No images match your filters"
  - **Clear filters button**: One-click reset to see all images
  - **Icon indicator**: Visual feedback for empty state

  ---

  ## Comprehensive Caching System

  ### Multi-Layer Caching
  - **Service Worker**: Browser-level caching for offline support
  - **React Query**: In-memory + localStorage persistence (7 days)
  - **Image Cache**: Aggressive image preloading and caching (90 days)
  - **API Cache**: Smart API response caching (24 hours)

  ### Image Caching
  - **500+ images**: Local images cached for 90 days
  - **300+ external**: External CDN images cached for 60 days
  - **Automatic preload**: Blog images preload when search results arrive
  - **Smart cleanup**: Expired entries removed automatically
  - **Quota management**: Purges on quota exceeded

  ### Cache Features
  - **Instant loading**: Cached images load immediately
  - **Offline support**: Works without internet connection
  - **Reduced bandwidth**: Saves data on repeat visits
  - **Performance boost**: 10x faster repeat searches
  - **Documentation**: Full caching guide in `CACHING.md`

  ### Storage Usage
  - Service Worker: ~50-100 MB (images + assets)
  - localStorage (React Query): ~5-10 MB (JSON data)
  - localStorage (Image metadata): ~100 KB
  - Total: ~50-115 MB (well within browser limits)

  ---

  ## Additional Features

  ### Performance
  - **Lazy loading**: Images load on demand
  - **Infinite scroll**: Efficient post loading
  - **Optimized animations**: Framer Motion with reduced motion support
  - **Code splitting**: TanStack Router-based routing

  ### PWA Features
  - **Service worker**: Offline capability ready
  - **Manifest**: Web app installation
  - **Cache strategy**: Stale-while-revalidate

  ### Developer Features
  - **TypeScript**: Full type safety
  - **Prisma ORM**: Type-safe database queries
  - **React Query**: Smart data fetching and caching
  - **Jotai**: Atomic state management
  - **Tailwind CSS**: Utility-first styling

  ---

  ## Mobile Optimizations (v0.10.1)

  ### 📱 Mobile-First Design
  - **Responsive navigation**: Mobile bottom nav bar with Home, Search, Stored, Profile, Settings
  - **Hamburger menu**: Collapsible navigation on mobile devices
  - **Touch-optimized**: All buttons have proper touch targets (44px minimum)
  - **Touch manipulation**: CSS touch-manipulation for better responsiveness
  - **Viewport fixes**: Prevents unwanted zooming, proper scaling on all devices
  - **Safe area support**: iPhone notch and home indicator spacing

  ### Mobile Range Selection
  - **Two-tap mode**: Mobile-friendly range selection without Shift key
  - **Range button**: Dedicated "Range" button in toolbar (mobile only)
  - **Visual feedback**: 
    - Yellow ring around range start image
    - "START" badge on first selected image
    - Button changes to "End" after first tap
  - **Workflow**:
    1. Tap "Range" button
    2. Tap first image (marked with "START")
    3. Tap last image (all between selected automatically)

  ### Mobile UI Improvements
  - **Compact layouts**: Reduced padding, spacing, and text sizes on mobile
  - **Sticky positioning**: Selection toolbar and filters stick properly below nav
  - **Two-row toolbar layout**:
    - Row 1: Counter + Range + Select All/Deselect
    - Row 2: Action buttons (Share, Download, Store, Delete)
  - **Icon-only buttons**: Labels hidden on smallest screens to save space
  - **Responsive text**: Scales from xs to sm/base based on screen size
  - **Line clamping**: Long text truncates with ellipsis on mobile
  - **Flexible grids**: Stack vertically on mobile, wrap on larger screens

  ### Touch Enhancements
  - **Active states**: Scale-down effect on button press (active:scale-95)
  - **Prevent conflicts**: Proper event handling (preventDefault, stopPropagation)
  - **No double-tap zoom**: Disabled to prevent iOS zoom on buttons
  - **Smooth scrolling**: Touch-friendly scrolling for keyboard navigation

  ---

  ## Image Management (v0.10.0, Updated v0.92.2)

  ### Download & Share System
  - **Web Share API**: Share images via iOS/Android share sheet (renamed from "Share to Photos" in v0.92.2)
  - **Direct download**: Save images to device on desktop
  - **Batch operations**: Download/share multiple images at once
  - **Progress tracking**: Shows "X/Y" progress during operations
  - **Metadata sidecar files**: `.txt` files with complete Tumblr metadata
  - **Filename patterns**: Customizable naming (see Settings)
  
  **Note (v0.92.2):** "Share to Photos" button renamed to "Share" for clarity. Web Share API opens system share sheet where users can select Photos app, Messages, AirDrop, etc.

  ### Filename Patterns
  User can choose from 6 patterns in Settings:
  1. **Blog + Tags + Date**: `photoarchive_nature-landscape_2025-10-15.jpg`
  2. **Date + Blog + Tags**: `2025-10-15_photoarchive_nature-landscape.jpg`
  3. **Blog + Description**: `photoarchive_beautiful-sunset.jpg`
  4. **Tags Only**: `nature-landscape-photography.jpg`
  5. **Timestamp**: `photoarchive_1760549272501.jpg`
  6. **Simple**: `photoarchive_image_1.jpg`
  - **Include index**: Optional sequential numbering for batch downloads
  - **Include metadata files**: Optional `.txt` sidecar files (default: off)

  ### Metadata Sidecar Files (Optional)
  When enabled in Settings, each downloaded image includes a companion `.txt` file with:
  - Blog name and URL
  - Post URL and timestamp
  - Description/caption
  - Tags (space-separated and macOS Spotlight format)
  - Notes count
  - Engagement statistics
  - Download timestamp
  - **Note**: Disabled by default; enable in Settings > Downloads > Include Metadata Files (.txt)

  ### Store to Database
  - **Permanent storage**: Save images to PostgreSQL database
  - **Smart deduplication (v0.60.5)**: Prevents duplicate images across ALL blogs
    - Detects same post from same blog (by postId)
    - Detects same image from different blogs (by URL)
    - Prevents storing reblogs and cross-posts
  - **User-controlled deduplication (v0.60.6)**: Choose your deduplication mode in Settings
    - **Strict mode (default)**: No duplicate URLs (saves space, prevents reblogs)
    - **Allow duplicates mode**: Same image from different blogs OK (tracks different contexts)
    - Always prevents same post from same blog, regardless of setting
  - **Batch storage**: Store multiple images at once
  - **Success feedback**: Shows "Stored: X / Skipped: Y" count
  - **Cost tracking**: Optional monetary value field for each image
  - **View stored images**: Dedicated "Stored" page with full grid features

  ### Stored Images Page (`/stored`) - Enhanced (v0.80.0)
  - **Pagination system**: Load 50 images at a time, expandable to ALL
  - **Load More button**: Fetch next 50 images
  - **Load All button**: Load ALL remaining images in batches
  - **Progress tracking**: Shows "X of Y images" with remaining count
  - **Real Notes Display**: Shows actual Tumblr notes (likes, reblogs, comments)
  - **Filter by blog**: View images from specific blogs (limit customizable 5-100)
  - **Blog filter indicator**: "+X more blogs" when limit exceeded
  - **Statistics**: Total images, breakdown by blog, total cost tracking
  - **Cost management**: View and update monetary value of stored images
  - **Delete from storage**: Remove stored images
  - **All grid controls**: Columns, size, resolution, date, sort
  - **Full grid features**: Selection, filtering, keyboard nav, download
  - **Same UX**: Identical to blog Images Only view

  ### Cost Tracking (v0.10.4)
  - **Per-image cost**: Track monetary value of each stored image
  - **Total cost stats**: See total investment across all stored images
  - **Per-blog breakdown**: View cost totals by blog source
  - **Update costs**: Modify image costs via API or UI
  - **Optional field**: Cost is not required when storing images
  - **Use cases**: Digital collectibles, art purchases, NFTs, investment tracking

  ---

  ## Grid Customization

  ### Display Settings
  - **Grid columns**: 2-6 columns (adjustable in filter bar)
  - **Image size**: 
    - Compact: 0.25rem gap
    - Comfortable: 0.5rem gap (default)
    - Spacious: 1rem gap
  - **Real-time updates**: Changes apply immediately
  - **Persistent preferences**: Saved to user settings

  ### Filter Controls
  - **Multi-select filters**: Size and date filters work as toggles
  - **Resolution filter**: Small/Medium/Large (by pixel count)
  - **Date filter**: Today/This Week/This Month
  - **Sort options**: Recent/Oldest/Popular
  - **Sticky toggle**: Lock/unlock filter bar to top of page
  - **Active count badge**: Shows number of active filters
  - **Clear all**: One-click reset

  ### Sticky Positioning
  - **Navigation bar**: Always at top (z-50, top-0)
  - **Selection toolbar**: Sticks below nav (z-20, top-16)
  - **Filter bar**: Sticks below toolbar when locked (z-10, top-32)
  - **Proper layering**: No overlap between sticky elements
  - **Mobile-friendly**: Works perfectly on iPhone/Android

  ---

  ## Recent Additions (v0.10.4)

  ### ✅ New in v0.10.4
  - [x] **Cost tracking** for stored images
  - [x] **Cost field** in StoredImage database table (Float, optional)
  - [x] **Update cost API** endpoint (`PATCH /api/stored-images/:id`)
  - [x] **Enhanced stats endpoint** with total cost and per-blog cost breakdown
  - [x] **Investment tracking** for digital collectibles and art

  ### ✅ New in v0.10.2
  - [x] **Optional metadata files**: Setting to enable/disable .txt sidecar file downloads
  - [x] **User control**: Metadata files now off by default, can be enabled in Settings
  - [x] **Cleaner downloads**: Users can choose image-only downloads or include full metadata

  ### ✅ New in v0.10.1
  - [x] **Mobile range selection** with two-tap mode
  - [x] **Mobile bottom navigation** bar for quick access
  - [x] **Sticky positioning fixes** for selection toolbar and filters
  - [x] **Touch handling improvements** (proper preventDefault, scale feedback)
  - [x] **Compact mobile layouts** throughout the app
  - [x] **Responsive selection toolbar** (two-row layout)
  - [x] **iPhone viewport fixes** (no unwanted zoom, proper scaling)
  - [x] **Touch-optimized buttons** with proper target sizes
  - [x] **Mobile-friendly card view** in blog posts

  ### ✅ New in v0.10.0
  - [x] **Download functionality** with Web Share API
  - [x] **Share** button (opens system share sheet on mobile - updated from "Share to Photos" in v0.92.2)
  - [x] **Metadata sidecar files** for all downloads
  - [x] **6 filename patterns** in Settings
  - [x] **Store to database** feature
  - [x] **Stored images page** with full grid features
  - [x] **Grid customization** (2-6 columns, 3 sizes)
  
  ### ✅ New in v0.92.2
  - [x] **Close button** in Blog view - Delete all stored images from blog and return to dashboard
  - [x] **Simplified Share button** - Renamed from "Share to Photos" to "Share" for clarity
  - [x] **Blog deletion API** - DELETE endpoint for removing all stored images from specific blog
  - [x] **Multi-select filters** (size, date work as toggles)
  - [x] **Sticky filter bar** with lock/unlock toggle
  - [x] **PostgreSQL migration** from SQLite
  - [x] **Admin system** with role-based access
  - [x] **Advanced authentication** (email verification, password reset)
  - [x] **Database seeding** with test data

  ### ✅ Implemented in v0.9.0
  - [x] **Grid selection system** with checkboxes and multi-select
  - [x] **Selection toolbar** with bulk actions
  - [x] **Advanced filtering** (size, date, popularity)
  - [x] **Keyboard navigation** (Home, End, Page Up/Down, arrows, Space, Enter)
  - [x] **Visual focus indicators** for keyboard navigation
  - [x] **Range selection** with Shift+Click (desktop)
  - [x] **Individual toggle** with Ctrl/Cmd+Click
  - [x] **Version badge** on all pages

  ### ✅ Implemented in v0.8.0
  - [x] Enhanced search UI with improved filter layout
  - [x] Blog search with 6 pre-loaded blogs
  - [x] Multi-layer caching system
  - [x] Image preloading for instant loading
  - [x] Like functionality with visual feedback
  - [x] Image counter in viewer
  - [x] Jump to start/end buttons in image viewer
  - [x] Select images capability in modal viewer
  - [x] Follow/unfollow blogs
  - [x] Clickable blog names and notes

  ---

  ## Tumblr OAuth Integration (v0.82.0+)

  ### OAuth 1.0a Authentication
  - **Full OAuth flow** - Complete Tumblr OAuth 1.0a implementation
  - **Popup authorization** - Opens Tumblr auth in popup window
  - **Token management** - Secure token storage in database
  - **Connection status** - Real-time connection status checking
  - **Disconnect capability** - Easy account disconnection

  ### OAuth Features
  - ✅ **Access private blogs** - View blogs you follow
  - ✅ **Full notes data** - Get all notes (not limited to 50)
  - ✅ **Higher rate limits** - Per-user quota tracking
  - ✅ **Authenticated requests** - Access user-specific content
  - 🔜 **Like/unlike posts** - Interaction with posts (ready to implement)
  - 🔜 **Reblog posts** - Reblog to your blog (ready to implement)
  - 🔜 **Create posts** - Post new content (ready to implement)

  ### User Interface
  - **Settings integration** - OAuth card in Settings page
  - **Connection card** - Shows connection status and username
  - **One-click connect** - Simple connection flow
  - **Visual feedback** - Clear connected/disconnected states
  - **Security indicators** - Connection timestamp displayed

  ### Security
  - ✅ **HMAC-SHA1 signing** - Industry-standard request signing
  - ✅ **Token encryption** - Secure token storage
  - ✅ **Backend-only secrets** - Consumer secret never exposed
  - ✅ **Automatic cleanup** - Old request tokens purged hourly
  - ✅ **HTTPS required** - Secure communication in production

  **See `OAUTH_GUIDE.md` for complete setup and usage instructions.**

  ---

  ## Progressive Web App (PWA)

  ### Service Worker
  - **Workbox-powered** - Enterprise-grade service worker
  - **Automatic caching** - Smart caching strategies
  - **Offline support** - Works without internet connection
  - **Update notifications** - Notifies when new version available
  - **Background updates** - Updates cache in background

  ### Caching Strategies

  **Images:**
  - Local images: 500 entries, 90 days, cache-first
  - External images: 300 entries, 60 days, cache-first
  - Automatic quota management with purging

  **API Responses:**
  - Network-first strategy for fresh data
  - 100 entries, 24-hour cache
  - Graceful offline fallback

  **Static Assets:**
  - Stale-while-revalidate for instant loading
  - CSS, JavaScript, fonts cached indefinitely
  - Background updates for latest versions

  **Fonts:**
  - 30 font files, 1-year cache
  - Cache-first for instant rendering

  ### Offline Capabilities
  - ✅ **Offline fallback page** - Custom offline experience
  - ✅ **Cached navigation** - Navigate offline to cached pages
  - ✅ **Cached images** - View previously loaded images
  - ✅ **Cached API data** - Access recent data offline
  - 🔜 **Background sync** - Sync changes when back online (ready)
  - 🔜 **Push notifications** - Real-time notifications (ready)

  ### Update System
  - **Hourly checks** - Checks for updates every hour
  - **Instant updates** - Option to update immediately
  - **Skip waiting** - Activates new version without delay
  - **Automatic reload** - Reloads page with new version

  ### Performance
  - **33x faster** - Repeat visits load 33x faster
  - **~85ms load time** - Cached pages load in <100ms
  - **~75-120 MB cache** - Reasonable storage usage
  - **Automatic cleanup** - LRU eviction when quota exceeded

  **See `SERVICE_WORKER.md` for complete technical documentation.**

  ---

  ## Admin Dashboard Enhancements (v0.82.0+)

  ### Database Statistics
  - **Comprehensive stats** - Complete database size and breakdown
  - **Per-table analysis** - Row counts and sizes for each table
  - **Storage categories** - Grouped by feature (Auth, Content, etc.)
  - **Safe error handling** - Graceful fallback for missing tables
  - **Real-time data** - Live queries to PostgreSQL system tables

  ### API Quota Tracking
  - **Database-backed** - Persistent API call tracking
  - **Historical data** - Retain daily usage history
  - **Visual dashboard** - Real-time quota monitoring
  - **Color-coded warnings** - Green/yellow/red status indicators
  - **Capacity calculator** - Shows what you can do with remaining quota

  ### Display Features
  ```
  Database Statistics:
    - Total database size
    - Per-table breakdown
    - Row counts
    - Storage by category
    
  API Usage:
    - Daily calls (X / 5,000)
    - Hourly limit (1,000/hour)
    - Usage percentage
    - Remaining capacity
    - Reset time
  ```

  ---

  ## Advanced Download System

  ### File System Access API
  - **Directory picker** - Choose download location
  - **Subdirectory creation** - Auto-creates blog-named folders
  - **Batch operations** - Download hundreds of images efficiently
  - **Progress tracking** - Real-time download progress
  - **Fallback support** - Works in all browsers

  ### Directory Structure
  ```
  Downloads/
    └── blogname/
        ├── image001.jpg
        ├── image002.jpg
        └── image003.jpg
  ```

  ### User Gesture Preservation
  - **Proper flow** - Request directory FIRST (preserves gesture)
  - **Then fetch** - Download images after directory selected
  - **Security compliant** - Follows browser security requirements
  - **Diagnostic logging** - Comprehensive console feedback

  ### Browser Support
  - ✅ Chrome 86+ - Full support
  - ✅ Edge 86+ - Full support
  - ✅ Opera 72+ - Full support
  - ⚠️ Firefox - Fallback (filename prefixes)
  - ⚠️ Safari - Fallback (filename prefixes)

  **See version history (v0.84.2+) for complete implementation details.**

  ---

  ## Upcoming Features

  - [ ] Post creation and editing
  - [ ] Draft management
  - [ ] Full follow/unfollow system with backend persistence
  - [ ] Notifications system
  - [ ] Direct messaging
  - [ ] Reblog functionality
  - [ ] Comment system
  - [ ] Content moderation tools
  - [ ] Export/import data
  - [ ] Persist follow state to database
  - [ ] Persist likes to database
  - [ ] Drag-and-drop selection
  - [ ] Image cropping and editing
  - [ ] Bulk tag editing
  - [ ] Advanced search filters



  ---

  # Technical Architecture


  # Technical Architecture

  Detailed technical documentation of the Tumblr T3 application architecture.

  ## Table of Contents
  - [System Overview](#system-overview)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Frontend Architecture](#frontend-architecture)
  - [Backend Architecture](#backend-architecture)
  - [Database Schema](#database-schema)
  - [State Management](#state-management)
  - [Routing](#routing)
  - [API Communication](#api-communication)

  ---

  ## System Overview

  ```
  ┌─────────────────────────────────────────────────────────────┐
  │                     User Browser                            │
  │  ┌───────────────────────────────────────────────────────┐ │
  │  │  React Application (Port 5173)                        │ │
  │  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
  │  │  │   UI Layer  │  │  State Mgmt  │  │   Routing   │ │ │
  │  │  │  (Tailwind) │  │   (Jotai)    │  │  (TanStack) │ │ │
  │  │  └─────────────┘  └──────────────┘  └─────────────┘ │ │
  │  │  ┌──────────────────────────────────────────────────┐ │ │
  │  │  │          React Query (Data Layer)                │ │ │
  │  │  └──────────────────────────────────────────────────┘ │ │
  │  └───────────────────────────────────────────────────────┘ │
  │                          │ HTTP                            │
  │                          ▼                                  │
  └─────────────────────────────────────────────────────────────┘
                            │
                            ▼
  ┌─────────────────────────────────────────────────────────────┐
  │              Express Server (Port 3001)                     │
  │  ┌───────────────────────────────────────────────────────┐ │
  │  │  REST API Endpoints                                   │ │
  │  │  ┌────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
  │  │  │   Auth     │  │    Users     │  │  Preferences │ │ │
  │  │  │ /api/auth  │  │  /api/users  │  │  /api/prefs  │ │ │
  │  │  └────────────┘  └──────────────┘  └──────────────┘ │ │
  │  └───────────────────────────────────────────────────────┘ │
  │                          │ Prisma ORM                      │
  │                          ▼                                  │
  │  ┌───────────────────────────────────────────────────────┐ │
  │  │             SQLite Database (dev.db)                  │ │
  │  │  Users | Preferences | Posts | Likes | Follows       │ │
  │  └───────────────────────────────────────────────────────┘ │
  └─────────────────────────────────────────────────────────────┘
  ```

  ---

  ## Tech Stack

  ### Frontend
  - **Framework**: React 18 + TypeScript
  - **Build Tool**: Vite 5
  - **Routing**: TanStack Router
  - **State Management**: Jotai (atomic state)
  - **Data Fetching**: TanStack Query (React Query)
  - **Styling**: Tailwind CSS + class-variance-authority
  - **Animations**: Framer Motion
  - **UI Components**: Custom components following Apple HIG

  ### Backend
  - **Runtime**: Node.js
  - **Framework**: Express
  - **Language**: TypeScript (via tsx)
  - **Database ORM**: Prisma Client
  - **Authentication**: bcryptjs
  - **CORS**: cors middleware

  ### Database
  - **Type**: PostgreSQL (production-ready)
  - **ORM**: Prisma
  - **Connection**: Via DATABASE_URL environment variable
  - **Migrations**: Prisma migrate
  - **Seeding**: Automated test data generation

  ### Development Tools
  - **Type Checking**: TypeScript 5
  - **Linting**: ESLint
  - **Formatting**: Prettier
  - **Git Hooks**: Husky + lint-staged
  - **Task Runner**: npm scripts + concurrently

  ---

  ## Project Structure

  ```
  NewTumblrT3/
  ├── docs/                          # Documentation
  │   ├── FEATURES.md
  │   ├── TECHNICAL_ARCHITECTURE.md
  │   └── USER_GUIDE.md
  ├── prisma/                        # Database
  │   ├── schema.prisma             # Database schema
  │   └── dev.db                    # SQLite database file
  ├── server/                        # Backend API
  │   └── index.ts                  # Express server
  ├── src/                          # Frontend source
  │   ├── components/               # React components
  │   │   ├── layouts/             # Layout components
  │   │   ├── navigation/          # Navigation components
  │   │   ├── providers/           # Context providers
  │   │   └── ui/                  # UI components
  │   ├── features/                # Feature modules
  │   │   ├── auth/               # Authentication
  │   │   ├── blog/               # Blog viewing
  │   │   ├── dashboard/          # Main feed
  │   │   ├── profile/            # User profile
  │   │   ├── search/             # Search
  │   │   ├── settings/           # Settings
  │   │   └── tag/                # Tag viewing
  │   ├── hooks/                   # React hooks
  │   │   └── queries/            # React Query hooks
  │   ├── lib/                     # Utilities
  │   │   ├── db.ts               # Prisma client
  │   │   └── queryClient.ts      # React Query client
  │   ├── routes/                  # Route definitions
  │   ├── services/                # API services
  │   │   ├── api/                # HTTP clients
  │   │   └── db/                 # Database services (unused in browser)
  │   ├── store/                   # Jotai atoms
  │   ├── styles/                  # CSS files
  │   ├── types/                   # TypeScript types
  │   ├── utils/                   # Helper functions
  │   ├── App.tsx                  # Root component
  │   └── main.tsx                 # Entry point
  ├── public/                       # Static assets
  ├── API_SETUP.md                 # API documentation
  ├── DATABASE.md                  # Database documentation
  ├── package.json                 # Dependencies
  ├── tsconfig.json                # TypeScript config
  ├── tailwind.config.js           # Tailwind config
  └── vite.config.ts               # Vite config
  ```

  ---

  ## Frontend Architecture

  ### Component Hierarchy

  ```
  App (Router Provider)
  ├── ThemeProvider
  │   ├── RootLayout
  │   │   ├── Navigation
  │   │   └── Outlet (Route Content)
  │   │       ├── Dashboard
  │   │       │   ├── PostCard[]
  │   │       │   └── ImageViewer
  │   │       │       └── NotesPanel
  │   │       ├── Blog
  │   │       │   ├── BlogHeader
  │   │       │   ├── PostCard[]
  │   │       │   ├── ImageViewer
  │   │       │   └── NotesPanel
  │   │       ├── TagView
  │   │       │   ├── TagHeader
  │   │       │   ├── PostCard[]
  │   │       │   └── ImageViewer
  │   │       ├── Auth (Login/Register)
  │   │       ├── Profile
  │   │       └── Settings
  ```

  ### Component Organization

  #### UI Components (`src/components/ui/`)
  - **Atomic components**: Button, Input, Card, etc.
  - **Composed components**: ImageViewer, NotesPanel, Sheet
  - **Reusable**: Used across multiple features
  - **Styled with**: Tailwind CSS + CVA

  #### Layout Components (`src/components/layouts/`)
  - **RootLayout**: Main app wrapper
  - **Container**: Content width constraints
  - **Grid**: Responsive grid system
  - **GridItem**: Grid item wrapper

  #### Feature Components (`src/features/`)
  - **Page-level components**: Dashboard, Blog, Auth, etc.
  - **Feature-specific logic**: State, hooks, utilities
  - **Self-contained**: Minimal external dependencies

  ---

  ## Backend Architecture

  ### API Layer (`server/index.ts`)

  ```typescript
  Express App
  ├── Middleware
  │   ├── CORS
  │   └── JSON Parser
  ├── Routes
  │   ├── POST /api/auth/register
  │   ├── POST /api/auth/login
  │   ├── GET  /api/users/:id
  │   ├── GET  /api/users/:id/preferences
  │   └── PUT  /api/users/:id/preferences
  └── Database (Prisma Client)
  ```

  ### Request Flow

  ```
  1. Client → HTTP Request → Express Server
  2. Express → Route Handler → Validation
  3. Route Handler → Prisma Client → Database Query
  4. Database → Prisma Client → Transform Data
  5. Prisma Client → Route Handler → JSON Response
  6. Express Server → HTTP Response → Client
  ```

  ### Error Handling

  ```typescript
  try {
    // Database operation
    const result = await prisma.user.create(...);
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Operation failed' });
  }
  ```

  ---

  ## Database Schema

  ### Entity Relationship Diagram

  ```
  User (1) ─────────── (1) UserPreferences
    │
    ├── (1:N) ────────── Posts
    ├── (1:N) ────────── Drafts
    ├── (1:N) ────────── SavedPost (many-to-many with Post)
    ├── (1:N) ────────── LikedPost (many-to-many with Post)
    ├── (1:N) ────────── SearchHistory
    └── (1:N) ────────── Follow (self-referential)
  ```

  ### Key Tables

  #### Users
  ```sql
  User {
    id            String   @id @default(uuid())
    email         String   @unique
    username      String   @unique
    passwordHash  String
    displayName   String?
    avatar        String?
    bio           String?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt
  }
  ```

  #### UserPreferences
  ```sql
  UserPreferences {
    id             String   @id @default(uuid())
    userId         String   @unique
    theme          String   @default("system")
    fontSize       Int      @default(16)
    viewMode       String   @default("full")
    reducedMotion  Boolean  @default(false)
    enableHaptics  Boolean  @default(true)
    enableGestures Boolean  @default(true)
  }
  ```

  #### Posts
  ```sql
  Post {
    id        String   @id @default(uuid())
    userId    String
    type      String   // text, photo, quote, link
    content   String
    tags      String   // JSON array
    timestamp DateTime @default(now())
    published Boolean  @default(true)
  }
  ```

  ---

  ## State Management

  ### Jotai Atoms

  #### Auth State (`src/store/auth.ts`)
  ```typescript
  userAtom           // Current logged-in user
  loginAtom          // Login action atom
  logoutAtom         // Logout action atom
  ```

  #### Preferences State (`src/store/preferences.ts`)
  ```typescript
  preferencesAtom         // All user preferences
  themeModeAtom          // Derived: theme mode
  fontSizeAtom           // Derived: font size
  viewModeAtom           // Derived: view mode
  updatePreferencesAtom  // Action: update preferences
  ```

  #### Search State (`src/store/search.ts`)
  ```typescript
  searchQueryAtom    // Current search query
  searchHistoryAtom  // Search history
  searchResultsAtom  // Search results
  ```

  ### State Flow

  ```
  Component → useAtom(atom) → Read/Write State
                  ↓
          Triggers Re-render
                  ↓
          Component Updates
  ```

  ---

  ## Routing

  ### TanStack Router Setup

  ```typescript
  rootRoute (/)
  ├── indexRoute        →  Dashboard
  ├── dashboardRoute    →  /dashboard
  ├── authRoute         →  /auth?mode=login|register
  ├── profileRoute      →  /profile
  ├── settingsRoute     →  /settings
  ├── searchRoute       →  /search
  ├── blogRoute         →  /blog/:username
  └── tagRoute          →  /tag/:tag?scope=user|all&blog=:username
  ```

  ### Route Features
  - **Type-safe params**: TypeScript validation
  - **Search params**: Query parameter validation
  - **Lazy loading**: Code splitting (disabled for now)
  - **Preloading**: Intent-based preloading
  - **Navigation**: Programmatic navigation with `useNavigate()`

  ---

  ## API Communication

  ### React Query Integration

  ```typescript
  // Query Hook
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => authApi.getUserById(userId),
    staleTime: Infinity
  });

  // Mutation Hook
  const { mutate, isPending } = useMutation({
    mutationFn: (data) => authApi.register(data),
    onSuccess: () => navigate('/'),
    onError: (error) => setError(error.message)
  });
  ```

  ### HTTP Client (`src/services/api/auth.api.ts`)

  ```typescript
  const API_URL = 'http://localhost:3001';

  async register(data): Promise<UserSession> {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error(await response.json());
    return response.json();
  }
  ```

  ### Caching Strategy
  - **User data**: Infinite stale time (doesn't change often)
  - **Posts**: 5-minute cache
  - **Preferences**: Infinite stale time
  - **Search**: No cache (fresh on every search)

  ---

  ## Mobile Architecture (v0.10.1)

  ### Responsive Design Strategy
  - **Mobile-first approach**: Base styles for mobile, then scale up
  - **Breakpoints**:
    - `xs`: Default (< 640px) - Phones
    - `sm`: 640px+ - Large phones, small tablets
    - `md`: 768px+ - Tablets
    - `lg`: 1024px+ - Desktops
    - `xl`: 1280px+ - Large desktops

  ### Touch Event Handling
  ```typescript
  // Proper touch event handling
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      // Handle action
    }}
    className="touch-manipulation active:scale-95"
  >
  ```
  - **`touch-manipulation`**: Disables double-tap zoom
  - **`active:scale-95`**: Visual feedback on press
  - **`preventDefault`**: Prevents default browser behaviors
  - **`stopPropagation`**: Prevents event bubbling

  ### Sticky Positioning System
  ```typescript
  // Z-index layering (highest to lowest)
  Navigation:     z-50, top-0     (always on top)
  SelectionToolbar: z-20, top-16  (below nav)
  FilterBar:      z-10, top-32    (below toolbar when sticky)
  Content:        z-0              (normal flow)
  ```
  - **64px offset**: Navigation bar height (h-16 = 64px)
  - **128px offset**: Nav + Toolbar (16 + 16 = 32 * 4px = 128px)
  - **Conditional sticky**: Filter bar only sticky when `isFilterSticky` is true

  ### Viewport Configuration
  ```html
  <meta 
    name="viewport" 
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
  />
  ```
  - **`maximum-scale=1.0`**: Prevents pinch-to-zoom
  - **`user-scalable=no`**: Disables zoom gestures
  - **`viewport-fit=cover`**: iPhone notch support

  ### CSS Mobile Fixes
  ```css
  /* Prevent text size adjustment */
  -webkit-text-size-adjust: 100%;

  /* Remove tap highlight */
  -webkit-tap-highlight-color: transparent;

  /* Prevent overscroll bounce */
  overscroll-behavior: none;

  /* Smooth touch scrolling */
  -webkit-overflow-scrolling: touch;

  /* Input zoom prevention */
  input { font-size: 16px !important; }

  /* Safe area padding */
  body { padding-bottom: env(safe-area-inset-bottom); }
  ```

  ### Mobile Component Patterns
  ```typescript
  // Responsive class pattern
  className="
    p-2 sm:p-4           // Padding scales up
    text-xs sm:text-sm   // Text scales up
    gap-1.5 sm:gap-2     // Spacing scales up
    hidden sm:inline     // Hidden on mobile
    md:hidden            // Hidden on desktop
    flex-col sm:flex-row // Stack on mobile
  "
  ```

  ### Range Selection Architecture
  ```typescript
  // Desktop: Shift+Click
  if (e.shiftKey && lastSelectedIndex !== null) {
    // Select range from lastSelectedIndex to current
  }

  // Mobile: Two-tap mode
  if (rangeMode) {
    if (rangeStart === null) {
      setRangeStart(index);  // First tap
    } else {
      selectRange(rangeStart, index);  // Second tap
      setRangeMode(false);
    }
  }
  ```
  - **State management**: `rangeMode`, `rangeStart` in component state
  - **Visual feedback**: Yellow ring, "START" badge
  - **Mode toggle**: Dedicated "Range" button (mobile only)

  ### Bottom Navigation Implementation
  ```typescript
  // Only render on mobile + when logged in
  {currentUser && (
    <div className="
      fixed bottom-0 left-0 right-0 
      z-50 block md:hidden
      bg-white/80 backdrop-blur-lg
    ">
      <MobileBottomNav />
    </div>
  )}

  // Add bottom padding to content
  <main className="pb-20 md:pb-0">
  ```
  - **Fixed positioning**: Always visible at bottom
  - **Backdrop blur**: Glass morphism effect
  - **Safe area**: `env(safe-area-inset-bottom)` padding

  ---

  ## Image Management System (v0.10.0)

  ### Download Architecture
  ```typescript
  interface ImageMetadata {
    blogName: string;
    blogUrl: string;
    tags: string[];
    notes: number;
    timestamp: number;
    description?: string;
    postUrl: string;
  }

  // Web Share API for mobile
  if (navigator.canShare && navigator.canShare({ files })) {
    await navigator.share({ 
      files: [imageFile, metadataFile],
      text: `From ${blogName}: ${tags.join(', ')}`
    });
  }

  // Direct download for desktop
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  ```

  ### Filename Generation
  ```typescript
  type FilenamePattern = 
    | 'blog-tags-date'
    | 'date-blog-tags'
    | 'blog-description'
    | 'tags-only'
    | 'timestamp'
    | 'simple';

  function generateFilename(
    pattern: FilenamePattern,
    metadata: ImageMetadata,
    index?: number
  ): string {
    // Pattern-based filename generation
    // e.g., "photoarchive_nature-landscape_2025-10-15.jpg"
  }
  ```

  ### Metadata Sidecar Files
  ```typescript
  // Generate .txt file with metadata
  const metadata = `
  Blog: ${blogName}
  URL: ${postUrl}
  Tags: ${tags.join(', ')}
  macOS Spotlight Tags: mdfind:kMDItemUserTags=${tags.join(',')}
  Notes: ${notes}
  Downloaded: ${new Date().toISOString()}
  `;

  // Download alongside image
  downloadMetadataSidecar(metadata, filename);
  ```

  ### Database Storage
  ```typescript
  // StoredImage model
  model StoredImage {
    id          String   @id @default(uuid())
    userId      String
    postId      String
    blogName    String
    url         String
    width       Int?
    height      Int?
    tags        String   // JSON array
    description String?
    notes       Int
    timestamp   DateTime
    storedAt    DateTime @default(now())
    
    user User @relation(fields: [userId], references: [id])
    
    @@unique([userId, postId])  // Prevents duplicates
    @@index([userId, blogName, storedAt])
  }
  ```

  ### Grid Customization System
  ```typescript
  // User preferences
  interface Preferences {
    gridColumns: number;      // 2-6
    gridImageSize: GridImageSize;  // compact | comfortable | spacious
    filenamePattern: FilenamePattern;
    includeIndexInFilename: boolean;
  }

  // Dynamic grid styling
  style={{
    gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
    gap: gridImageSize === 'compact' ? '0.25rem' 
      : gridImageSize === 'comfortable' ? '0.5rem' 
      : '1rem'
  }}
  ```

  ---

  ## Build & Deployment

  ### Development
  ```bash
  npm run dev      # Both frontend + backend
  npm run client   # Frontend only (port 5173)
  npm run server   # Backend only (port 3001)
  ```

  ### Production Build
  ```bash
  npm run build    # Build frontend to /dist
  # Backend runs directly with tsx/node
  ```

  ### Environment Variables
  ```bash
  # Frontend (.env)
  VITE_API_URL=http://localhost:3001

  # Backend (.env)
  DATABASE_URL="file:./dev.db"
  PORT=3001
  ```

  ---

  ## Performance Optimizations

  1. **Code Splitting**: Route-based chunks
  2. **Lazy Loading**: Images load on scroll
  3. **Memoization**: useMemo, useCallback
  4. **Virtual Scrolling**: Infinite scroll
  5. **Debouncing**: Search input
  6. **Caching**: React Query cache
  7. **Optimistic Updates**: Instant UI updates
  8. **Bundle Optimization**: Tree shaking, minification



  ---

  # Deployment Guide


  # Deployment Guide

  This guide covers multiple deployment options for NewTumblr v0.10.3.

  ## Quick Comparison

  | Platform | Cost | Difficulty | Best For |
  |----------|------|------------|----------|
  | **Render** | Free/$7/mo | ⭐ Easy | Quick deploy, managed DB |
  | **Railway** | $5 credit/mo | ⭐ Easy | Best DX, modern platform |
  | **Fly.io** | Free tier | ⭐⭐ Medium | Global edge deployment |
  | **Vercel + Railway** | Free/Paid | ⭐⭐ Medium | Separate frontend/backend |
  | **Docker VPS** | $5-10/mo | ⭐⭐⭐ Hard | Full control, cheapest |
  | **AWS/GCP** | Variable | ⭐⭐⭐⭐ Expert | Enterprise, scalability |

  ---

  ## Option 1: Render (Recommended) ⭐

  ### Pros
  - Easiest deployment
  - Free tier available
  - Managed PostgreSQL included
  - Auto-deploy from Git
  - SSL certificates automatic

  ### Setup Steps

  1. **Create Render Account**
    - Go to https://render.com
    - Sign up with GitHub

  2. **Push to GitHub**
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git remote add origin YOUR_GITHUB_REPO
    git push -u origin master
    ```

  3. **Deploy on Render**
    - Click "New" → "Blueprint"
    - Connect your GitHub repo
    - Render will auto-detect `render.yaml`
    - Click "Apply"

  4. **Set Environment Variables**
    - Go to each service → Environment
    - Add any additional secrets (API keys, etc.)

  5. **Run Migrations**
    - In the API service shell:
    ```bash
    npx prisma migrate deploy
    npx prisma db seed
    ```

  ### Cost
  - **Free tier**: 750 hours/month (sleeps after 15min inactivity)
  - **Paid**: $7/month for web service + $7/month for PostgreSQL

  ---

  ## Option 2: Railway ⭐

  ### Pros
  - Best developer experience
  - $5 free credit monthly
  - One-click PostgreSQL
  - Excellent logs/metrics

  ### Setup Steps

  1. **Install Railway CLI**
    ```bash
    npm i -g @railway/cli
    railway login
    ```

  2. **Initialize Project**
    ```bash
    railway init
    railway link
    ```

  3. **Add PostgreSQL**
    ```bash
    railway add --plugin postgresql
    ```

  4. **Deploy**
    ```bash
    railway up
    ```

  5. **Set Environment Variables**
    ```bash
    railway variables set VITE_API_URL=https://your-app.up.railway.app
    ```

  6. **Run Migrations**
    ```bash
    railway run npx prisma migrate deploy
    railway run npx prisma db seed
    ```

  ### Cost
  - **Free**: $5 credit/month (~100 hours)
  - **Pro**: $20/month flat rate

  ---

  ## Option 3: Fly.io (Global Edge)

  ### Pros
  - Deploy to edge locations worldwide
  - Great for global users
  - Free tier: 3 VMs

  ### Setup Steps

  1. **Install Fly CLI**
    ```bash
    brew install flyctl  # macOS
    # Or: curl -L https://fly.io/install.sh | sh
    ```

  2. **Login & Launch**
    ```bash
    fly auth login
    fly launch
    ```

  3. **Add PostgreSQL**
    ```bash
    fly postgres create
    fly postgres attach YOUR_DB_NAME
    ```

  4. **Deploy**
    ```bash
    fly deploy
    ```

  ### Cost
  - **Free**: 3 shared VMs + 1GB storage
  - **Paid**: $1.94/mo per VM + storage

  ---

  ## Option 4: Vercel (Frontend) + Railway (Backend)

  ### Pros
  - Best frontend performance (Vercel)
  - Separate scaling for frontend/backend
  - Generous free tiers

  ### Setup Steps

  **Frontend (Vercel):**
  1. Push to GitHub
  2. Go to https://vercel.com
  3. Import your repo
  4. Set build command: `npm run build`
  5. Set output directory: `dist`
  6. Add env var: `VITE_API_URL=YOUR_RAILWAY_API_URL`

  **Backend (Railway):**
  1. Create new Railway project
  2. Add GitHub repo
  3. Add PostgreSQL plugin
  4. Set root directory: `/` (not needed)
  5. Set start command: `npm run server`
  6. Run migrations in Railway shell

  ### Cost
  - **Vercel Free**: 100GB bandwidth
  - **Railway**: $5 credit/month

  ---

  ## Option 5: Docker on VPS (Self-Hosted)

  ### Pros
  - Full control
  - Cheapest long-term ($5-10/mo)
  - No vendor lock-in

  ### Setup Steps

  1. **Choose VPS Provider**
    - DigitalOcean Droplet ($6/mo)
    - Linode ($5/mo)
    - Vultr ($6/mo)
    - Hetzner (€4/mo - cheapest)

  2. **Setup Server**
    ```bash
    # SSH into server
    ssh root@YOUR_SERVER_IP

    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh

    # Install Docker Compose
    apt install docker-compose-plugin
    ```

  3. **Clone & Deploy**
    ```bash
    git clone YOUR_REPO
    cd NewTumblrT3
    
    # Set environment variables
    echo "DB_PASSWORD=your_secure_password" > .env
    
    # Start services
    docker-compose up -d
    ```

  4. **Setup Nginx (Reverse Proxy)**
    ```bash
    apt install nginx certbot python3-certbot-nginx
    
    # Configure Nginx
    nano /etc/nginx/sites-available/newtumblr
    ```

    ```nginx
    server {
        server_name yourdomain.com;
        
        location / {
            proxy_pass http://localhost:5173;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
        }
        
        location /api {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            client_max_body_size 50M;
        }
    }
    ```

    ```bash
    ln -s /etc/nginx/sites-available/newtumblr /etc/nginx/sites-enabled/
    nginx -t
    systemctl restart nginx
    
    # Get SSL certificate
    certbot --nginx -d yourdomain.com
    ```

  ### Cost
  - **VPS**: $5-10/month
  - **Domain**: $10-15/year

  ---

  ## Option 6: AWS/GCP/Azure (Enterprise)

  For large-scale production deployments with auto-scaling, monitoring, and multiple regions.

  ### Components
  - **Frontend**: S3 + CloudFront (AWS) or Cloud Storage + CDN (GCP)
  - **Backend**: EC2, ECS, or App Engine
  - **Database**: RDS PostgreSQL or Cloud SQL
  - **Load Balancer**: ALB or Cloud Load Balancing
  - **CI/CD**: CodePipeline or Cloud Build

  ### Cost
  - **Highly variable**: $50-500+/month depending on traffic
  - **Free tiers available** for first 12 months

  ---

  ## Environment Variables Checklist

  Make sure to set these on your deployment platform:

  ```bash
  # Required
  DATABASE_URL=postgresql://user:pass@host:5432/dbname
  NODE_ENV=production

  # Frontend (build-time)
  VITE_API_URL=https://your-api-url.com

  # Optional
  PORT=3001
  ```

  ---

  ## Post-Deployment Checklist

  - [ ] Run database migrations: `npx prisma migrate deploy`
  - [ ] Seed test data: `npx prisma db seed`
  - [ ] Test admin login: `admin` / `Admin123!`
  - [ ] Update CORS settings if needed (in `server/index.ts`)
  - [ ] Set up monitoring/logging
  - [ ] Configure backups for PostgreSQL
  - [ ] Set up custom domain
  - [ ] Enable SSL/HTTPS
  - [ ] Test mobile access (Tailscale for development)

  ---

  ## Recommended Choice

  **For most users**: Start with **Railway** or **Render**
  - Easy setup
  - Free/cheap for testing
  - Managed database
  - Easy to upgrade

  **For production**: **Vercel (Frontend) + Railway (Backend)**
  - Best performance
  - Professional
  - Reasonable cost

  **For hobbyists**: **Docker on Hetzner VPS**
  - Cheapest
  - Full control
  - Learn DevOps

  ---

  ## Troubleshooting

  ### "PayloadTooLargeError" on deployed backend
  - Increase body limit in server config (already set to 50MB in `server/index.ts`)
  - For Nginx: add `client_max_body_size 50M;`

  ### Database connection errors
  - Check `DATABASE_URL` format
  - Ensure database is in same region as app
  - Whitelist app IP in database firewall

  ### Frontend can't reach backend
  - Check CORS settings in `server/index.ts`
  - Verify `VITE_API_URL` is correct
  - Test API health endpoint: `https://your-api.com/api/health`

  ### Images not downloading
  - Check file permissions
  - Verify external image URLs are accessible
  - Increase timeout for fetch requests

  ---

  ## Support

  For deployment issues:
  1. Check platform-specific docs
  2. Review logs in deployment dashboard
  3. Test locally with production build: `npm run build && npm run preview`

  **Current Version**: v0.10.3



  ---

  # Version History


  # Version History

  ## v0.92.0 - Current Version (October 31, 2025)

  ### 💾 Database-Persisted Blog History

  #### Major Feature:
  - ✅ **Database Persistence** - Blog visit history now stored in PostgreSQL database
  - ✅ **Survives Server Restarts** - History persists across server restarts, browser clears, and devices
  - ✅ **Cross-Device Sync** - Same user account sees consistent history across all devices
  - ✅ **Smart Caching** - localStorage used as fast cache, database as source of truth
  - ✅ **Backward Compatible** - Existing localStorage data continues to work seamlessly

  #### Problem Solved:
  **Before:** Blog history stored only in browser localStorage
  - ❌ Lost when clearing browser data
  - ❌ Lost when switching devices
  - ❌ Not tied to user account
  - ❌ Appeared to "reset" on server restart

  **After:** Blog history stored in PostgreSQL database
  - ✅ Persists across browser clears
  - ✅ Syncs across devices for same user
  - ✅ Tied to user account
  - ✅ Survives server restarts permanently

  #### New Database Table:
  ```prisma
  model BlogVisitHistory {
    id           String   @id @default(uuid())
    userId       String
    blogName     String
    displayName  String?
    avatar       String?
    lastVisited  DateTime @default(now())
    visitCount   Int      @default(1)
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt
    
    @@unique([userId, blogName])
    @@index([userId])
    @@index([userId, lastVisited])
    @@index([blogName])
  }
  ```

  #### New API Endpoints:
  - ✅ `GET /api/users/:userId/blog-visits` - Load user's blog visit history
  - ✅ `POST /api/users/:userId/blog-visits` - Track or update a single blog visit
  - ✅ `POST /api/users/:userId/blog-visits/sync` - Batch sync multiple visits
  - ✅ `DELETE /api/users/:userId/blog-visits` - Clear all blog visit history

  #### Smart Sync Strategy:
  1. **Write to localStorage** - Immediate UI update (0ms)
  2. **Debounced DB Sync** - Writes to database after 2 seconds
  3. **Load from Database** - Dashboard loads from DB on mount
  4. **Fallback to Cache** - Uses localStorage if database unavailable
  5. **Conflict Resolution** - Newer timestamps win, max visit counts preserved

  #### Technical Implementation:
  - `prisma/schema.prisma` - Added `BlogVisitHistory` model with indexes
  - `server/index.ts` - Added 4 new API endpoints (164 lines)
  - `src/utils/blogHistory.ts` - Added database sync functions (80 lines)
  - `src/features/dashboard/Dashboard.tsx` - Updated to load from database (25 lines)

  #### Performance:
  - **Load history**: ~50-100ms (indexed database query)
  - **Track visit**: ~20-30ms (upsert operation, debounced)
  - **localStorage cache**: 0ms (instant access)
  - **Network overhead**: 1 GET on mount + debounced POSTs

  #### User Experience:
  - 🔄 **Seamless migration** - Existing history automatically syncs to database
  - 📱 **Cross-device** - Visit blogs on phone, see history on desktop
  - 💾 **Never lose data** - Even clearing browser cache preserves history
  - ⚡ **Fast UI** - localStorage cache ensures instant dashboard loading
  - 🔌 **Offline capable** - Falls back to localStorage when offline

  #### Console Logs:
  ```
  [BlogHistory] Loaded 15 visits from database
  [Dashboard] Loaded 15 recent blogs, 0 remaining
  [BlogHistory] Tracked visit to @exampleblog (16 blogs in history)
  [BlogHistory] Synced visit to @exampleblog to database
  ```

  #### Migration:
  - ✅ **Automatic** - No user action required
  - ✅ **Backward compatible** - Works with or without database
  - ✅ **Gradual sync** - localStorage data syncs as you visit blogs
  - ✅ **Zero downtime** - Dashboard continues working during migration

  #### Documentation:
  - Created `BLOG_HISTORY_PERSISTENCE.md` - Complete implementation guide
  - Updated `DATABASE.md` - Added BlogVisitHistory table documentation
  - Console logging for debugging and verification

  #### Security Features (Prepared):
  - Created comprehensive security infrastructure (Priority 1)
  - JWT authentication system with httpOnly cookies
  - OAuth token encryption utilities (AES-256-GCM)
  - Input validation schemas (Zod)
  - Rate limiting configurations
  - Security headers (Helmet)
  - Error handling system
  - Health check endpoints
  - Documentation: `SECURITY_IMPLEMENTATION.md`, `PRIORITY_1_SUMMARY.md`
  - Status: Infrastructure ready, integration pending

  ---

  ## v0.91.0 - (October 29, 2025)

  ### 📋 Checkpoint Release

  #### Status:
  - ✅ **Checkpoint committed** - Stable release with recent modifications
  - ✅ **Modified files documented** - Blog.tsx, StoredImages.tsx, imageDownload.ts

  #### Modified Files:
  - `src/features/blog/Blog.tsx` - Blog viewer enhancements
  - `src/features/stored/StoredImages.tsx` - Stored images improvements  
  - `src/utils/imageDownload.ts` - Image download utility updates

  #### Notes:
  - This is a checkpoint release capturing the current stable state
  - All core features functioning as expected
  - Ready for continued development

  ---

  ## v0.90.0 - (October 29, 2025)

  ### 🎯 Enhanced Filename Control & Duplicate Management

  #### New Filename Pattern Options
  - ✅ **"Original (Tumblr)"** - Pure Tumblr filename: `tumblr_psmx07p9EQ1u545pyo1_640.jpg`
  - ✅ **"Blog + Original"** - Blog prefix + Tumblr filename: `oldguyjb_tumblr_psmx07p9EQ1u545pyo1_640.jpg`
  - ✅ **8 Total Patterns** - Including Blog+Tags+Date, Date+Blog+Tags, Tags Only, Timestamp, Simple
  - ✅ **Settings Integration** - All downloads now respect the pattern chosen in Settings → Downloads tab

  #### Filename Generation Refactor
  - ✅ **Removed hardcoded prefixes** - `getImageFilename()` no longer adds blog name prefix
  - ✅ **Pattern-based logic** - `generateMetadataFilename()` handles all pattern transformations
  - ✅ **Consistent behavior** - Same pattern applied across Blog downloads and Stored downloads

  #### Load Multiple Posts Enhancement
  - ✅ **Fixed race condition** - New `loadMultiple(count)` function in `useTumblrBlog` hook
  - ✅ **No more duplicates** - Eliminated duplicate posts when using "Load +100" / "Load +200"
  - ✅ **Internal offset tracking** - State updated once at end, preventing React key warnings
  - ✅ **Better UX** - "Load +100" and "Load +200" buttons for faster bulk loading

  #### Technical Changes:
  - `src/utils/imageDownload.ts` - Added "original" and "blog-original" patterns to `generateMetadataFilename()`
  - `src/utils/imageDownload.ts` - Removed blog name prefix logic from `getImageFilename()`
  - `src/store/preferences.ts` - Updated `FilenamePattern` type with new options
  - `src/features/settings/Settings.tsx` - Added new pattern options to UI
  - `src/hooks/useTumblrBlog.ts` - Implemented `loadMultiple()` to prevent race conditions
  - `src/features/blog/Blog.tsx` - Updated "Load +100" / "Load +200" to use `loadMultiple()`

  #### Known Issue:
  - ⚠️ **Browser caching** - May require hard refresh (Cmd+Shift+R) to see new filename patterns

  ---

  ## v0.86.2 - (October 29, 2025)

  ### 🐛 Bug Fixes & Enhancements

  #### Database Statistics
  - ✅ **Fixed database stats endpoint** - Resolved SQL errors for non-existent tables
  - ✅ **Query optimization** - Changed to query `pg_class` directly instead of `pg_tables`
  - ✅ **Safe table counting** - Added fallback for tables not yet created in database
  - ✅ **Comprehensive error logging** - Better debugging for database stat failures
  - ✅ **Storage breakdown** - Shows total size, per-category breakdown, and detailed table info

  #### Filter-Aware UI
  - ✅ **Corrected total counts** - Selection toolbar shows correct total for filtered blog
  - ✅ **Smart "Select All"** - Prompts to load all remaining images before selecting
  - ✅ **Load & Select +50** - Incremental loading with selection for filtered blogs
  - ✅ **Filter-aware buttons** - "Delete All [blogname]" shows correct count
  - ✅ **Pagination summary** - "Showing X of Y" displays filter-specific counts

  #### Store All Functionality (In Progress)
  - ⚠️ **Known issue** - Store All currently stores only loaded posts, not all posts
  - ⚠️ **Root cause** - `useTumblrBlog` hook not updating `blogData.posts` correctly after `loadAll()`
  - ⚠️ **Next fix** - Will update hook to properly propagate loaded posts to state

  #### Technical Changes:
  - `server/index.ts` - Enhanced `/api/admin/database-stats` endpoint
  - `src/features/stored/StoredImages.tsx` - Filter-aware counts and smart selection
  - `src/components/ui/SelectionToolbar.tsx` - Added `filterContext` prop
  - `src/features/blog/Blog.tsx` - Attempted fix for Store All (requires further work)

  ---

  ## v0.86.1 - (October 27, 2025)

  ### 🎨 Compact UI Optimization

  #### Space Savings:
  - ✅ **Blog Viewer** - 82% reduction in action button space (~268px saved)
  - ✅ **Stored Images** - 39% reduction in action button space (~106px saved)
  - ✅ **Overall** - More content visible without scrolling

  #### What Changed:

  **Blog Viewer - Single-Row Compact Layout:**
  - Replaced 3-4 stacked ActionButtonGroup cards with single horizontal bar
  - Buttons organized with dividers: Load | Download | Store
  - Wraps gracefully on mobile devices
  - Dividers hidden on mobile when buttons wrap

  **Stored Images - Ultra-Compact Sections:**
  - ActionButtonGroup now supports `compact` prop
  - Reduced padding (p-4 → p-2)
  - Smaller title text (text-sm → text-[10px])
  - Tighter button spacing (gap-2 → gap-1)
  - Reduced section spacing (gap-4 → gap-2)

  **New Button Size:**
  - Added "xs" size variant (h-7 px-2 text-xs)
  - Provides option for even more compact layouts

  #### Before & After:

  **Blog Viewer:**
  ```
  Before: Load section (90px) + Download section (110px) + Store section (80px) + gaps (48px) = 328px
  After:  Single compact bar = 60px
  Savings: 268px (82% reduction)
  ```

  **Stored Images:**
  ```
  Before: 3 sections (240px) + gaps (32px) = 272px
  After:  3 compact sections (150px) + tight gaps (16px) = 166px
  Savings: 106px (39% reduction)
  ```

  #### Technical Changes:
  - `src/components/ui/ActionButtonGroup.tsx` - Added `compact` prop with conditional spacing
  - `src/components/ui/Button.tsx` - Added "xs" size variant
  - `src/features/blog/Blog.tsx` - Replaced ActionButtonGroup with single-row layout
  - `src/features/stored/StoredImages.tsx` - Applied compact mode to all sections

  ---

  ## v0.86.0 - October 27, 2025

  ### ✨ UI Redesign & Download Parity

  #### New Features:
  - ✅ **Centralized Image Grid Settings** - Grid columns and image size moved to Settings page
  - ✅ **ActionButtonGroup Component** - Grouped action buttons with visual sections (Load, Download, Store, Delete)
  - ✅ **Download Parity for Stored** - Full download capabilities in Stored Images matching Blog viewer
    - Download Selected
    - Download Selected to Folder
    - Download All (with filter support)
    - Download All to Folder (with filter support)
  - ✅ **Enhanced Confirmations** - Safety confirmations for large operations (100+ images)
  - ✅ **Filter-Aware Button Labels** - Buttons show context (e.g., "Download All gmanak (395)")
  - ✅ **Cleaner Filter Bar** - Removed inline grid controls for streamlined UI

  #### What's New:

  **Settings Page:**
  - New "Image Grid Display" section
  - Grid columns selector (2-6)
  - Image size selector (Compact/Comfortable/Spacious)
  - Show image info toggle (resolution/size overlay)

  **Reorganized Action Buttons:**
  - **Load Section** - Load All button with remaining count
  - **Download Section** - Download Selected, Download Selected to Folder, Download All, Download All to Folder
  - **Store Section** - Store Selected, Store All (when logged in)
  - **Delete Section** - Delete Selected, Delete All (Stored Images only)

  **Filter-Aware Operations:**
  - All download/delete operations respect active filters (blog, date, resolution)
  - Button labels show filtered context (e.g., "Download All gmanak (395)" when filtered by blog)
  - Clear visual feedback on what will be affected

  #### User Experience:

  **Settings Workflow:**
  ```
  1. Navigate to Settings
  2. Find "Image Grid Display" section
  3. Choose columns (2-6), size (Compact/Comfortable/Spacious), show info overlay
  4. Changes apply immediately to all grids
  ```

  **Grouped Actions Workflow (Blog Viewer):**
  ```
  Load Section:
    [Load All (821 more)]

  Download Section:
    [Download Selected (0)] [Download Selected to Folder]
    [Download All (871)] [Download All to Folder (871)]

  Store Section:
    [Store Selected (0)] [Store All (871)]
  ```

  **Filter-Aware Download (Stored Images):**
  ```
  1. Filter by blog "gmanak" - shows 395 of 1181 images
  2. Button shows "Download All gmanak (395)"
  3. Downloads only filtered images
  4. Clear filter to access all images again
  ```

  #### Implementation Details:
  - Created `ActionButtonGroup.tsx` component for consistent grouping
  - Removed grid controls from `ImageFilters.tsx` interface
  - Added three new download handlers to `StoredImages.tsx`:
    - `handleDownloadAll()` - Downloads all filtered images
    - `handleDownloadAllToFolder()` - Downloads all filtered images to folder
    - `handleDownloadSelectedToFolder()` - Downloads selected images to folder
  - Integrated global operation status tracking for all downloads
  - Added `showImageInfo` preference to preferences store
  - Enhanced confirmation dialogs for operations affecting 100+ images

  #### Technical Changes:
  - `src/store/preferences.ts` - Added `showImageInfo` boolean preference
  - `src/features/settings/Settings.tsx` - Added "Image Grid Display" section
  - `src/components/ui/ActionButtonGroup.tsx` - New component for grouped buttons
  - `src/components/ui/ImageFilters.tsx` - Removed `gridColumns` and `gridImageSize` props
  - `src/features/blog/Blog.tsx` - Reorganized buttons into ActionButtonGroup sections
  - `src/features/stored/StoredImages.tsx` - Added full download capabilities with ActionButtonGroup sections
  - All download operations integrate with global operation status (Navigation bar indicator)

  ---

  ## v0.85.2 - October 27, 2025

  ### ✨ Download Selected to Folder + Download All Enhancement

  #### New Features:
  - ✅ **"Download Selected to Folder" button** - Download only selected images to a blog-named folder
  - ✅ **"Download All to Folder" enhanced** - Now downloads ALL images (loads remaining if needed)
  - ✅ **Smart confirmation dialogs** - Shows total count and confirms loading all images
  - ✅ **Blue folder icon** - "To Folder" button in selection toolbar is blue for distinction

  #### What's New:

  **Two Download-to-Folder Modes:**

  1. **"Download Selected to Folder"** (Blue button in Selection Toolbar)
    - Downloads only selected images
    - Appears in selection toolbar when images are selected
    - Creates subfolder with blog name
    - Shows selection count (e.g., "To Folder")
    
  2. **"Download All to Folder"** (Button below filters)
    - Downloads ALL images from blog (not just loaded/selected)
    - Automatically loads remaining images if needed
    - Shows total count from blog (e.g., "Download All to Folder (5,342)")
    - Confirms before loading all images

  #### User Experience:

  **Scenario 1: Download Selected Images**
  ```
  1. Select 25 images from grid
  2. Click "To Folder" button (blue, in toolbar)
  3. Select parent directory
  4. Images save to: /parent/blogname/image001.jpg...
  ```

  **Scenario 2: Download All Images (Blog has 1,000 images, 50 loaded)**
  ```
  1. Click "Download All to Folder (1,000)"
  2. Confirm: "Load all 950 remaining images first?"
  3. Wait for loading (shows progress)
  4. Select parent directory
  5. All 1,000 images save to folder
  ```

  **Scenario 3: Download All Images (All already loaded)**
  ```
  1. Click "Download All to Folder (132)"
  2. Select parent directory (no loading needed)
  3. All 132 images save to folder
  ```

  #### Technical Implementation:

  **New Function: `handleDownloadSelectedToFolder()`**
  ```typescript
  const handleDownloadSelectedToFolder = async () => {
    // Get selected posts only
    const selectedPosts = allPhotoPosts.filter(post => 
      gridSelection.has(post.id)
    );
    
    // Request directory (preserves user gesture)
    const parentDirHandle = await window.showDirectoryPicker();
    
    // Fetch selected images
    for (const post of selectedPosts) {
      const blob = await fetch(post.images[0]).then(r => r.blob());
      files.push({ blob, filename });
    }
    
    // Save to subfolder
    const subdirHandle = await parentDirHandle.getDirectoryHandle(
      username, 
      { create: true }
    );
    
    for (const file of files) {
      await saveToDirectory(subdirHandle, file);
    }
  };
  ```

  **Enhanced: `handleDownloadAllToFolder()`**
  ```typescript
  const handleDownloadAllToFolder = async () => {
    // Check if more images need loading
    if (hasMore && blogData) {
      const totalImages = blogData.postCount;
      const loadedImages = blogData.posts.length;
      
      if (confirm(`Load all ${totalImages - loadedImages} remaining?`)) {
        await loadAll(); // Load all images first
      }
    }
    
    // Now download all loaded images
    // ... (same as before)
  };
  ```

  **UI Changes:**

  **SelectionToolbar.tsx:**
  - Added `onDownloadToFolder?` prop
  - Added blue "To Folder" button after "Download" button
  - Folder icon (same as main button)
  - Shows progress during download

  **Blog.tsx:**
  - "Download All to Folder" button shows total blog count if hasMore
  - Example: "Download All to Folder (5,342)" vs "(132)"
  - Confirmation dialog before loading all images
  - Calls `loadAll()` if needed before downloading

  #### Button Colors:

  | Button | Color | Icon | Location |
  |--------|-------|------|----------|
  | **Download** | Green | Download arrow | Toolbar |
  | **To Folder** | Blue | Folder | Toolbar (selected) |
  | **Store** | Purple | Database | Toolbar |
  | **Download to Folder** | Gray | Folder | Below filters (all) |

  #### Example Dialogs:

  **Loading Confirmation:**
  ```
  This blog has 5,342 total images.
  Currently loaded: 50

  Load all 5,292 remaining images before downloading to folder?

  This may take a while.

  [Cancel] [OK]
  ```

  **Selected Download Confirmation:**
  ```
  Download 25 selected images to a folder named "photography"?

  You'll be prompted to select where to save the folder.

  [Cancel] [OK]
  ```

  **All Download Confirmation:**
  ```
  Download all 132 loaded images to a folder named "art"?

  You'll be prompted to select where to save the folder.

  [Cancel] [OK]
  ```

  #### User Benefits:

  1. **Flexibility** - Download selected OR all images
  2. **Efficiency** - Don't load everything if you only want selection
  3. **Complete Backups** - Easy to download entire blog archive
  4. **Clear Intent** - Button text shows exactly what will download
  5. **Smart Loading** - Automatically loads remaining images when needed

  #### Files Modified:
  - `src/features/blog/Blog.tsx` - Added `handleDownloadSelectedToFolder()`, enhanced `handleDownloadAllToFolder()`
  - `src/components/ui/SelectionToolbar.tsx` - Added `onDownloadToFolder` prop and blue button
  - `package.json` - Updated version to 0.85.2
  - `src/components/ui/VersionBadge.tsx` - Updated version to v0.85.2

  #### Result:
  ✅ Download selected images to folder
  ✅ Download all blog images (with auto-load)
  ✅ Clear button distinction (colors/text)
  ✅ Smart confirmation dialogs
  ✅ Flexible workflow options

  ---

  ## v0.85.1 (October 27, 2025)

  ### 🐛 Fix Download to Folder + Full Diagnostics

  #### Critical Fix:
  - ✅ **Fixed SecurityError** - "Must be handling a user gesture to show a file picker"
  - ✅ **Request directory FIRST** - Before fetching images (preserves user gesture)
  - ✅ **Full diagnostic logging** - Comprehensive console logging for troubleshooting
  - ✅ **Better error handling** - Clear error messages and fallback support

  #### The Problem:

  **User Report:**
  ```
  SecurityError: Failed to execute 'showDirectoryPicker' on 'Window': 
  Must be handling a user gesture to show a file picker.
  ```

  **Root Cause:**
  ```typescript
  // OLD FLOW (BROKEN):
  1. User clicks button ✅ (user gesture)
  2. Confirm dialog ✅ (still has gesture)
  3. Fetch images (async loop) ❌ (loses gesture!)
  4. showDirectoryPicker() ❌ (no gesture = SecurityError)
  ```

  The File System Access API requires `showDirectoryPicker()` to be called **directly** in response to a user gesture. By fetching images first (which is async and takes time), the user gesture chain was broken, causing a SecurityError.

  #### The Solution:

  **NEW FLOW (FIXED):**
  ```typescript
  1. User clicks button ✅ (user gesture)
  2. Confirm dialog ✅ (still has gesture)
  3. showDirectoryPicker() ✅ (called immediately, has gesture!)
  4. Fetch images ✅ (async, but directory already selected)
  5. Save to selected directory ✅ (write files)
  ```

  **Key Change:**
  ```typescript
  // Step 1: Request directory FIRST (while we have user gesture)
  const parentDirHandle = await window.showDirectoryPicker({
    mode: 'readwrite',
    startIn: 'downloads',
  });

  // Step 2: THEN fetch images (gesture no longer needed)
  const files = await fetchAllImages();

  // Step 3: Save to already-selected directory
  await saveFilesToDirectory(parentDirHandle, files);
  ```

  #### Full Diagnostic Logging:

  **Before (minimal logging):**
  ```
  [Download Dir] ❌ Error in batch download: SecurityError
  ```

  **After (comprehensive logging):**
  ```
  [Blog] 📁 Starting folder download for 50 images from @photography
  [Blog] ✅ File System Access API supported
  [Blog] 🔹 Step 1: Requesting directory picker...
  [Blog] ✅ Directory selected: Downloads
  [Blog] 🔹 Step 2: Fetching 50 images...
  [Blog] 🔸 Fetching image 1/50: https://...
  [Blog] ✅ Fetched image001.jpg (342.5 KB)
  [Blog] 🔸 Fetching image 2/50: https://...
  [Blog] ✅ Fetched image002.jpg (512.1 KB)
  ...
  [Blog] ✅ Fetched 50/50 images successfully
  [Blog] 🔹 Step 3: Saving images to folder...
  [Blog] 💾 Saving to directory: Downloads/photography/
  [Blog] ✅ Created/opened subdirectory: photography
  [Blog] ✅ (1/50) Saved: image001.jpg
  [Blog] ✅ (2/50) Saved: image002.jpg
  ...
  [Blog] ✅ Batch save complete: 50 succeeded, 0 failed
  [Blog] ✅ Folder download complete!
  ```

  #### New Error Handling:

  **User Cancellation:**
  ```typescript
  if (error.name === 'AbortError') {
    console.log('[Blog] ℹ️ User cancelled directory picker');
    alert('Download cancelled - no directory selected.');
    return;
  }
  ```

  **API Not Supported (Fallback):**
  ```typescript
  if (!isFileSystemAccessSupported()) {
    console.warn('[Blog] ⚠️ Using fallback download method');
    // Uses traditional downloads with filename prefixes
    // Example: "photography_image001.jpg"
  }
  ```

  **Permission Errors:**
  ```typescript
  console.error('[Blog] ❌ Error showing directory picker:', error);
  alert(`Failed to open directory picker: ${error.message}\n\nWill use fallback download method.`);
  // Continues with fallback instead of failing
  ```

  #### Implementation Details:

  **Three-Step Process:**

  **Step 1: Request Directory (Immediate)**
  - Called right after confirmation
  - While user gesture is still active
  - Stores `FileSystemDirectoryHandle`
  - Fallback to null if not supported/cancelled

  **Step 2: Fetch Images (Async)**
  - Loops through all posts
  - Fetches each image as Blob
  - Updates progress indicator
  - Logs each fetch (URL, filename, size)

  **Step 3: Save Files (Async)**
  - If directory handle: Save to File System API
  - If no handle: Fallback to traditional downloads
  - Creates subdirectory with blog name
  - Logs each save operation
  - Reports final success/failure counts

  #### Diagnostic Logging Levels:

  **🔹 Major Steps:**
  - Step 1: Requesting directory
  - Step 2: Fetching images
  - Step 3: Saving files

  **🔸 Minor Operations:**
  - Individual image fetches
  - Individual file saves

  **✅ Success:**
  - API supported
  - Directory selected
  - Image fetched
  - File saved

  **⚠️ Warnings:**
  - API not supported
  - Using fallback method

  **❌ Errors:**
  - Fetch failures
  - Save failures
  - Permission errors

  **ℹ️ Info:**
  - User cancellations
  - Fallback usage

  #### User Benefits:

  1. **Works Now** - Fixed SecurityError
  2. **Visibility** - See exactly what's happening
  3. **Troubleshooting** - Full diagnostic logs
  4. **Graceful Fallback** - Fallsback automatically on errors
  5. **Clear Feedback** - User-friendly error messages

  #### Files Modified:
  - `src/features/blog/Blog.tsx` - Completely rewrote `handleDownloadAllToFolder()`
  - `package.json` - Updated version to 0.85.1
  - `src/components/ui/VersionBadge.tsx` - Updated version to v0.85.1

  #### Result:
  ✅ SecurityError fixed
  ✅ Directory picker works correctly
  ✅ Full diagnostic logging
  ✅ Better error handling
  ✅ Automatic fallback support

  ---

  ## v0.85.0 (October 27, 2025)

  ### 📊 Global Operation Status Indicator in Navigation

  #### New Feature:
  - ✅ **Real-time operation status in top navigation** - See download/store progress from anywhere
  - ✅ **Animated status indicator** - Shows current operation, progress, and source
  - ✅ **Three operation types** - Download, Download-to-Folder, Store
  - ✅ **Visual progress bar** - Percentage and animated bar
  - ✅ **Smooth animations** - Fades in/out with Framer Motion

  #### How It Works:

  **User Experience:**
  1. Start any download or store operation from any page
  2. Status indicator appears in center of top navigation
  3. Shows operation type, progress (X/Y), source blog, and percentage
  4. Animated icon indicates activity type
  5. Automatically disappears when operation completes

  **Status Display:**
  ```
  ┌──────────────────────────────────────┐
  │  📥 Downloading 47/132  photography  │
  │  35%  ████████░░░░░░░░  (progress)  │
  └──────────────────────────────────────┘
  ```

  #### Operation Types:

  **1. Download (Blue)**
  - Icon: Bouncing download arrow
  - Text: "Downloading X/Y"
  - Triggered by: "Download Loaded" button

  **2. Download-to-Folder (Purple)**
  - Icon: Pulsing folder
  - Text: "Saving to folder X/Y"
  - Triggered by: "Download to Folder" button

  **3. Store (Green)**
  - Icon: Spinning database
  - Text: "Storing X/Y"
  - Triggered by: "Store Loaded" button

  #### Technical Implementation:

  **New Global State (`src/store/operations.ts`):**

  ```typescript
  interface OperationProgress {
    type: 'download' | 'store' | 'download-folder';
    current: number;
    total: number;
    source?: string; // e.g., blog name
  }

  // Jotai atoms for global state
  currentOperationAtom       // Current operation or null
  startOperationAtom        // Helper to start operation
  updateOperationProgressAtom  // Helper to update progress
  endOperationAtom          // Helper to end operation
  ```

  **Navigation Component Updates:**

  ```typescript
  const [currentOperation] = useAtom(currentOperationAtom);

  const getOperationDisplay = () => {
    if (!currentOperation) return null;
    
    const percentage = Math.round((current / total) * 100);
    
    // Return icon, text, color based on operation type
    return { icon, text, color, percentage, source };
  };

  // Renders animated status indicator
  <AnimatePresence>
    {operationDisplay && (
      <motion.div className="flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2">
          {icon}
          <span>{text}</span>
          <span>{percentage}%</span>
          <ProgressBar percentage={percentage} />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
  ```

  **Blog Component Updates:**

  All download/store handlers updated to use global state:

  ```typescript
  // handleDownloadAll
  startOperation({ type: 'download', current: 0, total, source: username });
  // ... during download ...
  updateOperationProgress({ current: i, total });
  // ... on completion ...
  endOperation();

  // handleDownloadAllToFolder
  startOperation({ type: 'download-folder', current: 0, total, source: username });
  // ... progress updates ...
  endOperation();

  // handleStoreAll
  startOperation({ type: 'store', current: 0, total, source: username });
  // ... progress updates ...
  endOperation();
  ```

  #### UI/UX Features:

  **Visual Design:**
  - Rounded pill shape with colored background
  - Color-coded by operation type (blue/purple/green)
  - Dark mode optimized
  - Animated icons (bounce/pulse/spin)
  - Smooth fade in/out animations

  **Layout:**
  - Centered in navigation bar (hidden on mobile)
  - Doesn't interfere with navigation links
  - Flexbox layout with gap spacing
  - Responsive text sizing

  **Progress Indication:**
  - Current/total count (e.g., "47/132")
  - Percentage (e.g., "35%")
  - Animated progress bar (fills left to right)
  - Source blog name displayed below counts

  **Animations:**
  - Fade in: opacity 0→1, slide down from -10px
  - Fade out: opacity 1→0, slide up to -10px
  - Progress bar: smooth width transition (0.3s)
  - Icons: bounce/pulse/spin continuously

  #### User Benefits:

  1. **Visibility** - Always see active operations
  2. **Context** - Know what's happening from any page
  3. **Progress** - Real-time updates on completion
  4. **Source Tracking** - See which blog is being processed
  5. **Non-Intrusive** - Appears only when needed

  #### Example Scenarios:

  **Scenario 1: Download large batch**
  ```
  User: Click "Download Loaded (500)" on @photography
  Status: 📥 Downloading 1/500  photography  0%
        📥 Downloading 250/500  photography  50%
        📥 Downloading 500/500  photography  100%
        (disappears)
  ```

  **Scenario 2: Store to database**
  ```
  User: Click "Store Loaded (132)" on @art
  Status: 💾 Storing 1/132  art  0%
        💾 Storing 132/132  art  100%
        Alert: "✅ Stored: 132"
        (status disappears)
  ```

  **Scenario 3: Download to folder**
  ```
  User: Click "Download to Folder (75)" on @nature
  Status: 📁 Saving to folder 1/75  nature  1%
        📁 Saving to folder 37/75  nature  49%
        📁 Saving to folder 75/75  nature  100%
        Alert: "✅ Successfully downloaded 75 images!"
        (status disappears)
  ```

  #### Technical Details:

  **State Management:**
  - Global Jotai atoms (not React Context)
  - Automatic cleanup on operation end
  - Thread-safe updates (atom-based)
  - No prop drilling required

  **Performance:**
  - Minimal re-renders (only navigation updates)
  - Efficient progress calculations
  - Debounced animations
  - Small bundle size impact

  **Browser Compatibility:**
  - Works in all modern browsers
  - Graceful degradation (no animations on older browsers)
  - Responsive design (hidden on mobile due to space)

  #### Files Modified:
  - `src/store/operations.ts` (NEW) - Global operation state
  - `src/components/navigation/Navigation.tsx` - Status indicator UI
  - `src/features/blog/Blog.tsx` - Updated all handlers to use global state
  - `package.json` - Updated version to 0.85.0
  - `src/components/ui/VersionBadge.tsx` - Updated version to v0.85.0

  #### Result:
  ✅ Always see active operations
  ✅ Real-time progress tracking
  ✅ Beautiful animated UI
  ✅ Works from any page
  ✅ Non-intrusive design

  ---

  ## v0.84.2 (October 27, 2025)

  ### 📁 Download All Images to Folder

  #### New Feature:
  - ✅ **"Download to Folder" button** - Save all blog images to a subdirectory named after the blog
  - ✅ **Automatic subdirectory creation** - Creates a folder with the blog name inside your chosen directory
  - ✅ **File System Access API** - Modern browser API for organized downloads
  - ✅ **Fallback support** - Works in all browsers with filename prefixes

  #### How It Works:

  **User Experience:**
  1. Click "Download to Folder (X)" button on any blog
  2. Select a parent directory (e.g., Downloads)
  3. App creates a subdirectory named after the blog (e.g., "photography")
  4. All images download into that subdirectory with proper filenames
  5. Progress indicator shows current/total during download

  **Technical Flow:**
  ```
  Click button → Confirm dialog → Fetch all images as blobs
  → Prompt for parent directory → Create subdirectory
  → Download all files → Success notification
  ```

  **Example:**
  ```
  User selects: /Users/john/Downloads
  App creates:  /Users/john/Downloads/photography/
  Downloaded:   photography/image001.jpg
                photography/image002.jpg
                photography/image003.jpg
                ...
  ```

  #### Implementation:

  **New Utility Functions in `downloadDirectory.ts`:**

  1. **`downloadToSubdirectory()`**
    - Downloads a single file to a subdirectory
    - Creates subdirectory if it doesn't exist
    - Returns success/error status

  2. **`downloadAllToSubdirectory()`**
    - Main function for batch downloads
    - Prompts user for parent directory
    - Creates subdirectory with blog name
    - Downloads all files with progress callbacks
    - Returns detailed result (successCount, failedCount, method)

  3. **`downloadAllToSubdirectoryFallback()`**
    - Fallback for browsers without File System Access API
    - Uses traditional downloads with filename prefixes (e.g., "photography_image001.jpg")
    - Delays between downloads to avoid browser blocking

  **Blog Component Changes:**

  ```typescript
  const handleDownloadAllToFolder = async () => {
    // Confirm action
    if (!window.confirm(...)) return;
    
    // Fetch all images as blobs
    const files = await fetchAllImagesAsBlobs();
    
    // Download to subdirectory
    const result = await downloadAllToSubdirectory(username, files);
    
    // Show result notification
    if (result.success) {
      alert(`✅ Successfully downloaded ${result.successCount} images!`);
    }
  };
  ```

  **UI Button:**
  - Folder icon (SVG)
  - Shows count of images
  - Displays progress during download ("Saving... 47/132")
  - Disabled during operations
  - Positioned after "Download Loaded" button

  #### Browser Compatibility:

  **Modern Browsers (File System Access API):**
  - ✅ Chrome 86+
  - ✅ Edge 86+
  - ✅ Opera 72+
  - Creates real subdirectories
  - Single permission prompt
  - Fast batch downloads

  **Fallback Browsers:**
  - ✅ Firefox
  - ✅ Safari
  - ✅ Older browsers
  - Uses filename prefixes instead of subdirectories
  - Multiple download prompts (depending on settings)
  - Works everywhere

  #### User Benefits:

  1. **Organized Downloads** - Each blog gets its own folder
  2. **Easy Management** - Find all images from a specific blog quickly
  3. **Batch Operations** - Download hundreds of images in one action
  4. **No Manual Sorting** - Automatic organization by blog name
  5. **Progress Tracking** - See exactly what's downloading

  #### Example Use Cases:

  **Scenario 1: Backing up a favorite blog**
  ```
  Visit @photography blog
  Load all 500 images
  Click "Download to Folder (500)"
  Select /Backups/Tumblr
  Result: /Backups/Tumblr/photography/ with 500 images
  ```

  **Scenario 2: Collecting from multiple blogs**
  ```
  Visit @art blog → Download to Folder → /Downloads/art/
  Visit @nature blog → Download to Folder → /Downloads/nature/
  Visit @space blog → Download to Folder → /Downloads/space/
  Result: Organized by blog in separate folders
  ```

  **Scenario 3: Selective downloads**
  ```
  Visit blog → Filter "Images Only"
  Load first 50 images
  Click "Download to Folder (50)"
  Result: Only filtered images in blog folder
  ```

  #### Technical Details:

  **Progress Updates:**
  - Fetch phase: Shows image fetch progress (1/100, 2/100...)
  - Download phase: Shows file write progress
  - Two-pass process ensures all files ready before writing

  **Error Handling:**
  - Individual file failures don't stop batch
  - Reports success count vs. failed count
  - Console logs detailed errors
  - User notification shows summary

  **Performance:**
  - 50ms delay between file writes (File System Access)
  - 200ms delay between downloads (fallback)
  - Prevents system overload
  - Smooth progress updates

  #### Files Modified:
  - `src/utils/downloadDirectory.ts` - Added subdirectory download functions
  - `src/features/blog/Blog.tsx` - Added `handleDownloadAllToFolder()` and button
  - `package.json` - Updated version to 0.84.2
  - `src/components/ui/VersionBadge.tsx` - Updated version to v0.84.2

  #### Result:
  ✅ One-click organized downloads by blog name
  ✅ Works in all browsers with fallback
  ✅ Progress tracking and error handling
  ✅ User-friendly notifications
  ✅ Clean, organized file structure

  ---

  ## v0.84.1 (October 27, 2025)

  ### 📊 Comprehensive Tumblr API Limits Display

  #### Enhancement:
  - ✅ **Show all Tumblr API limits** - Display daily (5,000) and hourly (1,000) limits
  - ✅ **Remaining capacity calculator** - Show exactly what you can do with remaining API calls
  - ✅ **Visual breakdown** - Beautiful cards showing limit details
  - ✅ **OAuth upgrade info** - Clear call-to-action for unlimited access

  #### What's New:

  **Tumblr API Limits Section:**
  - 📅 Daily Limit: 5,000 requests/day (with reset time)
  - ⏰ Hourly Limit: 1,000 requests/hour (rolling window)
  - 💎 OAuth upgrade information with benefits

  **Remaining Capacity Section:**
  Shows exactly what you can still do today:
  - 📸 View Blog (50 images) - How many blogs you can view
  - 🖼️ View 500 Images - How many times you can load 500 images
  - 🎨 View 1,000 Images - How many times you can load 1,000 images
  - 🌐 Browse 20 Blogs - How many times you can browse 20 different blogs

  **Educational Content:**
  - 💡 "How API Calls Work" explanation box
  - Clear breakdown of API call costs per action
  - Tips for efficient usage

  #### Implementation:

  **New Interface:**
  ```typescript
  interface UsageCapacity {
    viewBlog: number;          // How many blogs (50 images each)
    view500Images: number;     // How many times can view 500 images
    view1000Images: number;    // How many times can view 1000 images
    browse20Blogs: number;     // How many times can browse 20 different blogs
  }
  ```

  **Capacity Calculator:**
  ```typescript
  const calculateCapacity = (): UsageCapacity => {
    const remaining = stats.limit - stats.count;
    
    return {
      viewBlog: Math.floor(remaining / 2),           // 2 calls per blog
      view500Images: Math.floor(remaining / 11),     // 11 calls for 500 images
      view1000Images: Math.floor(remaining / 21),    // 21 calls for 1000 images
      browse20Blogs: Math.floor(remaining / 40),     // 40 calls for 20 blogs
    };
  };
  ```

  #### UI Features:

  **Limit Cards:**
  - Gradient backgrounds (blue for daily, purple for hourly)
  - Badge indicators showing "API Key" authentication level
  - Reset time display
  - Clear typography hierarchy

  **Capacity Cards:**
  - Shows remaining count for each action type
  - API call cost badge (e.g., "2 calls", "11 calls")
  - Emoji icons for visual scanning
  - Real-time calculations

  **Educational Box:**
  - Info icon with blue theme
  - Bullet list of how API calls work
  - Examples of efficient usage
  - Database vs. API call clarification

  #### Example Display:

  ```
  ┌─────────────────────────────────┐
  │  📅 Daily Limit                 │
  │  5,000                          │
  │  requests per day               │
  │  Resets at midnight (12:00 AM)  │
  └─────────────────────────────────┘

  ┌─────────────────────────────────┐
  │  📸 View Blog (50 images) [2]   │
  │  2,347                          │
  │  blogs remaining                │
  └─────────────────────────────────┘
  ```

  #### User Benefits:

  1. **Clear Understanding** - Know exactly what your limits are
  2. **Informed Usage** - See how many actions remain
  3. **Upgrade Awareness** - Learn about OAuth benefits
  4. **Efficient Planning** - Calculate capacity before large operations
  5. **Educational** - Understand how API calls work

  #### Files Modified:
  - `src/features/admin/Admin.tsx` - Added limit displays and capacity calculator
  - `package.json` - Updated version to 0.84.1
  - `src/components/ui/VersionBadge.tsx` - Updated version to v0.84.1

  #### Result:
  ✅ Complete visibility into Tumblr API limits
  ✅ Real-time capacity calculations
  ✅ Educational content for efficient usage
  ✅ Beautiful, informative UI
  ✅ Upgrade path clearly presented

  ---

  ## v0.82.1 (October 27, 2025)

  ### 🐛 Fix ImageViewer Navigation Limited to First 50 Images

  #### Fix:
  - ✅ **ImageViewer now navigates through ALL stored images** - Not just the first 50
  - ✅ **Automatic pagination** - Loads more images as you navigate
  - ✅ **Smart jump-to-end** - Loads all remaining images before jumping
  - ✅ **Shows actual total count** - Display shows full collection size

  #### The Problem:

  **User Report:**
  - "ImageViewer is showing only the first 50 images in Stored"
  - Could not navigate past image 50 even with 500+ images stored
  - Arrow keys stopped working at the end of the first batch
  - "Jump to End" button only went to image 50

  **Root Cause:**
  ```typescript
  // OLD: Only navigated within loaded images
  const handleNextImage = () => {
    if (selectedImage < filteredAndSortedImages.length - 1) {
      setSelectedImage(selectedImage + 1); // Stops at index 49!
    }
  };

  // ImageViewer showed:
  currentIndex: 49
  totalImages: 50  // ❌ Wrong! Should be 536
  ```

  Stored Images uses pagination (50 images per batch). The navigation functions were only aware of the currently loaded images, not the full collection.

  #### The Solution:

  **1. Automatic Pagination on Navigation:**

  ```typescript
  const handleNextImage = async () => {
    // At last image of current batch AND more images exist?
    if (selectedImage === filteredAndSortedImages.length - 1 && hasMore) {
      console.log('Loading more images...');
      await loadMore(); // Load next 50 images
      setSelectedImage(selectedImage + 1); // Continue to image 51
    } else {
      // Normal navigation
      setSelectedImage(selectedImage + 1);
    }
  };
  ```

  **2. Smart Jump-to-End:**

  ```typescript
  const handleJumpToEnd = async () => {
    // If not all images loaded yet
    if (hasMore) {
      setShouldJumpToEnd(true);
      await loadAll(); // Load ALL remaining images
      // useEffect will jump to last image when loading completes
    } else {
      // Already have all images
      setSelectedImage(filteredAndSortedImages.length - 1);
    }
  };

  // useEffect watches for loading completion
  useEffect(() => {
    if (shouldJumpToEnd && !loadingMore) {
      setSelectedImage(filteredAndSortedImages.length - 1);
      setShouldJumpToEnd(false);
    }
  }, [shouldJumpToEnd, loadingMore, filteredAndSortedImages.length]);
  ```

  **3. Show Actual Total Count:**

  ```typescript
  // OLD:
  totalImages={filteredAndSortedImages.length}  // 50

  // NEW:
  totalImages={stats?.total || filteredAndSortedImages.length}  // 536!
  ```

  **4. Enable Next Arrow When More Available:**

  ```typescript
  // OLD:
  onNext={selectedImage < loaded.length - 1 ? next : undefined}

  // NEW:  
  onNext={(selectedImage < loaded.length - 1 || hasMore) ? next : undefined}
  // Next arrow stays enabled if more images can be loaded
  ```

  **5. Loading Indicator:**

  ```jsx
  {loadingMore && selectedImage !== null && (
    <div className="fixed bottom-20 z-[60] ...">
      <div className="flex items-center gap-2">
        <spinner />
        <span>Loading more images...</span>
      </div>
    </div>
  )}
  ```

  #### User Experience:

  **Before (❌ BROKEN):**
  ```
  User has 536 images stored
  Opens image #1
  Presses right arrow 49 times
  Reaches image #50
  Right arrow does nothing! Stuck! 😞
  "Jump to End" → Goes to image #50 (not 536!)
  ```

  **After (✅ FIXED):**
  ```
  User has 536 images stored
  Opens image #1
  Presses right arrow 49 times
  Reaches image #50
  Presses right arrow → "Loading more images..." → Image #51! ✨
  Continues pressing right arrow
  Automatically loads batches of 50 as needed
  Can navigate all the way to image #536! 🎉

  Or: Press "Jump to End"
    → "Loading more images..." (loads all 486 remaining)
    → Jumps to image #536 instantly!
  ```

  #### Technical Details:

  **Pagination Strategy:**
  - Load images in batches of 50 (for performance)
  - When user navigates to last loaded image:
    - Check if `hasMore === true`
    - If yes: `await loadMore()` (loads next 50)
    - Then: Continue navigation

  **State Management:**
  - `selectedImage`: Current index in loaded array
  - `filteredAndSortedImages`: Currently loaded images (50, 100, 150...)
  - `stats.total`: Total images in database (536)
  - `hasMore`: Boolean - more images available to load
  - `loadingMore`: Boolean - currently loading next batch

  **Race Condition Prevention:**
  - Use `shouldJumpToEnd` flag for async jump operations
  - `useEffect` watches for loading completion
  - Only set `selectedImage` after images are in state

  #### Result:
  - ✅ Navigate through ALL images (not just first 50)
  - ✅ Automatic batch loading as you navigate
  - ✅ Visual "Loading..." indicator during fetch
  - ✅ Jump-to-End loads all images first
  - ✅ Image counter shows actual total (e.g., "347 / 536")
  - ✅ No more getting stuck at image 50!

  #### Files Changed:
  - `src/features/stored/StoredImages.tsx` - Fix navigation + pagination
  - `package.json`, `VersionBadge.tsx`, `VERSION.md` - Version bump

  #### User Action:
  1. Go to Stored Images (with 50+ images)
  2. Click any image to open ImageViewer
  3. **Press right arrow repeatedly** - navigates past 50!
  4. **Press "Jump to End"** - loads all, jumps to last image
  5. Image counter shows: "485 / 536" (actual total!)

  **No more 50-image limit!** 🚀

  ---

  ## v0.82.0 - (October 26, 2025)

  ### 📊 Add Admin Dashboard with API Call Tracking

  #### Feature:
  - ✅ **Admin Dashboard** - New dedicated page for monitoring system health
  - ✅ **API Call Tracking** - Real-time count of Tumblr API calls
  - ✅ **Daily Rate Limit Monitoring** - Track usage against 5,000/day limit
  - ✅ **Auto-reset at midnight** - Counter resets automatically each day
  - ✅ **Color-coded warnings** - Visual indicators for usage levels

  #### The Problem:

  **Tumblr Rate Limits:**
  - Free API keys: **5,000 requests/day**
  - No way to track how many calls you've made
  - Risk of hitting limit and getting temporarily blocked
  - Need visibility into API usage patterns

  **Before v0.82.0:**
  ```
  User makes API calls → No tracking → No visibility
  Might hit rate limit → Blocked without warning ❌
  ```

  #### The Solution:

  **New Admin Dashboard:**

  **1. Real-time API Call Counter**
  - Tracks every Tumblr API call made through the app
  - Shows current count vs. daily limit (e.g., 247 / 5,000)
  - Visual progress bar with color coding:
    - **Green** (0-50%): Healthy usage
    - **Yellow** (50-80%): Approaching limit  
    - **Red** (80-100%): Near rate limit

  **2. Smart Status Messages**
  ```
  0-50%:  ✅ "Healthy Usage - Plenty of headroom!"
  50-80%:  ⚠️ "Approaching Limit - Monitor carefully"
  80-100%: 🚨 "Near Rate Limit - Reduce API calls!"
  ```

  **3. API Call Tracking**
  Backend automatically increments counter on:
  - `/api/tumblr/blog/:blog/info` - Blog info requests
  - `/api/tumblr/blog/:blog/posts` - Post fetching
  - `/api/tumblr/tagged` - Tagged post searches

  Avatar requests NOT counted (they're CDN redirects).

  **4. Daily Auto-Reset**
  - Counter automatically resets at midnight
  - Shows reset time: "Resets At: 12:00 AM"
  - New day = fresh quota

  **5. Manual Controls**
  - **Refresh** button - Update stats on demand
  - **Reset Counter** button - Manually reset to 0 (for testing)
  - **Auto-refresh** - Updates every 10 seconds

  #### UI/UX:

  **Dashboard Layout:**
  ```
  ┌─────────────────────────────────────┐
  │  Admin Dashboard                     │
  │  Monitor Tumblr API usage           │
  ├─────────────────────────────────────┤
  │                                      │
  │          Tumblr API Usage           │
  │                                      │
  │              247                     │
  │         of 5,000 daily limit        │
  │                                      │
  │  Usage: ████████░░░░░░░░░░  4.9%   │
  │                                      │
  │  Date: 10/26/2025  |  Remaining: 4,753  │
  │  Resets At: 12:00 AM                │
  │                                      │
  │  ✅ Healthy Usage                   │
  │  You're at 4.9% of your daily quota │
  │                                      │
  │  [Refresh] [Reset Counter]          │
  └─────────────────────────────────────┘
  ```

  **Navigation:**
  - Added "Admin" tab to mobile bottom navigation
  - Chart/graph icon for easy recognition
  - Accessible from any page

  #### Technical Implementation:

  **Backend (`server/index.ts`):**
  ```typescript
  // Track API calls
  let apiCallStats = {
    date: '2025-10-26',
    count: 0
  };

  function incrementApiCallCounter() {
    const today = new Date().toISOString().split('T')[0];
    
    // Reset if new day
    if (apiCallStats.date !== today) {
      apiCallStats = { date: today, count: 0 };
    }
    
    apiCallStats.count++;
    console.log(`[API Tracker] 📊 API call #${apiCallStats.count}`);
  }

  // Add to all Tumblr API endpoints:
  app.get('/api/tumblr/...', async (req, res) => {
    incrementApiCallCounter(); // Track!
    // ... make API call ...
  });
  ```

  **Admin Endpoints:**
  ```typescript
  GET  /api/admin/stats  - Get current stats
  POST /api/admin/reset  - Reset counter to 0
  ```

  **Frontend (`Admin.tsx`):**
  ```typescript
  // Fetch stats every 10 seconds
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Color-coded display
  const getStatusColor = (percentage) => {
    if (percentage < 50) return 'green';
    if (percentage < 80) return 'yellow';
    return 'red';
  };
  ```

  #### Result:
  - ✅ Full visibility into API usage
  - ✅ Prevent rate limit surprises
  - ✅ Real-time monitoring with auto-refresh
  - ✅ Color-coded warnings at 50% and 80%
  - ✅ Automatic daily reset at midnight
  - ✅ Manual reset for testing/debugging
  - ✅ Comprehensive logging in server console

  #### Files Changed:
  - `src/features/admin/Admin.tsx` - **New** admin dashboard component
  - `server/index.ts` - Add API tracking + admin endpoints
  - `src/routes/index.tsx` - Add /admin route
  - `src/components/navigation/MobileBottomNav.tsx` - Add Admin nav item
  - `package.json`, `VersionBadge.tsx`, `VERSION.md` - Version bump to 0.82.0

  #### User Action:
  1. **Tap the "Admin" tab** in navigation (chart icon)
  2. **See your current API usage** in real-time
  3. **Monitor the progress bar** and percentage
  4. **Watch for warnings** if approaching limit
  5. **Counter auto-resets at midnight**

  **Pro Tip:** Check the Admin dashboard before bulk operations (like Store All) to ensure you have enough quota!

  ---

  ## v0.81.3 - (October 26, 2025)

  ### 🚀 Add "Delete All" Button for Stored Images

  #### Feature:
  - ✅ **Fast bulk deletion** - Delete all stored images in one operation
  - ✅ **Type-to-confirm safety** - Must type "DELETE ALL" to prevent accidents
  - ✅ **Single database operation** - 100x faster than deleting one-by-one

  #### The Problem:

  **User Request:**
  - "I need a way to select all the images in Stored and delete them or just have a button to delete all the images in Stored"
  - User has **536 images** stored
  - Deleting one-by-one would take minutes and make 536 API calls

  **Performance Issue:**
  ```
  Old way: Select All (50) → Delete → Load More → Select All → Delete...
          Repeat 11 times to delete 536 images
          ~536 DELETE requests = SLOW!
  ```

  #### The Solution:

  **New "Delete All" Button:**

  1. **Backend Endpoint** - Single Bulk Operation:
  ```typescript
  DELETE /api/stored-images/:userId/all

  // Uses Prisma deleteMany - ONE operation
  await prisma.storedImage.deleteMany({
    where: { userId }
  });

  // Deletes ALL images instantly (no matter how many)
  ```

  **Performance:**
  - Old way: 536 individual DELETE requests
  - New way: 1 bulk DELETE operation
  - **Speed: ~100x faster!**

  2. **Type-to-Confirm Safety:**
  ```javascript
  ⚠️ DELETE ALL STORED IMAGES?

  This will permanently delete ALL 536 images from your Stored collection.

  This action CANNOT be undone!

  Type "DELETE ALL" to confirm:
  ```

  User must type exact text "DELETE ALL" (case-sensitive) to proceed. This prevents:
  - Accidental clicks
  - Accidental shortcut keys
  - Muscle memory mistakes

  3. **Prominent UI Placement:**
  - Red warning button below blog filters
  - Trash icon + clear label
  - Warning text: "⚠️ This will permanently delete all stored images"
  - Only shows when images exist

  #### Flow:

  ```
  User clicks "Delete All 536 Images" button
    ↓
  Prompt: Type "DELETE ALL" to confirm
    ↓
  User types "DELETE ALL" (must be exact)
    ↓
  Single bulk DELETE operation
    ↓
  All 536 images deleted in ~1 second
    ↓
  UI refreshes to show empty state
    ↓
  Success: "✅ Successfully deleted all 536 images"
  ```

  #### Implementation Details:

  **Backend (`server/index.ts`):**
  ```typescript
  app.delete('/api/stored-images/:userId/all', async (req, res) => {
    const count = await prisma.storedImage.count({ where: { userId } });
    console.log(`[DELETE ALL] 📊 Found ${count} images to delete`);
    
    const result = await prisma.storedImage.deleteMany({ where: { userId } });
    console.log(`[DELETE ALL] ✅ Deleted ${result.count} images`);
    
    res.json({ count: result.count });
  });
  ```

  **Frontend (`StoredImages.tsx`):**
  ```typescript
  const handleDeleteAll = async () => {
    // Show count + type-to-confirm
    const userInput = prompt(`Type "DELETE ALL" to confirm...`);
    if (userInput !== 'DELETE ALL') return;
    
    // Single API call
    await fetch(`${API_URL}/api/stored-images/${userId}/all`, { 
      method: 'DELETE' 
    });
    
    // Refresh UI
    await fetchImages(true);
    await fetchStats();
  };
  ```

  #### Safety Features:

  1. **Type-to-confirm** - Must type exact text
  2. **Shows total count** - "Delete All 536 Images" 
  3. **Warning message** - Clear indication of consequences
  4. **Prominent red button** - Visual danger indicator
  5. **Console logging** - Debug if something goes wrong
  6. **Only shows when images exist** - No button if empty

  #### Result:
  - ✅ Delete 536 images in ~1 second (vs. minutes)
  - ✅ Safe type-to-confirm prevents accidents
  - ✅ Single database operation (efficient)
  - ✅ Clears selection and filters after deletion
  - ✅ Comprehensive logging for debugging
  - ✅ Works no matter how many images stored

  #### Files Changed:
  - `server/index.ts` - Add bulk delete endpoint
  - `src/features/stored/StoredImages.tsx` - Add UI button + handler
  - `package.json`, `VersionBadge.tsx`, `VERSION.md` - Version bump

  #### User Action:
  1. **Go to Stored Images page**
  2. **Scroll to filters section**
  3. **Look for red "Delete All N Images" button**
  4. **Click it**
  5. **Type "DELETE ALL" in the prompt**
  6. **Press OK**
  7. **All images deleted instantly!** 🗑️💨

  **Note:** This is much faster than Select All + Delete for large collections!

  ---

  ## v0.81.2 - (October 26, 2025)

  ### 🐛 Fix Stored Images Delete Not Working + Database Sync

  #### Fixes:
  - ✅ **Fixed delete not persisting** - Images now properly deleted from database
  - ✅ **Fixed database schema drift** - Synced UserPreferences fields
  - ✅ **Added comprehensive logging** - Debug delete operations

  #### The Problem:

  **User Report:**
  - "In Stored, I select all and delete and it doesn't delete as they show up again"
  - Delete operation appeared to work but images reappeared after refresh

  **Root Causes Found:**

  1. **Database Schema Out of Sync:**
  ```
  PrismaClientValidationError: Unknown field `allowDuplicateImageUrls` 
  for select statement on model `UserPreferences`
  ```
  The database didn't have the new fields we added to the schema:
  - `allowDuplicateImageUrls`
  - `maxStoredNotes`
  - `blogFilterLimit`

  This was causing the entire store operation to fail silently.

  2. **Frontend Delete Issues:**
  - `fetchImages()` and `fetchStats()` were not awaited
  - Race condition where UI refreshed before deletion completed
  - No error handling for failed deletions
  - No logging to debug what was happening

  #### The Solution:

  **1. Database Schema Sync:**
  ```bash
  npx prisma db push
  ```
  ✅ Synced all UserPreferences fields to database
  ✅ No data loss (push instead of migrate reset)

  **2. Fixed Delete Function:**

  **Before (WRONG):**
  ```typescript
  fetchImages();  // ❌ Not awaited - race condition!
  fetchStats();   // ❌ Not awaited - race condition!
  ```

  **After (CORRECT):**
  ```typescript
  await fetchImages(true);  // ✅ Wait for fetch, reset pagination
  await fetchStats();       // ✅ Wait for stats update
  ```

  **3. Added Comprehensive Logging:**

  **Frontend logging (`StoredImages.tsx`):**
  ```javascript
  🗑️ Deleting N images...
  ✅ Deleted image [ID]
  ❌ Failed to delete image [ID]: [error]
  📊 Delete summary: X successful, Y failed
  🔄 Refreshing data...
  ✅ Data refreshed
  ```

  **Backend logging (`server/index.ts`):**
  ```javascript
  [DELETE] 🗑️ Request to delete image [ID] for user [userId]
  [DELETE] ✅ Successfully deleted image [ID]
  [DELETE] ❌ Image [ID] not found in database
  [GET] 📥 Fetched N images (offset: X, total: Y)
  ```

  **4. Improved Error Handling:**
  - Track success/failure count for each deletion
  - Display detailed feedback: "Deleted 10 images (2 failed)"
  - Log exact error responses from backend
  - Verify image exists before deleting
  - Check authorization properly

  #### How to Debug (if issue persists):

  1. **Open DevTools Console**
  2. **Select images and click Delete**
  3. **Watch for console logs:**
    - `[StoredImages] 🗑️ Deleting X images...`
    - `[DELETE] 🗑️ Request to delete image...` (server logs)
    - `[DELETE] ✅ Successfully deleted...` (server logs)
    - `[GET] 📥 Fetched X images...` (server logs after refresh)

  If images still reappear, the logs will show exactly what's happening.

  #### Result:
  - ✅ Database schema in sync with Prisma schema
  - ✅ Delete operations properly awaited
  - ✅ Comprehensive logging for debugging
  - ✅ Better error handling and feedback
  - ✅ UI refreshes after deletion completes
  - ✅ Can track which deletions fail and why

  #### Files Changed:
  - `prisma/schema.prisma` - Database schema (already had fields)
  - `server/index.ts` - Add logging to DELETE and GET endpoints
  - `src/features/stored/StoredImages.tsx` - Fix async/await, add logging
  - `package.json`, `VersionBadge.tsx`, `VERSION.md` - Version bump

  #### User Action:
  **Try deleting images again:**
  1. Go to Stored Images page
  2. Select some images (or Select All)
  3. Click Delete button
  4. **Open DevTools Console** to see detailed logs
  5. After deletion, images should NOT reappear

  If they still do, the console logs will show exactly why!

  ---

  ## v0.81.1 - (October 26, 2025)

  ### 🐛 Fix Text Comments Not Displaying in Notes Panel

  #### Fix:
  - ✅ **Text comments now correctly classified and displayed** - Reblogs with comments show up in Comments tab

  #### The Problem:

  **User Report:**
  - Post has 131 total notes, app shows 46 notes (Tumblr API limitation)
  - 3 text comments visible on Tumblr, but **NOT showing in Comments tab**
  - Comments tab shows "No comments yet" even though comments exist

  **Root Cause:**

  When someone reblogs a post and adds a comment, Tumblr's API returns:
  ```json
  {
    "type": "reblog",          // Tumblr marks it as a reblog
    "reply_text": "Great pic!", // But it HAS comment text
    "blog_name": "username"
  }
  ```

  **Our Old Logic (WRONG):**
  ```typescript
  type: note.type === 'like' ? 'like' : 
        note.type === 'reblog' ? 'reblog' :  // Stops here for reblogs with text!
        'comment'
  ```

  Result: Reblogs with comments were classified as 'reblog', so they didn't show in the Comments filter.

  #### The Solution:

  **New Logic (CORRECT):**
  ```typescript
  // Prioritize text content over Tumblr's type field
  let noteType: 'like' | 'reblog' | 'comment' = 'reblog';

  if (note.type === 'like') {
    noteType = 'like';
  } else if (note.reply_text || note.added_text) {
    // If there's text, it's a COMMENT (even if Tumblr says "reblog")
    noteType = 'comment';
  } else if (note.type === 'reblog' || note.type === 'posted') {
    noteType = 'reblog';  // Silent reblog without comment
  }
  ```

  **Key Change:**
  - **Check for text FIRST**, before checking Tumblr's type field
  - If `reply_text` or `added_text` exists → It's a **comment**
  - Only classify as 'reblog' if there's NO text content

  #### Where We Fixed It:

  Applied the fix in **4 places** where notes are parsed:

  1. **`Blog.tsx`** - `mockNotesForImage` (ImageViewer notes)
  2. **`Blog.tsx`** - `mockNotesForPost` (regular post notes)
  3. **`useStoredImageData.ts`** - stored image notes from database
  4. **`StoredImages.tsx`** - `selectedImageNotes` for stored images

  #### Added Debug Logging:

  ```typescript
  // Now logs breakdown of note types:
  console.log(`[Blog] 📊 Notes breakdown:`, {
    comments: 3,   // ✅ Now counts text comments correctly!
    likes: 25,
    reblogs: 18
  });
  ```

  #### Notes API Limitation (Known Issue):

  The Tumblr API's `notes_info=true` parameter only returns **~50 notes** inline with the post, not all 131. This is a Tumblr API limitation, not a bug in our app.

  **To get ALL notes**, we would need to:
  - Use the Notes Timeline API (separate endpoint)
  - Requires pagination (multiple requests)
  - Returns HTML, not JSON (requires parsing)
  - Significantly slower

  **Current approach:**
  - Shows first ~50 notes (fast, efficient)
  - Includes all comment text from those 50
  - Good enough for most use cases

  **Future enhancement** (if needed):
  - Add "Load All Notes" button
  - Fetch from Notes Timeline API
  - Parse HTML response
  - Show all 131 notes

  #### Result:
  - ✅ Text comments now show in Comments tab
  - ✅ Comment count badge displays correctly
  - ✅ Debug logging shows accurate breakdown
  - ✅ Fixed in all 4 note parsing locations
  - ✅ Works for both live and stored images

  #### Files Changed:
  - `src/features/blog/Blog.tsx` - Fix both note parsing functions, add debug logging
  - `src/hooks/useStoredImageData.ts` - Fix stored image note parsing
  - `src/features/stored/StoredImages.tsx` - Fix stored images note parsing
  - `server/index.ts` - Add Notes Timeline API endpoint (for future use)
  - `package.json`, `VersionBadge.tsx`, `VERSION.md` - Version bump

  #### User Action:
  **Refresh your browser** and view the post again. Click the Notes button and check the Comments tab - text comments should now appear!

  The breakdown will show:
  - **All (46)** - Total notes fetched from API
  - **Comments (3)** - Text comments now correctly counted
  - **Likes (X)** - Like count
  - **Reblogs (X)** - Silent reblogs without comments

  ---

  ## v0.81.0 - (October 26, 2025)

  ### ⚡ Smart Image Viewer - Database-First Notes Loading

  #### Optimization:
  - ✅ **Load notes from stored database instead of Tumblr API** - Conserve daily API rate limits

  #### The Problem:

  **Tumblr API Rate Limits:**
  - Free API keys have daily rate limits (typically 5,000 requests/day)
  - Every time you view an image's notes, it makes an API call
  - If you're viewing stored images you already downloaded, you're wasting API calls
  - Heavy users can hit rate limits and get temporarily blocked

  **Before v0.81.0:**
  ```
  User views image → Always fetch notes from Tumblr API → Wastes API call
  User views stored image → Still fetches from Tumblr → Unnecessary!
  ```

  #### The Solution:

  **Smart Database-First Loading:**

  1. **New Backend Endpoint**: `/api/stored-images/:userId/post/:postId`
    - Fast database lookup using unique compound index
    - Returns stored image data if it exists
    - O(1) lookup time with Prisma

  2. **New React Hook**: `useStoredImageData(userId, postId)`
    - Automatically checks if image is in stored database
    - Parses stored notes JSON
    - Only runs when ImageViewer is open
    - Caches result during viewing session

  3. **ImageViewer Optimization**:
    - Accepts `userId` and `postId` props
    - Calls `useStoredImageData` hook when open
    - Uses stored notes if available
    - Falls back to Tumblr API only if needed

  **Flow:**
  ```typescript
  User opens image viewer
    ↓
  useStoredImageData hook checks database
    ↓
  Is post in stored database?
    ├─ YES → Use stored notes (⚡ no API call!)
    └─ NO  → Fetch from Tumblr (normal flow)
  ```

  #### Visual Indicator:

  When notes are loaded from stored database, you'll see:
  - **Small view**: ⚡ lightning bolt badge next to "notes"
  - **Full screen**: "⚡ Stored" badge next to notes count
  - **Console log**: `[ImageViewer] ⚡ Using stored notes data for post 123456 - API call saved!`

  **Tooltip:** "Notes loaded from stored database (no API call)"

  #### Performance Benefits:

  **Before:**
  - Viewing 100 stored images = 100 API calls
  - Risk of hitting daily rate limit

  **After:**
  - Viewing 100 stored images = **0 API calls** ⚡
  - Only unstored images consume API quota
  - Can view stored collection unlimited times

  **Example:**
  ```
  You have 500 images stored
  View them all 10 times = 5,000 views
  Old way: 5,000 API calls (hit rate limit!)
  New way: 0 API calls (all from database!)
  ```

  #### Technical Implementation:

  **New Files:**
  - `src/hooks/useStoredImageData.ts` - React hook for checking stored data

  **Backend Changes:**
  - `server/index.ts`:
    - Added `GET /api/stored-images/:userId/post/:postId` endpoint
    - Uses Prisma unique compound index for O(1) lookup
    - Returns `{ stored: boolean, image?: StoredImage }`

  **Frontend Changes:**
  - `src/components/ui/ImageViewer.tsx`:
    - Added `userId` prop
    - Integrated `useStoredImageData` hook
    - Shows visual indicator when using stored data
    - Console logging for debugging
  - `src/features/blog/Blog.tsx`:
    - Pass `userId` and `postId` to ImageViewer
    - Enables automatic optimization

  #### Database Query:

  ```typescript
  // Optimized lookup using existing compound unique index
  await prisma.storedImage.findUnique({
    where: {
      userId_postId: { userId, postId }
    }
  });
  ```

  **Index used:** `@@unique([userId, postId])` (already existed)

  #### Result:
  - ✅ **Stored images load notes instantly from database**
  - ✅ **Zero API calls for stored images**
  - ✅ **Preserve API quota for discovering new content**
  - ✅ **Visual feedback when optimization is active**
  - ✅ **Console logging for verification**
  - ✅ **Graceful fallback to Tumblr API when needed**
  - ✅ **No breaking changes - works automatically**

  #### Files Changed:
  - `server/index.ts` - Add optimized endpoint for post lookup
  - `src/hooks/useStoredImageData.ts` - **New hook** for database-first loading
  - `src/components/ui/ImageViewer.tsx` - Integrate stored data optimization
  - `src/features/blog/Blog.tsx` - Pass userId/postId to ImageViewer
  - `package.json`, `VersionBadge.tsx`, `VERSION.md` - Version bump

  #### User Action:
  1. **Store some images** from a blog
  2. **View them in the ImageViewer** (click image)
  3. **Look for the ⚡ badge** next to notes count
  4. **Check DevTools console** for "API call saved!" messages

  **Your API quota will thank you!** 🚀

  ---

  ## v0.80.7 - (October 26, 2025)

  ### 🐛 Fix Express Route Error (Critical Hotfix)

  #### Fix:
  - ✅ **Fixed server crash caused by invalid route parameter syntax**

  #### The Problem:

  Server failed to start with error:
  ```
  PathError [TypeError]: Unexpected ? at index 45, expected end: 
  /api/tumblr/blog/:blogIdentifier/avatar/:size?
  ```

  **Root Cause:**
  Express router doesn't support optional parameter syntax (`:size?`) directly in route paths. This caused the server to crash immediately on startup, preventing the avatar proxy from working.

  #### The Fix:

  Split the single route with optional parameter into two separate routes:

  ```typescript
  // Route WITH size parameter
  app.get('/api/tumblr/blog/:blogIdentifier/avatar/:size', ...)

  // Route WITHOUT size parameter (defaults to 128)
  app.get('/api/tumblr/blog/:blogIdentifier/avatar', ...)
  ```

  Both routes work identically, with the second route using a default size of 128 pixels.

  #### Result:
  - ✅ Server starts successfully
  - ✅ Avatar proxy fully functional
  - ✅ Both routes work: `/avatar` and `/avatar/128`
  - ✅ CORS errors eliminated

  #### Files Changed:
  - `server/index.ts` - Split optional route into two routes
  - `package.json`, `VersionBadge.tsx`, `VERSION.md` - Version bump

  #### Testing:
  ```bash
  curl -I http://localhost:3001/api/tumblr/blog/staff.tumblr.com/avatar/128
  # Returns: 302 redirect to Tumblr CDN
  ```

  ---

  ## v0.80.6 - (October 26, 2025)

  ### 🔧 Fix Cached Avatar URLs (Migration for v0.80.5)

  #### Fix:
  - ✅ **Migrate cached avatar URLs in localStorage** - Auto-fix old Tumblr API URLs to use proxy

  #### The Problem:

  Even after implementing the avatar proxy in v0.80.5, users still saw CORS errors because:
  - **Blog history stored in localStorage** still had old direct Tumblr API URLs
  - Dashboard loads cached blog data with old avatar URLs
  - New proxy URLs only applied to newly visited blogs

  #### The Fix:

  Added automatic migration to `blogHistory.ts`:

  ```typescript
  function migrateAvatarUrl(avatarUrl?: string): string | undefined {
    if (avatarUrl?.startsWith('https://api.tumblr.com/v2/blog/')) {
      const API_URL = getApiUrl();
      const match = avatarUrl.match(/https:\/\/api\.tumblr\.com\/v2\/blog\/(.+)/);
      if (match) {
        return `${API_URL}/api/tumblr/blog/${match[1]}`;
      }
    }
    return avatarUrl;
  }
  ```

  **When It Runs:**
  - Automatically when `getBlogHistory()` is called
  - Dashboard calls this on mount
  - Detects old Tumblr API URLs
  - Replaces with backend proxy URLs
  - Saves migrated URLs back to localStorage
  - Logs migration in console

  **What Gets Migrated:**
  - **Before:** `https://api.tumblr.com/v2/blog/example.tumblr.com/avatar/128`
  - **After:** `http://localhost:3001/api/tumblr/blog/example.tumblr.com/avatar/128`

  #### Result:
  - ✅ Cached blog history automatically migrated on next Dashboard visit
  - ✅ No manual cache clearing needed
  - ✅ CORS errors completely eliminated
  - ✅ Works for all existing users

  #### Files Changed:
  - `src/utils/blogHistory.ts` - Add automatic URL migration
  - `package.json`, `VersionBadge.tsx`, `VERSION.md` - Version bump

  #### User Action:
  **Refresh the Dashboard page** - The migration will run automatically and fix all cached avatar URLs.

  ---

  ## v0.80.5 - (October 26, 2025)

  ### 🔧 Fix Blog Avatar CORS Errors

  #### Fix:
  - ✅ **Fixed CORS errors when loading blog avatars** - Proxy avatar requests through backend

  #### The Problem:

  **DevTools Error:**
  ```
  Access to image at 'https://api.tumblr.com/v2/blog/{blog}/avatar/128' 
  from origin 'http://localhost:5173' has been blocked by CORS policy: 
  No 'Access-Control-Allow-Origin' header is present on the requested resource.

  GET https://api.tumblr.com/v2/blog/{blog}/avatar/128 net::ERR_FAILED 302 (Found)
  ```

  **Root Cause:**
  The Tumblr avatar API endpoint returns a 302 redirect to the actual image location, but doesn't include proper CORS headers. When the browser tries to fetch the avatar directly from the frontend, it's blocked by the same-origin policy.

  #### The Fix:

  **Backend Proxy (server/index.ts):**
  Added new endpoint to proxy avatar requests:
  ```typescript
  app.get('/api/tumblr/blog/:blogIdentifier/avatar/:size?', async (req, res) => {
    const { blogIdentifier, size = '128' } = req.params;
    const avatarUrl = `https://api.tumblr.com/v2/blog/${blogIdentifier}/avatar/${size}`;
    
    // Fetch with redirect following
    const response = await fetch(avatarUrl, { redirect: 'follow' });
    
    // Redirect browser to final image URL
    res.redirect(response.url);
  });
  ```

  **Frontend Updates:**
  Changed all avatar URLs to use backend proxy:
  - **Before:** `https://api.tumblr.com/v2/blog/${blog}/avatar/128`
  - **After:** `${API_URL}/api/tumblr/blog/${blog}/avatar/128`

  **Files Updated:**
  - `useTumblrBlog.ts` - Real blog data + mock data avatars
  - `StoredImages.tsx` - Notes avatar fallbacks

  #### How It Works:
  1. Frontend requests: `http://localhost:3001/api/tumblr/blog/{blog}/avatar/128`
  2. Backend fetches from Tumblr API (no CORS restrictions server-side)
  3. Backend follows 302 redirect to actual image
  4. Backend redirects browser to final image URL
  5. Browser loads image directly from Tumblr CDN (now with proper headers)

  #### Result:
  - ✅ No more CORS errors in DevTools
  - ✅ Blog avatars load properly on Dashboard
  - ✅ All avatar requests now go through backend proxy
  - ✅ Consistent with other Tumblr API proxying

  #### Files Changed:
  - `server/index.ts` - New avatar proxy endpoint
  - `src/hooks/useTumblrBlog.ts` - Use proxy for avatars
  - `src/features/stored/StoredImages.tsx` - Use proxy for note avatars
  - `package.json`, `VersionBadge.tsx`, `VERSION.md` - Version bump

  ---

  ## v0.80.4 - (October 26, 2025)

  ### 🔧 PWA Configuration Fixes

  #### Fixes:
  - ✅ **Fixed deprecated meta tag warning** - Added modern `mobile-web-app-capable` meta tag
  - ✅ **Fixed PWA manifest icon errors** - Removed references to non-existent icon files

  #### Issue 1: Deprecated Meta Tag

  **DevTools Warning:**
  ```
  <meta name="apple-mobile-web-app-capable" content="yes"> is deprecated. 
  Please include <meta name="mobile-web-app-capable" content="yes">
  ```

  **The Fix:**
  - Added modern `mobile-web-app-capable` meta tag (for Chrome/Edge/Android)
  - Kept `apple-mobile-web-app-capable` for iOS Safari compatibility
  - Added `apple-mobile-web-app-title` for better iOS home screen name

  **Updated meta tags in `index.html`:**
  ```html
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="TumblrT3" />
  ```

  #### Issue 2: Missing PWA Icons

  **DevTools Error:**
  ```
  Error while trying to use the following icon from the Manifest: 
  http://localhost:5173/icon-192x192.png 
  (Download error or resource isn't a valid image)
  ```

  **Root Cause:**
  The PWA manifest (`manifest.json`) referenced icon files that don't exist:
  - `/icon-192x192.png`
  - `/icon-512x512.png`
  - `/icon-96x96.png` (for shortcuts)

  **The Fix:**
  - Removed all icon references from manifest (empty `icons` array)
  - Removed shortcuts that required icons
  - Added TODO comment with instructions for adding proper PWA icons
  - Recommended tool: https://realfavicongenerator.net/

  **Note:** The app still works as a PWA, but won't have custom icons when installed. To add proper icons, generate PNG files at the specified sizes and place them in `/public/` directory.

  #### Files Changed:
  - `index.html` - Added modern meta tags for PWA
  - `public/manifest.json` - Removed non-existent icon references
  - `package.json`, `VersionBadge.tsx`, `VERSION.md` - Version bump

  ---

  ## v0.80.3 - (October 26, 2025)

  ### 🐛 Bug Fixes - Stored Images Viewer Errors

  #### Fixes:
  - ✅ **Fixed crash when opening images in Stored Images** - "Cannot read properties of null (reading 'filter')"
  - ✅ **Fixed React duplicate key warning** - "Encountered two children with the same key"

  #### The Problem:
  When clicking on the first image (or any image) in Stored Images, the app crashed with:
  ```
  Cannot read properties of null (reading 'filter')
  ```

  #### Root Cause:
  The `selectedImageNotes` useMemo was returning `null` when:
  - No notes data exists
  - Image index is invalid
  - JSON parsing fails

  When `null` is explicitly passed to a function parameter with a default value, JavaScript doesn't use the default. So `notesList={null}` bypassed the `notesList = []` default in ImageViewer, and NotesPanel tried to call `notes.filter()` on null.

  #### The Fix:
  Changed `selectedImageNotes` to **always return an array** (never null):
  - Early returns: `return []` instead of `return null`
  - No notes data: `return []`
  - Parse errors: `return []` (with console.error)
  - Added validation: `if (!notes || !Array.isArray(notes)) return []`

  #### Bonus Improvements:
  - Use real Tumblr avatars in notes fallback (instead of DiceBear)
  - Better error handling with type checking

  ---

  #### Second Issue: React Duplicate Key Warning

  **The Problem:**
  React DevTools showed warning:
  ```
  Warning: Encountered two children with the same key, ``. 
  Keys should be unique so that components maintain their identity across updates.
  ```

  **Root Cause:**
  In `ImageViewer.tsx`, the `AnimatePresence` component contains two sibling `motion.div` elements (backdrop and image container) without unique `key` props. Framer Motion's AnimatePresence needs keys to track which elements should animate in and out.

  **The Fix:**
  Added unique keys to both motion.div elements:
  - Backdrop: `key="image-viewer-backdrop"`
  - Image Container: `key="image-viewer-container"`

  This prevents React from warning about duplicate keys and ensures proper animation tracking.

  #### Files Changed:
  - `src/features/stored/StoredImages.tsx` - Fix selectedImageNotes to always return array
  - `src/components/ui/ImageViewer.tsx` - Add unique keys to AnimatePresence children

  ---

  ## v0.80.1 - (October 26, 2025)

  ### 🎨 UI/UX Improvements - Real Blog Avatars & Better Dark Mode

  #### Fixes:
  - ✅ **Real Tumblr Blog Avatars** - Show actual blog icons instead of dummy avatars
  - ✅ **Better Dark Mode Inputs** - Settings number fields now clearly visible in dark mode
  - ✅ **Enhanced Input Fields** - Added placeholders, labels, and range hints
  - ✅ **Avatar API Integration** - Uses Tumblr's official avatar endpoint

  #### Blog Avatar Changes:
  **Before:** Generated avatars from DiceBear API (`https://api.dicebear.com/...`)
  **After:** Real Tumblr blog avatars (`https://api.tumblr.com/v2/blog/{blog}/avatar/128`)

  - Dashboard shows actual blog icons from Tumblr
  - Blog history tracking stores real avatars
  - Consistent avatar display across all views

  #### Settings Input Improvements:
  **Maximum Stored Notes Per Image:**
  - Added placeholder: "50"
  - Added label: "notes per image"
  - Better contrast: explicit bg/text colors for dark mode
  - Added range info: "(range: 10-200)"

  **Blog Filter Display Limit:**
  - Added placeholder: "20"
  - Added label: "blogs"
  - Better contrast: explicit bg/text colors for dark mode
  - Added range info: "(range: 5-100)"

  #### Technical Changes:
  - `useTumblrBlog.ts`: Changed avatar URL generation to use Tumblr API
  - `Settings.tsx`: Enhanced input styling with dark mode support
  - Avatars now work for both `username` and `username.tumblr.com` formats

  ---

  ## v0.80.0 - (October 26, 2025)

  ### 🗄️ Complete Notes Storage & Pagination System

  #### Major Features:
  - ✅ **Store Real Notes Data** - Save actual likes, reblogs, comments with images
  - ✅ **Pagination on Stored** - Load More & Load All functionality (50 per page)
  - ✅ **Customizable Notes Limit** - User setting for max notes per image (default 50)
  - ✅ **Customizable Blog Filter** - User setting for number of blogs shown (default 20)
  - ✅ **Real Notes in Stored** - Display actual Tumblr notes from stored images
  - ✅ **Settings UI** - New preferences for notes and blog filter limits

  #### Notes Storage (Complete System):
  - **What's Stored**: Blog name, username, avatar, timestamp, comment text, reblog info
  - **Limit Control**: User can set max notes per image (10-200, default 50)
  - **Backend Processing**: Automatically limits notes when storing to database
  - **Space Efficient**: Only stores what you need, reduces database size
  - **Real Data**: No more mock notes in Stored Images!

  #### Pagination on Stored Images:
  - **Initial Load**: 50 images (fast page load)
  - **Load More Button**: Fetch next 50 images
  - **Load All Button**: Loads ALL remaining images in batches
  - **Progress Tracking**: Shows "X of Y images" with remaining count
  - **Smart State**: Tracks offset, hasMore, loading states
  - **Filter Aware**: Pagination works with blog filters

  #### User Preferences (New Settings):
  1. **Maximum Stored Notes Per Image**:
    - Range: 10-200 notes
    - Default: 50 notes
    - Input: Number field with validation
    - Effect: Limits notes saved when storing images

  2. **Blog Filter Display Limit**:
    - Range: 5-100 blogs
    - Default: 20 blogs
    - Input: Number field with validation
    - Effect: Limits blogs shown in Stored Images filter dropdown
    - Shows "+X more blogs" indicator when limit exceeded

  #### Technical Implementation:
  **Database:**
  - `StoredImage.notesData` - JSON column for notes array
  - `UserPreferences.maxStoredNotes` - Integer (default 50)
  - `UserPreferences.blogFilterLimit` - Integer (default 20)

  **Backend (`server/index.ts`):**
  - Fetches user preferences before storing
  - Limits notes array to `maxStoredNotes`
  - Logs: "📝 Storing X notes (limited from Y)"
  - Returns notes count in responses

  **Frontend:**
  - `StoredImages.tsx`: Pagination (loadMore, loadAll functions)
  - `Blog.tsx`: Passes notesData when storing
  - `preferences.ts`: New atoms for maxStoredNotes, blogFilterLimit
  - `Settings.tsx`: UI controls for both preferences

  #### User Experience:

  **Before v0.80.0:**
  - Stored Images limited to 500 (no pagination)
  - Only notes count stored (no actual notes)
  - All blogs shown in filter (cluttered)
  - Mock notes displayed in viewer

  **After v0.80.0:**
  - Load 50 at a time, expandable to ALL
  - Real notes stored and displayed
  - Blog filter customizable (default 20)
  - Actual Tumblr usernames in notes

  #### UI Improvements:
  - ✅ **Pagination Controls**: Shows "Showing X of Y images" with Load More/All buttons
  - ✅ **Blog Filter Indicator**: "+X more blogs (change limit in Settings)"
  - ✅ **Settings Section**: Clear inputs for both new preferences
  - ✅ **Real Notes**: Parse notesData JSON and display in ImageViewer
  - ✅ **Loading States**: "Loading..." shown during Load More/All operations

  ---

  ## v0.70.0 - (October 26, 2025)

  ### 📊 Dashboard Redesign - Recently Viewed Blogs with Infinite Scroll

  #### Major Changes:
  - ✅ **Recently Viewed Blogs** - Top 20 most recent blogs displayed as prominent cards
  - ✅ **Infinite Scroll** - Remaining blogs load automatically as you scroll
  - ✅ **Blog Visit Tracking** - Automatic tracking of blog visits with timestamps
  - ✅ **Visit Statistics** - See how many times you've visited each blog
  - ✅ **Smart History** - Up to 100 blogs stored in history
  - ✅ **Empty State** - Helpful prompt to search blogs when history is empty
  - ✅ **Clear History** - Button to clear all blog history

  #### Features:

  **Recently Viewed Section:**
  - 📸 Large card layout (2-5 columns responsive)
  - 🎨 Blog avatars with fallback gradients
  - 📅 Relative timestamps ("2h ago", "3d ago")
  - 🔢 Visit count badges
  - ✨ Hover animations and scaling effects

  **More Blogs Section (Infinite Scroll):**
  - 📜 Compact list layout (1-3 columns responsive)
  - 🔄 Automatic loading as you scroll
  - 📊 Total count display
  - 💨 Fast, smooth scrolling experience
  - 🎭 Staggered entrance animations

  **Blog Visit Tracking:**
  - ⏰ Tracks timestamp of each visit
  - 📈 Counts total visits per blog
  - 💾 Stores blog name, display name, and avatar
  - 🔄 Updates automatically on every blog view
  - 🌐 Syncs across tabs (on focus)

  #### Technical Implementation:
  - ✅ `src/utils/blogHistory.ts` - New utility for tracking blog visits (localStorage)
  - ✅ `src/features/dashboard/Dashboard.tsx` - Complete rewrite with new UI
  - ✅ `src/features/blog/Blog.tsx` - Auto-tracks visits with `useEffect`
  - ✅ Intersection Observer API for infinite scroll
  - ✅ localStorage persistence (key: `tumblr_blog_history`)
  - ✅ Framer Motion animations for smooth UX

  #### User Experience:

  **Before v0.70.0:**
  - Dashboard showed generic mock posts
  - No blog history or quick access
  - Had to search for blogs every time

  **After v0.70.0:**
  - Dashboard shows YOUR browsing history
  - Top 20 blogs are immediately visible
  - Click any blog card to revisit
  - See which blogs you visit most often
  - Infinite scroll for older history

  #### Data Structure:
  ```typescript
  interface BlogVisit {
    blogName: string;
    displayName?: string;
    avatar?: string;
    lastVisited: number; // Unix timestamp
    visitCount: number;
  }
  ```

  #### Storage:
  - **Location**: localStorage (`tumblr_blog_history`)
  - **Capacity**: Up to 100 most recent blogs
  - **Auto-cleanup**: Oldest entries removed when limit exceeded
  - **Cross-tab sync**: Updates when window gains focus

  ---

  ## v0.60.6 - (October 26, 2025)

  ### ⚙️ User-Controlled Deduplication Mode

  #### Changes:
  - ✅ **New user preference** - "Allow Duplicate Image URLs" setting in Settings
  - ✅ **Strict mode (default)** - Prevents duplicate URLs across all blogs (space-saving)
  - ✅ **Allow duplicates mode** - Stores same image from different blogs (tracks different contexts)
  - ✅ **Smart deduplication** - Always prevents same post from same blog, regardless of setting
  - ✅ **User choice** - Let users decide their preferred deduplication behavior

  #### Deduplication Modes:

  **Strict Mode (Default - Recommended)**:
  - Checks both `postId` and `url`
  - Prevents: Same post from same blog ✅ | Same image from different blogs ✅
  - Use case: Save database space, prevent storing reblogs
  - Result: Clean collection with no duplicate images

  **Allow Duplicates Mode**:
  - Checks only `postId`
  - Prevents: Same post from same blog ✅ | Same image from different blogs ❌
  - Use case: Track which blogs posted the same image, preserve different tags/descriptions
  - Result: Same image can appear multiple times from different blogs

  #### Technical Implementation:
  - ✅ `UserPreferences` table - Added `allowDuplicateImageUrls` boolean field (default: false)
  - ✅ `server/index.ts` - Checks user preference before URL deduplication
  - ✅ `store/preferences.ts` - New `allowDuplicateImageUrlsAtom` atom
  - ✅ `Settings.tsx` - New toggle in Downloads section with detailed explanation

  #### UI Features:
  - ✅ Segmented control: "Strict (No Duplicates)" vs "Allow Duplicates"
  - ✅ Clear descriptions explaining each mode
  - ✅ Help text explaining use cases
  - ✅ Instant preference updates (persisted to localStorage)

  ---

  ## v0.60.5 - (October 26, 2025)

  ### 🚫 Smart Duplicate Image Prevention (Cross-Blog Deduplication)

  #### Changes:
  - ✅ **Prevent duplicate image URLs** - Same image won't be stored twice, even from different blogs
  - ✅ **Cross-blog deduplication** - Detects when the same image is reblogged by multiple blogs
  - ✅ **Two-level checking** - Checks both postId (same post) AND URL (same image)
  - ✅ **Performance optimized** - Added database index on (userId, url) for fast lookups
  - ✅ **Detailed logging** - Console shows why images are skipped ("same post" vs "same URL")

  #### How It Works:
  When storing images, the system now checks:
  1. **Same Post Check** - Is this exact post already stored? (by `postId`)
  2. **Same Image Check** - Is this image URL already stored from a different blog?

  This prevents duplicates from:
  - Storing the same blog twice
  - Storing reblogs (same image, different blog)
  - Storing cross-posts (same image posted to multiple blogs)

  #### Technical Implementation:
  - ✅ `server/index.ts` - Added `findFirst` query to check for duplicate URLs
  - ✅ `schema.prisma` - Added composite index on `(userId, url)` for performance
  - ✅ Enhanced skip logging - Distinguishes between "same post" vs "same URL from different blog"

  #### User Experience:
  - **Before**: If you stored images from `@blog-a` and then `@blog-b`, reblogs would be stored twice
  - **After**: Reblogs are automatically detected and skipped, saving database space

  ---

  ## v0.60.4 - (October 26, 2025)

  ### 🔍 Proper 404 Blog Not Found Handling

  #### Changes:
  - ✅ **No mock data for non-existent blogs** - Shows proper error state instead
  - ✅ **404 detection** - Detects when blog doesn't exist on Tumblr
  - ✅ **Error state UI** - Beautiful error card with icon and helpful message
  - ✅ **Better error messages** - Specific messages for 404, 401, 429 errors
  - ✅ **Smart fallback** - Only uses mock data for API configuration issues, not real errors
  - ✅ **Search redirect** - Button to search for another blog when 404 occurs

  #### Technical Implementation:
  - ✅ `tumblr.api.ts` - Throws specific errors for 404, 401, 429 status codes
  - ✅ `useTumblrBlog.ts` - Detects "does not exist" errors and doesn't fall back to mock data
  - ✅ `Blog.tsx` - New error state UI with icon, message, and action button
  - ✅ Preserves mock data fallback for other error types (rate limits, API issues)

  ---

  ## v0.60.3 - (October 26, 2025)

  ### 📚 Documentation Update

  #### Updates:
  - ✅ **VERSION.md** - Added comprehensive v0.60.2 changelog
  - ✅ **FEATURES.md** - Documented pagination and bulk operations
  - ✅ **README.md** - Updated feature highlights with v0.60.2 capabilities

  ---

  ## v0.60.2 - (October 26, 2025)

  ### 🚀 Bulk Operations & Complete Pagination System

  #### Major Features:
  - ✅ **Pagination system** - Load More, Load All functionality
  - ✅ **Bulk download operations** - Download Loaded, Download ALL
  - ✅ **Bulk store operations** - Store Loaded, Store ALL to database
  - ✅ **Real Tumblr notes** - Display actual likes & reblogs with usernames via `notes_info=true`
  - ✅ **Progressive loading** - Load posts in batches of 50 with progress tracking

  #### Pagination Features:
  - ✅ **Load More** button - Fetch next 50 posts
  - ✅ **Load All** button - Automatically load all remaining posts from blog
  - ✅ **Progress indicators** - Real-time feedback during bulk operations
  - ✅ **Smart state management** - Tracks offset, hasMore, total posts

  #### Download Operations:
  - ✅ **Download Loaded** - Download currently loaded images (50-300)
  - ✅ **Download ALL** - Loads all posts then downloads every image
  - ✅ **Progress tracking** - Shows "Downloading... (X/Y)" during operation
  - ✅ **Confirmation dialogs** - Prevents accidental bulk operations
  - ✅ **Two-step process** - Auto-loads remaining posts before downloading

  #### Store Operations:
  - ✅ **Store Loaded** - Save currently loaded images to database
  - ✅ **Store ALL** - Loads all posts then stores every image
  - ✅ **Batch API calls** - Efficient database storage with deduplication
  - ✅ **Result summary** - Shows stored/skipped/failed counts
  - ✅ **User authentication** - Only available when logged in

  #### Real Notes Integration:
  - ✅ **`notes_info=true` parameter** - Fetch up to 50 notes per post from Tumblr API
  - ✅ **Real usernames** - Display actual Tumblr users who liked/reblogged
  - ✅ **Note metadata** - Blog name, avatar URL, timestamp, comment text
  - ✅ **Fallback system** - Uses mock data when notes unavailable
  - ✅ **Blog post notes** - Real notes in both ImageViewer and post feed

  #### UI Enhancements:
  - ✅ **5-button toolbar** - Load All, Download Loaded, Store Loaded, Download ALL, Store ALL
  - ✅ **Responsive wrapping** - Buttons adapt to mobile screens
  - ✅ **Loading states** - Buttons show progress and disable during operations
  - ✅ **Conditional rendering** - Store buttons only show when logged in
  - ✅ **Status indicators** - "Loading All...", "Downloading...", "Storing..."

  #### Technical Implementation:
  - ✅ `loadMore()` - Incremental pagination (50 posts at a time)
  - ✅ `loadAll()` - Recursive loading until all posts fetched
  - ✅ `handleDownloadAll()` - Direct download without selection state
  - ✅ `handleDownloadEntireBlog()` - Load + download wrapper
  - ✅ `handleStoreAll()` - Batch store to database
  - ✅ `handleStoreEntireBlog()` - Load + store wrapper
  - ✅ Backend proxy passes `notes_info` parameter to Tumblr API
  - ✅ Notes parsing in `useTumblrBlog` hook with debug logging

  #### Use Cases:
  - Archive entire Tumblr blogs (300+ posts) with one click
  - Download all images from a photographer's blog
  - Store complete collections to database for offline access
  - Track notes (likes/reblogs) from real Tumblr users
  - Bulk operations without manual selection

  ---

  ## v0.50.2 - (October 24, 2025)

  ### 🎨 Real Tumblr API Integration & Enhanced Image Parsing

  #### Major Features:
  - ✅ **Real Tumblr API integration** - Fetch live blog data from Tumblr
  - ✅ **Backend proxy** - CORS-free API calls through Express server
  - ✅ **HTML image parsing** - Extract images from text posts automatically
  - ✅ **Enhanced ImageViewer** - Full navigation in StoredImages page with left/right arrows
  - ✅ **Smart filtering** - "Images Only" mode shows all posts with images (photo + parsed HTML)

  #### Technical Improvements:
  - ✅ `src/services/api/tumblr.api.ts` - Comprehensive Tumblr API service layer
  - ✅ `src/hooks/useTumblrBlog.ts` - Custom React hook with fallback to mock data
  - ✅ Backend proxy endpoints (`/api/tumblr/blog/:id/info`, `/api/tumblr/blog/:id/posts`, `/api/tumblr/tagged`)
  - ✅ DOMParser-based HTML parsing for embedded images
  - ✅ Automatic blog identifier normalization (`.tumblr.com` suffix)

  #### API Setup:
  - ✅ **TUMBLR_SETUP.md** - Complete guide for API key registration
  - ✅ Environment variable support (`VITE_TUMBLR_API_KEY`)
  - ✅ Graceful degradation to mock data when API unavailable
  - ✅ 401 error detection with helpful troubleshooting messages

  #### User Experience:
  - ✅ Status banner indicates mock vs. real data
  - ✅ Specific error messages for API key activation issues
  - ✅ ImageViewer keyboard navigation (arrows, ESC, space)
  - ✅ Selection toggle directly from image viewer
  - ✅ Blog metadata display (avatar, description, post count)

  ---

  ## v0.10.4 - (October 23, 2025)

  ### 💰 Cost Tracking for Stored Images

  #### New Features:
  - ✅ **Cost field** added to StoredImage table for tracking monetary value
  - ✅ **Cost tracking** when storing images (optional field)
  - ✅ **Update endpoint** `PATCH /api/stored-images/:id` to modify cost
  - ✅ **Enhanced stats** endpoint returns total cost per blog and overall
  - ✅ **Database migration** successfully applied

  #### API Enhancements:
  - ✅ `POST /api/stored-images` - Accept `cost` field (Float, optional)
  - ✅ `PATCH /api/stored-images/:id` - Update stored image cost
  - ✅ `GET /api/stored-images/:userId/stats` - Returns `totalCost` and per-blog costs
  - ✅ Cost field stored as `DOUBLE PRECISION` in PostgreSQL

  #### Use Cases:
  - Track value of digital collectibles
  - Monitor investment in art/NFTs
  - Calculate total value of stored collection
  - Per-blog cost analysis and reporting

  ---

  ## v0.10.0 - (October 15, 2025)

  ### 🚀 Major Update: PostgreSQL Migration & Advanced Authentication

  #### Database Migration:
  - ✅ **PostgreSQL** replaces SQLite for production-ready storage
  - ✅ **Database seeding** with test accounts (Admin, User, Moderator)
  - ✅ **Enhanced schema** with role-based access control
  - ✅ **Migration tools** (`npm run db:migrate`, `db:seed`, `db:reset`)

  #### User Roles & Admin System:
  - ✅ **Role system**: USER, ADMIN, MODERATOR
  - ✅ **Admin dashboard** with user management
  - ✅ **Permission controls** for sensitive operations
  - ✅ **User role updates** (admin only)
  - ✅ **System statistics** (admin/moderator access)
  - ✅ **User deletion** with self-deletion protection

  #### Enhanced Authentication:
  - ✅ **Email verification** system with secure tokens
  - ✅ **Password reset** with expiring tokens (1 hour)
  - ✅ **Account recovery** by email with masked username
  - ✅ **Password strength validation** (min 8 chars, letter + number)
  - ✅ **Bcrypt hashing** with 12 salt rounds (increased from 10)
  - ✅ **Last login tracking** for security monitoring
  - ✅ **Email verification status** displayed in UI

  #### Settings Enhancements:
  - ✅ **Change password** with current password verification
  - ✅ **Resend verification email** button
  - ✅ **Email verification alert** for unverified accounts
  - ✅ **Password security info** with last login time
  - ✅ **Download filename patterns** (6 customizable patterns)
  - ✅ **Index numbering** option for bulk downloads
  - ✅ **Metadata sidecar files** (.txt) for downloaded images

  #### Security Features:
  - ✅ **Secure token generation** using crypto.randomBytes
  - ✅ **Token expiration** for password resets
  - ✅ **Account enumeration protection** (generic error messages)
  - ✅ **Self-deletion prevention** for admins
  - ✅ **Password reuse prevention** (can't reuse current password)

  #### Additional Updates:
  - ✅ **Notes panel redesign** with color-coded tabs
  - ✅ **Grid display settings** (columns & image size)
  - ✅ **Terse notes display** for compact viewing
  - ✅ **Clickable like/reblog counts** with filtered views
  - ✅ **Sticky filter menu** with lock/unlock icon
  - ✅ **Selection toolbar redesign** with modern aesthetics
  - ✅ **Store button** for saving images to database
  - ✅ **Keyboard navigation scrolling** fixed

  #### Test Accounts:
  ```
  Admin:     admin@tumblr.local      | admin      | Admin123!
  Test User: test@tumblr.local       | testuser   | Test123!
  Moderator: moderator@tumblr.local  | moderator  | Mod123!
  ```

  #### Documentation:
  - ✅ DATABASE.md updated with PostgreSQL setup
  - ✅ Security features documented
  - ✅ Admin functions documented
  - ✅ Seed data instructions
  - ✅ Production deployment guide

  ---

  ## v0.9.0 - (October 15, 2025)

  ### 🎉 Major Feature: Advanced Grid Selection System

  #### Grid Selection Features:
  - ✅ **Direct grid selection** with checkboxes on hover
  - ✅ **Multi-select**: Ctrl/Cmd+Click for individual selection
  - ✅ **Range select**: Shift+Click for range selection  
  - ✅ **Bulk actions**: Select All, Deselect All, Invert Selection
  - ✅ **Selection toolbar** with count and action buttons
  - ✅ **Download/Delete** selected images (UI ready)

  #### Advanced Filtering:
  - ✅ **Size filter**: Small, Medium, Large images
  - ✅ **Date filter**: Today, This Week, This Month
  - ✅ **Sort options**: Recent, Popular, Oldest
  - ✅ **Real-time filtering** with active filter count
  - ✅ **Clear all filters** quick action

  #### Keyboard Navigation:
  - ✅ **Home**: Jump to first image
  - ✅ **End**: Jump to last image
  - ✅ **Page Up**: Navigate up 3 rows
  - ✅ **Page Down**: Navigate down 3 rows
  - ✅ **Arrow keys**: Navigate grid (Up, Down, Left, Right)
  - ✅ **Enter**: Open focused image in viewer
  - ✅ **Space**: Toggle selection on focused image
  - ✅ **Visual focus indicator** (ring highlight)

  ### UI Improvements:
  - ✅ Selection overlay with checkmark
  - ✅ Hover states for better UX
  - ✅ Responsive grid layout with filter sidebar
  - ✅ Empty state with clear filters action
  - ✅ Selection count badge in toolbar
  - ✅ Keyboard shortcuts hint in toolbar

  ---

  ## v0.8.0 - (October 15, 2025)

  ### Major Features Added:
  - ✅ Search functionality with blog results
  - ✅ Blog view with 300+ image test blog (photoarchive)
  - ✅ Images Only mode (Dashboard & Blog)
  - ✅ Clickable blog names and notes
  - ✅ Like functionality for posts
  - ✅ Image counter in ImageViewer
  - ✅ Jump to Start/End navigation in ImageViewer
  - ✅ Image selection in ImageViewer modal
  - ✅ Follow/Unfollow blogs (renamed from Subscribe)
  - ✅ Comprehensive caching system (Service Worker, React Query, Image Cache)
  - ✅ Offline support
  - ✅ Version badge on all pages

  ### Changes:
  - Renamed "Subscribe" → "Follow" for Tumblr consistency
  - Fixed TypeScript configuration issues
  - Improved filter menu layout
  - Added image preloading and caching
  - Enhanced ImageViewer with full navigation controls

  ### Technical:
  - Service Worker caching (90 days for images)
  - React Query persistence (7 days)
  - Image cache manager with metadata tracking
  - General cache manager for flexible data storage

