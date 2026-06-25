# UX Heuristic Review — Mobitech

AI-powered UX prototype review tool. Upload a screenshot or paste a Figma URL and get a scored heuristic evaluation against 6 UX principles and design system compliance.

## Stack
- React + Vite (frontend)
- Vercel serverless function (API proxy)
- Anthropic Claude Sonnet (AI engine)

## Deploy to Vercel in 5 minutes

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create ux-heuristic-review --public --push
```

### 2. Import to Vercel
1. Go to vercel.com/new
2. Import your GitHub repo
3. Framework preset: **Vite**
4. Click **Deploy**

### 3. Add environment variable
In your Vercel project → Settings → Environment Variables:
```
ANTHROPIC_API_KEY = sk-ant-your-key-here
```

### 4. Redeploy
Vercel → Deployments → Redeploy (to pick up the env var)

That's it. Your app is live.

## Local development
```bash
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

The dev server runs the `/api/review` endpoint directly — no separate backend or `vercel dev` required. Open http://localhost:5173 and upload a screenshot or paste a Figma URL.

## Project structure
```
ux-heuristic-review/
├── src/
│   ├── App.jsx       ← full UI
│   ├── main.jsx
│   └── index.css
├── api/
│   └── review.js     ← Vercel serverless function (API key lives here)
├── vercel.json
├── vite.config.js
└── package.json
```
