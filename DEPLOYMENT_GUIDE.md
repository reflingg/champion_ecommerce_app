# Champion Furniture - Complete Deployment Guide

This guide walks you through deploying your app step by step. Follow them **in order**.

---

## Overview

| Service | What it does | Cost |
|---------|-------------|------|
| **Supabase** | Database (stores users, products, orders, chats) | Free tier available |
| **Cloudinary** | Image hosting (product photos) | Free tier: 25GB storage |
| **Render** | Hosts your Node.js backend API | Free tier available |
| **Vercel** | Hosts your React frontend | Free tier available |
| **GitHub** | Stores your code (needed by Render & Vercel) | Free |

---

## STEP 1: Push Your Code to GitHub

Both Render and Vercel deploy from a GitHub repository. You need to push your code there first.

### 1a. Create a GitHub Account (skip if you have one)
1. Go to **https://github.com** and click **Sign up**
2. Follow the steps to create your account
3. Verify your email address

### 1b. Install Git (skip if already installed)
1. Open a terminal and type `git --version`
2. If it says "not recognized", download Git from **https://git-scm.com/download/win**
3. Install it with all the default options
4. **Close and reopen your terminal** after installing

### 1c. Create a New Repository on GitHub
1. Go to **https://github.com/new**
2. Repository name: `champion-furniture`
3. Description: `Furniture e-commerce webapp`
4. Select **Private** (to keep your code private)
5. Do NOT check "Add a README file"
6. Click **Create repository**
7. You'll see a page with setup instructions — keep this page open

### 1d. Push Your Code
Open a terminal in VS Code and run these commands **one at a time**:

```powershell
cd c:\Users\BestEmpireComputers\champion

# Initialize git
git init

# Create a .gitignore to avoid uploading sensitive files and node_modules
# (Already exists but let's make sure it's correct)

# Stage all files
git add .

# Create your first commit
git commit -m "Initial commit - Champion Furniture e-commerce"

# Connect to your GitHub repo (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/champion-furniture.git

# Push your code
git branch -M main
git push -u origin main
```

> **Important:** When pushing for the first time, GitHub will ask you to sign in. A browser window will open — sign in with your GitHub account.

### 1e. Verify the .gitignore
Make sure `backend/.env` is listed in your `.gitignore` so your secrets don't get uploaded. Your `.gitignore` should include:

```
node_modules/
.env
```

---

## STEP 2: Set Up Supabase (Database)

Supabase gives you a free PostgreSQL database in the cloud.

### 2a. Create a Supabase Account
1. Go to **https://supabase.com**
2. Click **Start your project** (top right)
3. Sign in with your **GitHub account** (easiest option)

### 2b. Create a New Project
1. Click **New Project**
2. **Organization**: Select your personal org (or create one — it asks for a name, just put your name)
3. Fill in:
   - **Name**: `champion-furniture`
   - **Database Password**: Create a strong password and **write it down somewhere safe** (you won't need it often, but keep it)
   - **Region**: Pick the one closest to you or your users (e.g., `East US` if you're in the US)
4. Click **Create new project**
5. Wait for the project to finish setting up (takes about 1-2 minutes — you'll see a loading bar)

### 2c. Run the Database Schema
This creates all the tables your app needs.

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query** (top right)
3. Open the file `backend/supabase-schema.sql` from your project in VS Code
4. **Copy the entire contents** of that file
5. **Paste it** into the Supabase SQL Editor
6. Click **Run** (the green play button, or Ctrl+Enter)
7. You should see "Success. No rows returned" — that means it worked!

### 2d. Verify Tables Were Created
1. Click **Table Editor** in the left sidebar
2. You should see these tables listed:
   - `users`
   - `products`
   - `carts`
   - `cart_items`
   - `orders`
   - `order_items`
   - `chats`
   - `messages`

If you see all 8 tables, your database is ready!

### 2e. Get Your Supabase Credentials
1. Click the **gear icon** (Settings) in the left sidebar
2. Click **API** under "Project Settings"
3. You'll see:
   - **Project URL**: Something like `https://abcdefgh.supabase.co` — **copy this**
   - **Under "Project API keys"**, find the key labeled `service_role` (click "Reveal" to see it) — **copy this**

> **WARNING**: The `service_role` key has full access to your database. Never share it publicly or put it in frontend code. It's only for your backend server.

### 2f. Save Credentials to Your .env File
Open `backend/.env` and update it:

```
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...your_long_key_here
```

Replace the placeholder values with the actual values you copied.

---

## STEP 3: Set Up Cloudinary (Image Hosting)

Cloudinary stores and serves your product images.

### 3a. Create a Cloudinary Account
1. Go to **https://cloudinary.com**
2. Click **Sign Up for Free**
3. Fill in your details and sign up
4. Verify your email if asked

### 3b. Get Your Cloudinary Credentials
1. After signing in, you'll land on the **Dashboard**
2. You'll see a section called **Product Environment Credentials** with:
   - **Cloud Name**: Something like `dxyz1234` — **copy this**
   - **API Key**: A number like `123456789012345` — **copy this**
   - **API Secret**: Click the eye icon to reveal it — **copy this**

### 3c. Save Credentials to Your .env File
Open `backend/.env` and update:

```
CLOUDINARY_CLOUD_NAME=dxyz1234
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_api_secret_here
```

Replace placeholders with your actual values.

---

## STEP 4: Seed Your Database (Add Sample Data)

Now that Supabase and Cloudinary are configured, let's add the sample products and users.

1. Open a terminal in VS Code
2. Run:

```powershell
cd c:\Users\BestEmpireComputers\champion\backend
npm run seed
```

3. You should see:
```
Clearing existing data...
Creating users...
Creating products...

Seed data imported successfully!
Admin login: admin@champion.com / admin123
User login: john@example.com / password123
```

4. Go back to **Supabase Dashboard** → **Table Editor** → click on **products**
5. You should see 12 furniture products listed!
6. Click on **users** — you should see 2 users (Admin and John Doe)

> **If you get an error**: Double-check that your `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct in the `.env` file.

---

## STEP 5: Test Locally (Optional but Recommended)

Before deploying, make sure everything works on your computer.

### 5a. Start the Backend
```powershell
cd c:\Users\BestEmpireComputers\champion\backend
npm run dev
```
You should see: `Server running on port 5000`

### 5b. Start the Frontend (in a NEW terminal)
```powershell
cd c:\Users\BestEmpireComputers\champion\frontend
npm start
```
A browser tab will open at `http://localhost:3000`

### 5c. Test the App
1. You should see the homepage with furniture products
2. Click **Login** and use: `john@example.com` / `password123`
3. Browse products, add something to cart
4. Try the admin login: `admin@champion.com` / `admin123`

> **Press Ctrl+C** in each terminal to stop the servers when done testing.

---

## STEP 6: Deploy Backend to Render

Render will host your Node.js API server.

### 6a. Create a Render Account
1. Go to **https://render.com**
2. Click **Get Started for Free**
3. Sign in with your **GitHub account** (this also connects your repos)

### 6b. Create a New Web Service
1. Click **New** → **Web Service**
2. Connect your GitHub repository:
   - Find `champion-furniture` in the list and click **Connect**
   - If you don't see it, click "Configure account" to give Render access to your repos
3. Fill in the settings:

| Setting | Value |
|---------|-------|
| **Name** | `champion-furniture-api` |
| **Region** | Pick the same region as your Supabase project |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

### 6c. Add Environment Variables
Scroll down to **Environment Variables** and click **Add Environment Variable** for each:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Make up a long random string, e.g. `champion_prod_s3cret_k3y_2026_xyz` |
| `SUPABASE_URL` | Your Supabase project URL (same as in .env) |
| `SUPABASE_SERVICE_KEY` | Your Supabase service_role key (same as in .env) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `FRONTEND_URL` | Leave blank for now — we'll update this after deploying the frontend |
CD 
### 6d. Deploy
1. Click **Create Web Service**
2. Render will start building and deploying your backend
3. Wait for the build to finish (look for "Your service is live" in the logs)
4. Your API URL will be something like: `https://champion-furniture-api.onrender.com`
5. **Copy this URL** — you'll need it for the frontend

### 6e. Verify Backend is Running
Open your browser and go to:
```
https://champion-furniture-api.onrender.com/health
```
You should see: `{"status":"ok"}`

> **Note**: Free Render services "sleep" after 15 minutes of inactivity. The first request after sleeping takes ~30 seconds. This is normal for the free tier.

---

## STEP 7: Deploy Frontend to Vercel

Vercel will host your React app.

### 7a. Create a Vercel Account
1. Go to **https://vercel.com**
2. Click **Sign Up**
3. Sign in with your **GitHub account**

### 7b. Import Your Project
1. Click **Add New...** → **Project**
2. Find `champion-furniture` and click **Import**
3. Configure the project:

| Setting | Value |
|---------|-------|
| **Project Name** | `champion-furniture` |
| **Framework Preset** | `Create React App` (should auto-detect) |
| **Root Directory** | Click **Edit** → type `frontend` → click **Continue** |

### 7c. Add Environment Variables
Before deploying, expand **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://champion-furniture-api.onrender.com/api` (your Render URL + `/api`) |
| `REACT_APP_SOCKET_URL` | `https://champion-furniture-api.onrender.com` (your Render URL, no `/api`) |

### 7d. Deploy
1. Click **Deploy**
2. Wait for the build to complete (usually 1-3 minutes)
3. You'll see "Congratulations!" when it's done
4. Your site URL will be something like: `https://champion-furniture.vercel.app`
5. **Copy this URL**

### 7e. Test Your Live Site
1. Open your Vercel URL in a browser
2. You should see the furniture store with products loaded
3. Try logging in and browsing around

---

## STEP 8: Connect Frontend URL to Backend

Go back to Render and update the `FRONTEND_URL` environment variable:

1. Go to **https://dashboard.render.com**
2. Click on your `champion-furniture-api` service
3. Click **Environment** in the left sidebar
4. Find `FRONTEND_URL` and set it to your Vercel URL: `https://champion-furniture.vercel.app`
5. Click **Save Changes**
6. Render will automatically redeploy with the new setting

---

## STEP 9: Install as PWA (Progressive Web App)

Since this app has PWA support, users can install it like a native app:

### On Desktop (Chrome):
1. Visit your Vercel URL
2. Look for the install icon in the address bar (a small ⊕ or download icon)
3. Click it → **Install**

### On Mobile (Android):
1. Open your Vercel URL in Chrome
2. You'll see a banner at the bottom: "Add Champion Furniture to Home screen"
3. Tap **Install** (or open menu → "Add to Home screen")

### On Mobile (iPhone/Safari):
1. Open your Vercel URL in Safari
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**

---

## Quick Reference: Your URLs & Credentials

After deployment, fill in your actual values:

| Item | Value |
|------|-------|
| **Frontend (Vercel)** | `https://champion-furniture.vercel.app` |
| **Backend API (Render)** | `https://champion-furniture-api.onrender.com` |
| **Supabase Dashboard** | `https://supabase.com/dashboard` |
| **Cloudinary Dashboard** | `https://console.cloudinary.com` |
| **Admin Login** | `admin@champion.com` / `admin123` |
| **Test User Login** | `john@example.com` / `password123` |

---

## Troubleshooting

### "Products not loading on the live site"
- Check that `REACT_APP_API_URL` in Vercel is correct (must end with `/api`)
- Check that your Render backend is running (visit the `/health` endpoint)
- The free Render tier sleeps after 15 min — wait 30 seconds and refresh

### "Login not working"
- Make sure you ran `npm run seed` to add users to the database
- Check Supabase Table Editor → users table to confirm users exist

### "CORS errors in browser console"
- Make sure `FRONTEND_URL` is set correctly in Render's environment variables
- It should match your Vercel URL exactly (with `https://`)

### "Images not loading"
- If you see broken images, the seed data uses Unsplash placeholder URLs which should work
- For uploaded images, verify your Cloudinary credentials are correct in Render

### "Chat not working in real-time"
- Make sure `REACT_APP_SOCKET_URL` is set in Vercel (without `/api`)
- Socket.IO on the free Render tier may have connection delays

### How to redeploy after code changes
1. Make your changes locally
2. Run these commands:
```powershell
cd c:\Users\BestEmpireComputers\champion
git add .
git commit -m "Your change description"
git push
```
3. Both Render and Vercel will **automatically redeploy** when you push to GitHub!

---

## Updating Passwords Before Going Live

Before sharing the app with real users, change these default credentials:

1. **JWT_SECRET** in Render: Use a long random string (32+ characters)
2. **Admin password**: Log in as admin, go to profile, and change the password
3. **Remove test user**: Go to Supabase Table Editor → users → delete the John Doe row

---

That's it! Your Champion Furniture store is now live on the internet. 🎉
