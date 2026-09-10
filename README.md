# 🛒 isaiyaa.bd — Premium Digital Store (Website)

বাংলাদেশের প্রিমিয়াম ডিজিটাল স্টোর **isaiyaa.bd**-এর ওয়েবসাইট। Node.js + Express দিয়ে তৈরি — **কোনো ডাটাবেস লাগে না**, সব ডেটা JSON ফাইলে সেভ হয়।

> ⚠️ **GitHub Pages-এ এই সাইট চলবে না** — এটি Node.js backend সহ ওয়েবসাইট। GitHub Pages শুধু static ফাইল serve করে। লাইভ করতে নিচের **Deploy** সেকশন দেখুন।

## ✨ Features
- 🎨 Premium light blue-gradient design (English UI)
- 🛍️ Glass-effect product cards + dedicated product detail pages
- 💳 Dedicated **Cards** page (শুধু Visa/Master cards)
- 🔍 Live product search
- 💰 Secure online checkout (No COD):
  - **bKash / Nagad** → price in ৳ BDT + Transaction ID
  - **Binance / BTC / LTC** → live crypto amount (Binance public API rate)
- 📸 Payment proof: screenshot upload + TrxID + customer WhatsApp number
- ⭐ Customer review system (approval based)
- 💬 Floating customer care button (WhatsApp + Telegram)
- ✈️ Telegram channel join popup — [t.me/isaiyaa_bd](https://t.me/isaiyaa_bd)
- 🔔 Real-time order notification to Telegram (screenshot সহ)
- 🔐 Admin Panel — প্রোডাক্ট/অর্ডার/রিভিউ/সেটিংস ম্যানেজমেন্ট

## 🚀 Run Locally
```bash
npm install
npm start
```
→ Website: http://localhost:3000
→ Admin Panel: http://localhost:3000/admin (password: `36231`)

## 🌐 Deploy (GitHub Pages-এ নয় — নিচের হোস্টগুলোতে)

**Render.com (ফ্রি, সবচেয়ে সহজ):**
1. [render.com](https://render.com) → Sign up with GitHub
2. **New → Web Service** → এই repo (`isaiyaa-Store`) connect করুন
3. Build Command: `npm install` | Start Command: `npm start` | Instance: **Free**
4. **Create Web Service** → কিছুক্ষণে লাইভ: `https://isaiyaa-store.onrender.com`

**Railway / VPS-ও একইভাবে কাজ করবে।**

> 💡 **GitHub Pages ব্যবহার করে লাইভ করতে চাইলে** আলাদা static-only ভার্সন লাগবে (backend ছাড়া) — তাতে checkout/admin কাজ করবে না। তাই Render-ই সঠিক সমাধান।

## 📁 Project Structure
```
├── server.js              → Express backend (all APIs)
├── public/                → Website frontend (HTML/CSS/JS)
├── admin/                 → Admin Panel (dashboard, products, orders, settings)
├── data/
│   ├── products.json      → store products
│   ├── reviews.json       → customer reviews
│   ├── settings.example.json → settings template
│   ├── settings.json      → (git-ignored — bot token & live payment config)
│   └── orders.json        → (git-ignored — customer data)
└── uploads/               → (git-ignored — payment screenshots & images)
```

## 🔒 Security Notes
- `data/settings.json` কখনো push করবেন না — এতে Telegram **Bot Token** থাকে। নতুন server-এ `settings.example.json` কপি করে `settings.json` বানিয়ে নিজের token/chat ID বসান।
- `uploads/` ও `data/orders.json`-এ customer-এর ব্যক্তিগত তথ্য/স্ক্রিনশট থাকে — কখনো public করবেন না।

## 📞 Contact
- **WhatsApp:** 01824554565
- **Telegram:** @Devoloper_Emon | Channel: [t.me/isaiyaa_bd](https://t.me/isaiyaa_bd)