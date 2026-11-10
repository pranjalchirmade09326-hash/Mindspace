# 🎬 MindSpace - Quick Start (5 Minutes)

## Step 1: Start Services (1 min)
```bash
cd D:\Mindspace\frontend
docker compose up -d
```

Wait for all services to be "healthy":
```bash
docker compose ps
# Output should show:
# - mindspace-frontend-postgres: healthy ✓
# - mindspace-frontend: healthy ✓
# - mindspace-redis: healthy ✓
```

## Step 2: Open in Chrome (30 sec)
```
http://localhost:4000/en
```

You should see the beautiful landing page! 🎉

## Step 3: Try Demo Login (1 min)

### Option A: Click "Try Demo" Button
1. On landing page, find "Try Demo" button
2. Click → goes to demo login page
3. See all demo accounts

### Option B: Direct Demo Login URL
```
http://localhost:4000/en/demo-login
```

## Step 4: Quick Test (2 min)

### Test Member Dashboard
1. Click on **"Sarah Chen"** card (member)
2. Credentials auto-copy
3. Click "Sign In"
4. ✨ Member Dashboard appears!
5. See: Profile, Stats, Journal Entries

### Test Listener Dashboard
1. Go back to demo-login
2. Click on **"Marcus Johnson"** card (listener)
3. Sign in
4. ✨ Listener Dashboard appears!
5. See: Profile, Rating, Conversations

---

## 🎯 Demo Accounts (Copy-Paste Ready)

### Members
```
📧 member@demo.com          👤 Sarah Chen (15 journals, 7-day streak)
🔑 demo123456

📧 member2@demo.com         👤 Alex Rivera (8 journals, 4-day streak)
🔑 demo123456
```

### Listeners
```
📧 listener@demo.com        👤 Marcus Johnson (42 chats, 4.8★ rating)
🔑 demo123456

📧 listener2@demo.com       👤 Emma Williams (58 chats, 4.9★ rating)
🔑 demo123456
```

### Admin
```
📧 admin@demo.com           👤 Admin User
🔑 demo123456
```

---

## 📱 What You'll See

### Landing Page
- ✅ Beautiful hero section
- ✅ "Try Demo" call-to-action
- ✅ Features showcase
- ✅ Testimonials
- ✅ Professional layout

### Demo Login Page
- ✅ 5 account cards (color-coded by role)
- ✅ Copy credentials with 1 click
- ✅ Click to auto-login
- ✅ Smooth animations

### Member Dashboard
- ✅ Welcome message with user name
- ✅ Profile header with avatar
- ✅ Stats cards:
  - Journal Entries: **15**
  - Support Sessions: **3**
  - Consecutive Days: **7**
- ✅ Mood indicator: **Happy** 😊
- ✅ Refresh button

### Listener Dashboard
- ✅ Listener name & avatar
- ✅ Performance metrics:
  - Total Conversations: **42**
  - Rating: **4.8/5.0**
  - Response Time: **2 min**
- ✅ Active status: **Yes**
- ✅ Specialties: Anxiety Support
- ✅ Professional stats grid

---

## 🔧 Troubleshooting

### Port Already in Use?
```bash
# Change port in docker-compose.yml
# Change "4000:3000" to "5000:3000"
docker compose down
docker compose up -d
# Then open: http://localhost:5000/en
```

### PostgreSQL Connection Error?
```bash
# Check if PostgreSQL is running
docker compose logs postgres

# Restart it
docker compose restart postgres
```

### Database Doesn't Have Demo Data?
```bash
# Seed demo users
docker compose exec frontend pnpm exec tsx scripts/test-data/demo-users-seed.ts

# Or use API
curl -X POST http://localhost:4000/api/seed/demo-users
```

### Still Not Working?
```bash
# Full restart
docker compose down -v
docker compose up -d

# Wait 30 seconds, then try again
```

---

## 🌐 URLs to Test

| URL | What You See |
|-----|-------------|
| http://localhost:4000/en | Landing Page |
| http://localhost:4000/en/demo-login | Demo Login |
| http://localhost:4000/en/login | Regular Sign-In |
| http://localhost:4000/en/signup | Register New Account |

---

## ✨ Features You're Testing

✅ Professional landing page
✅ Demo login system
✅ Member dashboard with stats
✅ Listener dashboard with metrics
✅ Database integration
✅ Authentication flow
✅ Responsive design (try on phone!)
✅ Dark mode (toggle in top-right)

---

## 🎓 What's Next?

1. **Explore Member Features**
   - Try different moods
   - View journal entries
   - Check activity stats

2. **Explore Listener Features**
   - Check availability
   - View specialties
   - See rating & reviews

3. **Test Real Sign-Up**
   - Create your own account
   - Set a custom profile
   - Experience full workflow

4. **Check Responsiveness**
   - Open DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M)
   - Test on mobile view

---

## 💡 Pro Tips

💡 **Dark Mode**: Look for sun/moon icon in navbar
💡 **Language Switch**: Change language in top-right
💡 **Copy Credentials**: One-click copy on demo cards
💡 **Auto-Fill**: Credentials auto-fill in sign-in form
💡 **Refresh**: Click refresh button on dashboards to reload data
💡 **Responsive**: Resize window to see responsive design

---

**You're all set! Enjoy exploring MindSpace! 🚀**

Need help? Check DEMO_SETUP_GUIDE.md for detailed documentation.
