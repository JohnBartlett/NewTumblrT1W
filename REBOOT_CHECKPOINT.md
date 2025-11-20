# Reboot Checkpoint - System State & Restoration Guide

**Created:** November 11, 2025 12:08 PM EST
**Project:** NewTumblrT3
**Version:** 0.93.0
**Status:** All features implemented and working

---

## 🎯 What We've Accomplished

### Core Features Implemented:
1. **Tumblr Blog Viewer** - Full blog browsing with posts and images
2. **OAuth Integration** - Tumblr OAuth 1.0a authentication
3. **Liked Posts Feature** - View and browse liked posts with images
4. **Image Metadata Embedding** - EXIF/IPTC metadata embedded in downloaded images
5. **Keyboard Shortcuts** - Comprehensive keyboard navigation:
   - `I` - Switch to Images Only view (Full View)
   - `F` - Switch to Full View (Images Only)
   - `X` - Show metadata for focused image (Images Only)
   - `1` - Load +50 images/posts
   - `2` - Load +100 images/posts
   - `3` - Load +200 images/posts
   - `4` - Load +1000 images/posts
6. **Metadata Display** - Full metadata panel with EXIF data support
7. **Image Text Display** - Press `T` in ImageViewer to toggle text overlay
8. **Content Priority Fix** - Fixed text truncation by prioritizing `caption` over `summary` for photo posts

### Files Modified:
- `src/hooks/useTumblrBlog.ts` - Fixed content extraction priority
- `src/features/blog/Blog.tsx` - Added keyboard shortcuts, metadata panel, fixed liked posts content
- `src/components/ui/MetadataPanel.tsx` - New component for displaying metadata
- `src/components/ui/ImageViewer.tsx` - Added text overlay with 'T' key toggle
- `server/index.ts` - Added metadata embedding using sharp library
- `src/utils/imageDownload.ts` - Updated to include imageText in metadata

---

## 🔧 Current State

### Working Features:
✅ Server running on port 3001
✅ Database (PostgreSQL) connected via Prisma
✅ OAuth authentication working
✅ Blog browsing (posts and liked posts)
✅ Image viewing with zoom, slideshow, fullscreen
✅ Image downloading with embedded metadata
✅ Image storing functionality
✅ Notes panel with real Tumblr API data
✅ Keyboard shortcuts for navigation and loading
✅ Metadata panel for viewing image information
✅ Text overlay in ImageViewer (press 'T')

### Known Issues:
- None currently

### Environment:
- **Node.js**: Required (check with `node --version`)
- **PostgreSQL**: Running locally (check with `brew services list | grep postgresql`)
- **Database**: Prisma-managed PostgreSQL database
- **Ports**: 
  - Server: 3001
  - Client: 5173 (Vite dev server)

---

## 📋 Pending Items

### Future Enhancements (Not Critical):
1. Server-side EXIF reading endpoint for metadata panel (currently shows metadata from post data)
2. Enhanced metadata display with actual EXIF data extraction from image files

---

## 🚀 Next Steps After Reboot

### 1. Start Database:
```bash
cd /Users/johnbartlett/NewTumblrT3
brew services start postgresql@16
# Note: PostgreSQL@16 is installed (not @14)
# Check status: brew services list | grep postgresql
```

### 2. Verify Database Connection:
```bash
# Check if database is accessible
psql -d tumblr_db -c "SELECT 1;" 2>/dev/null && echo "Database OK" || echo "Database connection issue"
```

### 3. Start Development Servers:
```bash
cd /Users/johnbartlett/NewTumblrT3
npm run dev
```

This will start both:
- Server (port 3001)
- Client (port 5173)

### 4. Verify Environment Variables:
Check `.env` file exists and contains:
- `DATABASE_URL` - PostgreSQL connection string
- `VITE_TUMBLR_API_KEY` - Tumblr API key
- `TUMBLR_API_KEY` - Server-side Tumblr API key
- `TUMBLR_CONSUMER_KEY` - OAuth consumer key
- `TUMBLR_CONSUMER_SECRET` - OAuth consumer secret
- `JWT_SECRET` - JWT secret for authentication

---

## 🧠 Context to Remember

### Key Architectural Decisions:

1. **Content Extraction Priority:**
   - Photo posts: `caption` > `summary` (caption has full text, summary is truncated)
   - Text posts: `body` > `summary`
   - Other posts: `caption` > `body` > `summary`

2. **Metadata Embedding:**
   - Uses `sharp` library on server-side
   - Embeds EXIF and IPTC metadata into downloaded images
   - Falls back to original image if embedding fails
   - Also creates sidecar `.txt` files with metadata

3. **Keyboard Shortcuts:**
   - Only active when not typing in input fields
   - Context-aware (different shortcuts for Full View vs Images Only)
   - Content-aware (different behavior for posts vs liked posts)

4. **Image Text Display:**
   - Press `T` in ImageViewer to toggle text overlay
   - Text is sanitized HTML (strips tags, converts to readable format)
   - Overlaps image at bottom with scrollable container

5. **Liked Posts Pagination:**
   - Uses offset-based pagination (0-1000 posts)
   - Switches to timestamp-based pagination beyond 1000 posts
   - Automatically handles pagination method switching

### Important Code Locations:

- **Blog Component**: `src/features/blog/Blog.tsx`
- **Tumblr API Hook**: `src/hooks/useTumblrBlog.ts`
- **Server Endpoints**: `server/index.ts`
- **OAuth Functions**: `server/tumblrOAuth.ts`
- **Image Download Utils**: `src/utils/imageDownload.ts`
- **Metadata Panel**: `src/components/ui/MetadataPanel.tsx`
- **Image Viewer**: `src/components/ui/ImageViewer.tsx`

### Database Schema:
- Uses Prisma ORM
- Schema file: `prisma/schema.prisma`
- Run migrations: `npm run db:migrate`
- View schema: `npx prisma studio`

---

## 🔐 Environment Setup Checklist

After reboot, verify:

- [ ] PostgreSQL is running (`brew services list | grep postgresql`)
- [ ] Database connection works (`psql -d tumblr_db`)
- [ ] `.env` file exists with all required variables
- [ ] Node modules installed (`npm install` if needed)
- [ ] Prisma client generated (`npx prisma generate` if needed)
- [ ] Server starts without errors (`npm run server`)
- [ ] Client starts without errors (`npm run client`)

---

## 📝 Quick Commands Reference

```bash
# Start everything
npm run dev

# Start server only
npm run server

# Start client only
npm run client

# Database operations
npm run db:migrate    # Run migrations
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed database

# Build for production
npm run build

# Check server logs
# (logs appear in terminal where server is running)
```

---

## 🐛 Troubleshooting

### If database won't connect:
```bash
brew services restart postgresql@16
psql -d tumblr_db -c "SELECT 1;"
```

### If ports are in use:
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### If Prisma client is out of sync:
```bash
npx prisma generate
```

### If environment variables are missing:
Check `.env` file exists and has all required variables (see above)

---

## ✅ Verification Steps

After reboot and starting servers:

1. Open browser to `http://localhost:5173`
2. Navigate to a blog (e.g., `/blog/photoarchive`)
3. Test keyboard shortcuts:
   - Press `I` to switch to Images Only view
   - Press `F` to switch back to Full View
   - Press `X` on a focused image to show metadata
   - Press `1`, `2`, `3`, `4` to load more images
4. Open an image and press `T` to toggle text overlay
5. Download an image and verify metadata is embedded

---

## 📌 Notes

- All recent changes have been saved and accepted
- The codebase is in a stable, working state
- No breaking changes pending
- All features are fully functional

**Ready for reboot!** 🚀

