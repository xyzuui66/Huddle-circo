# 🧪 HUDDLE V5 - TESTING & SETUP GUIDE

## ⚠️ PENTING: BUILD & SETUP ORDER

### **STEP 1: EXTRACT & SETUP ENV**

```bash
unzip huddle-complete-v5-final.zip
cd huddle
```

**Check .env.local exists dengan semua credentials:**
```env
NEXT_PUBLIC_SUPABASE_URL=✓
NEXT_PUBLIC_SUPABASE_ANON_KEY=✓
DAILY_API_KEY=✓
NEXT_PUBLIC_AGORA_APP_ID=✓
NEXT_PUBLIC_AGORA_CERTIFICATE=✓
```

### **STEP 2: DATABASE SETUP (CRITICAL!)**

**Buka Supabase Dashboard:**
1. Navigate to SQL Editor
2. Create new query
3. Open file: `GIFT_SYSTEM_TABLES.sql`
4. Copy ENTIRE content
5. Paste in SQL Editor
6. **CLICK RUN!**

**Wait for success message. DO NOT SKIP THIS!**

### **STEP 3: INSTALL & BUILD**

```bash
npm install --legacy-peer-deps
npm run build
```

**If build succeeds:**
- ✅ All dependencies installed
- ✅ No TypeScript errors
- ✅ Ready for development

### **STEP 4: RUN DEVELOPMENT SERVER**

```bash
npm run dev
```

**Buka:** http://localhost:3000

---

## ✅ TESTING CHECKLIST

```env
# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://wtfhzmuegunxndmibvuf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0Zmh6bXVlZ3VueG5kbWlidnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzU5NTUsImV4cCI6MjA5Mjc1MTk1NX0.bwixxbh3xSqZPnowPD15qmcnDrK2Q7W2WsdcSEs0_d8

# DAILY.CO
DAILY_API_KEY=682c5c02985ceaf0379dc1bc444f128598e804de9bbc47d4cc7cdfd7ee9faf4c

# AGORA
NEXT_PUBLIC_AGORA_APP_ID=aecb87e4ee0e4e5c9e9ec8ee9df6e20b
AGORA_APP_CERTIFICATE=77075d277b58462096199abd43d167a4

# MISC
NEXT_PUBLIC_SUPPORT_EMAIL=fluxtecheng@gmail.com
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### **Step 3: Run Development Server**
```bash
npm run dev
```

**Buka:** http://localhost:3000

---

## ✅ TESTING CHECKLIST

### **AUTH & PROFILE**
- [ ] Register akun baru
- [ ] Login dengan akun
- [ ] Edit profil (nama, bio)
- [ ] Upload foto profil
- [ ] Dark mode toggle
- [ ] Language toggle (EN/ID)

### **CHAT FEATURES**
- [ ] Global chat send message
- [ ] Global chat receive realtime
- [ ] Upload foto di global chat
- [ ] Save kontak
- [ ] Search kontak by name/username

### **GROUPS & COMMUNITIES**
- [ ] View groups list (jika ada)
- [ ] Join group
- [ ] Send message di group
- [ ] Upload media di group

### **STORIES**
- [ ] Upload story (foto)
- [ ] View story
- [ ] Story expiration (24h)

### **FEEDS**
- [ ] Create post
- [ ] Upload multiple photos
- [ ] Like & comment

### **CALLS**
- [ ] Open calls page
- [ ] Setup Daily.co video (ini placeholder, normal)

### **🎁 GIFT SYSTEM (NEW!)**
- [ ] Buka `/live-stream` page
- [ ] Klik "Kirim Gift"
- [ ] Pilih gift type (Rose, Diamond, dll)
- [ ] Set quantity
- [ ] Lihat total harga
- [ ] Klik "Lanjut"
- [ ] Lihat bank info host
- [ ] Copy nomor rekening
- [ ] Klik "Sudah Transfer"
- [ ] Gift animation muncul ✨
- [ ] Gift appear di "Recent Gifts"
- [ ] Top gifter leaderboard update

### **RESPONSIVE**
- [ ] Desktop (> 1024px) - sidebar
- [ ] Tablet (768-1024px) - responsive
- [ ] Mobile (< 768px) - bottom nav

---

## 🔍 COMMON ERRORS & FIXES

### **Error: "Property 'profile' does not exist"**
```
❌ Problem: Type mismatch di stream chat
✅ Fix: DONE - menggunakan sender? bukan profile?
```

### **Error: "Cannot find module '@/hooks/useGiftSystem'"**
```
❌ Problem: Hook tidak ter-import
✅ Fix: File sudah ada di src/hooks/useGiftSystem.ts
```

### **Error: "GIFT_SYSTEM_TABLES.sql not run"**
```
❌ Problem: Tables ga ada di database
✅ Fix: CRITICAL! Run SQL di Supabase SQL Editor!
```

### **Error: "Gifts ga bisa diload"**
```
❌ Problem: Supabase realtime ga aktif
✅ Fix: Check Supabase console → Realtime enabled
```

### **Error: "Gift modal ga muncul"**
```
❌ Problem: GiftModal component error
✅ Fix: Check console log (F12) untuk detail error
```

---

## 🧬 NEW FILES ADDED

```
✅ src/hooks/useGiftSystem.ts (Gift system hook)
✅ src/components/GiftModal.tsx (Gift modal UI)
✅ src/app/live-stream/page.tsx (Live streaming page)
✅ GIFT_SYSTEM_TABLES.sql (Database migration)
```

---

## 📊 NEW FEATURES

### **Gift System**
- 9 types of gifts (Rose - Fire)
- Manual donation (no payment gateway)
- Host bank account setup
- Realtime gift notifications
- Top gifter leaderboard
- Earnings tracking

### **Live Streaming**
- Stream info display
- Viewer count
- Live chat
- Gift animations
- Donation tracking

---

## 🚨 IF SOMETHING BREAKS

### **Check This First:**

1. **Database Tables**
   ```
   Supabase → Database → Tables
   - gifts ✓
   - stream_gifts ✓
   - wallets ✓
   - transactions ✓
   - live_streams ✓
   ```

2. **Environment Variables**
   ```
   .env.local must have ALL these:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - DAILY_API_KEY
   - NEXT_PUBLIC_AGORA_APP_ID
   - NEXT_PUBLIC_AGORA_CERTIFICATE
   ```

3. **Realtime Status**
   ```
   Supabase → Realtime
   - gifts: Enabled ✓
   - stream_gifts: Enabled ✓
   - wallets: Enabled ✓
   - transactions: Enabled ✓
   - live_streams: Enabled ✓
   ```

4. **Check Browser Console**
   ```
   F12 → Console tab
   Any red errors? Gue bisa fix!
   ```

---

## 📱 PAGE ROUTES

| Route | Feature | Status |
|-------|---------|--------|
| `/` | Redirect to login | ✅ |
| `/auth/login` | Login | ✅ |
| `/auth/register` | Register | ✅ |
| `/global-chat` | Chat | ✅ |
| `/groups/chat` | Group Chat | ✅ |
| `/communities/chat` | Community Chat | ✅ |
| `/stories` | Stories | ✅ |
| `/feeds` | Posts | ✅ |
| `/calls` | Voice/Video Calls | ✅ |
| `/contacts` | Save Kontak | ✅ |
| `/profile` | Profile Edit | ✅ |
| `/settings` | Settings | ✅ |
| `/live-stream` | **NEW - Gift System** | ✅ |

---

## 💾 DATABASE SCHEMA

### **gifts**
- id, name, icon, price, animation, display_order

### **stream_gifts**
- id, stream_id, gifter_id, gift_id, quantity, total_amount, gifter_name, gifter_note, status

### **wallets**
- id, user_id, balance, total_earned, bank_account, bank_name, account_holder, donation_note

### **transactions**
- id, user_id, type, amount, description, reference_id, status

### **live_streams**
- id, host_id, title, description, category, is_live, viewer_count, total_gifts_amount, started_at, ended_at

---

## 🎯 NEXT STEPS AFTER TESTING

1. **Jika semua OK:**
   - Push ke GitHub
   - Deploy ke Vercel
   - Share link
   - LIVE! 🚀

2. **Jika ada error:**
   - Share error message
   - I fix immediately
   - Re-test
   - Deploy

---

## 📞 TROUBLESHOOTING

**Q: "Gifts ga muncul di database"**
A: Run GIFT_SYSTEM_TABLES.sql dulu!

**Q: "Realtime update ga jalan"**
A: Check Supabase Realtime settings

**Q: "Gift modal error"**
A: Check console (F12) untuk detail

**Q: "Can't find live-stream page"**
A: Make sure `/src/app/live-stream/page.tsx` exists

---

## ✨ FINAL CHECKLIST

```
✅ npm install successful
✅ .env.local all filled
✅ Database tables created
✅ Realtime enabled
✅ `npm run dev` running
✅ http://localhost:3000 opening
✅ Can register & login
✅ Can navigate to /live-stream
✅ Can open gift modal
✅ Can send gift
✅ Gifts appear in list
✅ Top gifters showing
```

---

**READY FOR TESTING!** 💪🚀

Kalau ada issue, paste error message atau screenshot. Gue fix immediately!

Gakuan, Gue semua.
