📌 Aerchain RFP – Full Stack Procurement Automation (AI Powered)

🚀 Features

AI-generated RFP creation from free-text
Vendor proposal submission
AI proposal parsing from email content
AI scoring and ranking of vendor proposals
Dashboard for RFPs, vendors, and inbox
Backend: Node.js + Express + Prisma + SQLite
Frontend: React + Tailwind

Project Structure
aerchain-rfp/
│
├── backend/
│   ├── src/
│   │   ├── routes/ (API Endpoints)
│   │   ├── ai.js (OpenAI logic)
│   │   ├── db.js (Prisma client)
│   ├── prisma/
│   │   └── schema.prisma
│   └── dev.db (SQLite DB)
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── App.jsx
    └── package.json


How to Run the Project
1️⃣ Backend
cd backend
npm install
npx prisma generate
npm run dev


Backend runs at:
👉 http://localhost:4000

2️⃣ Frontend
cd frontend
npm install
npm run dev


Frontend runs at:
👉 http://localhost:5173

🔑 Environment Variables (Backend)

Create a .env inside /backend:
OPENAI_API_KEY=your-openai-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-google-app-password

🤖 AI Capabilities
✔ AI RFP Generation
Extracts summary, key points, and budget from raw text.

✔ AI Proposal Parsing
Extracts:
total price
delivery days
warranty
payment terms

✔ AI Proposal Evaluation
Compares proposals and gives:
Score (0–100)
Recommendation
Ranking of vendors

🧑‍💻 Tech Stack

Frontend-
React
Tailwind CSS

Backend-
Node.js
Express
Prisma ORM
SQLite Database

AI

OpenAI GPT-4o-mini
