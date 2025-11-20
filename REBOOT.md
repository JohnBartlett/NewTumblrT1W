# REBOOT - Quick Start Guide

After rebooting your computer, follow these steps to restore the development environment:

## Quick Start (3 Steps)

### 1. Start PostgreSQL Database
```bash
brew services start postgresql@16
```

### 2. Navigate to Project
```bash
cd /Users/johnbartlett/NewTumblrT3
```

### 3. Start Development Servers
```bash
npm run dev
```

That's it! The app will be available at `http://localhost:5173`

---

## If Something Doesn't Work

### Database Not Starting?
```bash
brew services restart postgresql@16
psql -d tumblr_db -c "SELECT 1;" 2>/dev/null && echo "✅ Database OK" || echo "❌ Check database connection"
```

### Port Already in Use?
```bash
# Kill processes on ports 3001 and 5173
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
```

### Missing Dependencies?
```bash
npm install
npx prisma generate
```

---

## Verify Everything Works

1. Open `http://localhost:5173` in browser
2. Navigate to `/blog/photoarchive` (or any blog)
3. Press `I` to switch to Images Only view
4. Press `F` to switch back to Full View
5. Press `X` on a focused image to show metadata
6. Open an image and press `T` to toggle text overlay

If all these work, you're good to go! ✅

---

## Full Details

See `REBOOT_CHECKPOINT.md` for complete system state and detailed restoration instructions.

