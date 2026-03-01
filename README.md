# My E-Commerce Store

This is a full-stack e-commerce application built with React, Express, and SQLite.

## Features
- **Storefront**: Flash sales, newest products, categories, and search.
- **Admin Dashboard**: Full product management (Add/Edit/Delete), Order tracking, Offer management, and Customer Chat.
- **Checkout**: Multi-step checkout with Customer Details and Payment selection (Card/COD).
- **Notifications**: Real-time alerts for new orders and inquiries.

## Deployment Instructions

### Option A: GitHub + Render (Recommended)
1.  **Create a GitHub Repo**: Create a new repository on GitHub.
2.  **Push Code**:
    ```bash
    git init
    git add .
    git commit -m "Initial setup"
    git remote add origin <YOUR_GITHUB_URL>
    git push -u origin main
    ```
3.  **Connect to Render**:
    - Go to [Render.com](https://render.com).
    - Create a "New Web Service".
    - Connect your GitHub repo.
    - **Build Command**: `npm run build`
    - **Start Command**: `npm start`
    - **Environment Variables**: Add `NODE_ENV=production`.

### Option B: Manual Hosting
1.  Download the ZIP of this project.
2.  Run `npm install` on your server.
3.  Run `npm run build`.
4.  Run `npm start`.

### 1. Prerequisites
- Node.js installed on your server.
- The project files (downloaded as a ZIP).

### 2. Installation
1. Unzip the project folder.
2. Open your terminal in that folder.
3. Run: `npm install` to install all dependencies.

### 3. Environment Variables
Create a `.env` file in the root directory and add:
```env
PORT=3000
NODE_ENV=production
# Add your Gemini API key if you want to use AI features
GEMINI_API_KEY=your_key_here
```

### 4. Running the App
- **Development**: `npm run dev`
- **Production Build**: `npm run build`
- **Start Production**: `npm start`

### 5. Admin Access
- **URL**: `yourdomain.com/admin`
- **Username**: `Jitendraghartimagar`
- **Password**: `jite123`

### 6. Database
The app uses SQLite (`database.sqlite`). 
- **Important**: If you use a hosting provider like Render or Fly.io, you **must** mount a "Persistent Volume" to the root directory. Otherwise, your products and orders will be deleted every time the server restarts.

## Project Structure
- `/src`: React frontend code.
- `/server.ts`: Express backend and API logic.
- `/database.sqlite`: Your store data (Products, Orders, Users).
- `/public`: Static assets.
