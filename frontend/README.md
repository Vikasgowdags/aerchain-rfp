# AI-Powered RFP Management System

_Aerchain – Take Home Assignment_

## 1. Overview

This project is an **AI-powered RFP (Request For Proposal) management system** that simulates a lightweight version of an enterprise procurement tool.

It covers the full flow described in the problem statement:

- Ingest free-form RFP text (from emails / notes)
- Create and manage **RFPs**
- Store and manage **Vendors**
- Capture **Proposals** from vendors
- **Send and receive emails** using a real mailbox
- Use **AI (OpenAI)** to:
  - Convert unstructured text → structured RFP
  - Generate **AI summary and key points** for each RFP
  - Parse vendor emails into structured proposal fields
  - Score and analyse proposals and recommend options

The goal is to show **how I think, code, and design systems** rather than focus only on UI polish.

---

## 2. High-Level Architecture

**Frontend** (React + Vite)

- Single-page **dashboard**:
  - Sidebar: RFP Manager, Vendors, Inbox
  - Main panels:
    - Create RFP from free text (AI)
    - Create Vendor
    - Create Proposal
    - AI insights for selected RFP
    - RFP list + Proposals + Inbox

**Backend** (Node.js + Express)

- REST API under `/api`
- Routes:
  - `/api/rfps` – CRUD for RFPs
  - `/api/rfps/from-text` – AI-generated RFP from free text
  - `/api/vendors` – vendor management
  - `/api/proposals` – proposal creation + AI scoring
  - `/api/email/send` – send emails to vendors (nodemailer)
  - `/api/email/inbox` – fetch recent emails via IMAP

**Database** (SQLite via Prisma)

- Models:
  - `RFP` – core request
  - `RFPItem` – line items of RFP
  - `Vendor` – suppliers
  - `Proposal` – vendor responses + AI fields

**External services**

- **Email send**: SMTP (Gmail) via `nodemailer`
- **Email receive**: IMAP (Gmail) via `imapflow`
- **AI**: OpenAI via `openai` SDK

Data flow (simplified):

1. User enters free-text RFP → Backend calls OpenAI → structured RFP is saved in DB.
2. User creates vendors → stored in DB.
3. User creates proposals (optionally using content from vendor email) → backend calls OpenAI to:
   - parse pricing / delivery fields
   - assign an AI score + short AI analysis.
4. System can fetch recent emails from the configured mailbox to simulate real-world RFQ email flow.

---

## 3. Tech Stack

**Frontend**

- React (Vite)
- Modern dark dashboard UI
- Fetch-based API calls to backend

**Backend**

- Node.js + Express (ES modules)
- Prisma ORM
- SQLite (file-based, easy to run for assignment)
- Nodemailer + IMAPFlow
- OpenAI SDK

---

## 4. Setup & Running Locally

### 4.1 Prerequisites

- Node.js (v18+ recommended)
- npm
- An OpenAI API key
- A test Gmail account (or SMTP/IMAP compatible mailbox)

---

### 4.2 Environment Variables

Create a `.env` file inside `backend/`:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Database (Prisma using SQLite)
DATABASE_URL="file:./dev.db"

# Email configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=vikkivikas2603@gmail.com
EMAIL_PASS=your_app_password    # App password

# IMAP configuration
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=vikkivikas2603@gmail.com
IMAP_PASS=your_app_password
```

## 5. Running the Application

### Backend

```sh
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```
