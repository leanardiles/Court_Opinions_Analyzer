# Court Opinions Analyzer

ML-powered web application for analyzing US court decisions with human-in-the-loop verification.

**Capstone Project** | Katz School of Applied Sciences & Cardozo Law School (Yeshiva University)
**Developer:** Leandro Ardiles, Divya Nambur Govindareddy, Tanaka Zvakaramba 
**Status:** 🚧 In Development

---

## 📋 Project Overview

A web-based platform that enables legal scholars to analyze court opinions with AI assistance and human verification. The system implements a three-tier workflow:

1. **AI Analysis** → Automated analysis of court opinions
2. **TA Verification** → Human validators verify AI findings
3. **Scholar Review** → Legal scholars review verified results

### Key Features

✅ **Role-Based Access Control** (Admin, Scholar, Validator)  
✅ **JWT Authentication** with secure password hashing  
✅ **Database-Driven Architecture** (13-table relational schema)  
✅ **RESTful API** with auto-generated documentation  
✅ **Parquet File Processing** with automated parsing  
✅ **Project Management** with CRUD operations and scholar assignment  
✅ **Project Lifecycle Workflow** (draft → ready → active → launched)  
✅ **AI Model Selection** (GPT-5.2, Sonnet 4.5, Gemini 3.1)  
✅ **API Usage Tracking** (tokens, cost, budget monitoring)  
✅ **Module Creation** - Scholars can create research questions  
✅ **Dynamic Case Viewer** with column selector  
✅ **Cardozo Law Branded UI** (professional design system)  
🚧 **Project Context Management** (Coming next - Day 3)  
🚧 **Validator Assignment per Module** (Coming next - Day 4)  
🚧 **AI Integration** (Claude API) (Day 9)  
🚧 **Validator Verification Workflow** (Days 6-7)

---

## 🏗️ Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database:** SQLite (development) / PostgreSQL (production)
- **ORM:** SQLAlchemy
- **Authentication:** JWT (python-jose) + bcrypt
- **Data Processing:** Pandas, PyArrow (Parquet support)

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** React Hooks

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10 or higher
- Node.js 18+ and npm
- Git

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/leanardiles/Court_Opinions_Analyzer.git
cd Court_Opinions_Analyzer
```

**2. Backend Setup**
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (Git Bash):
source venv/Scripts/activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create database tables
python init_db.py
```

**3. Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install
```

### Running the Application

**Start Backend** (Terminal 1)
```bash
cd backend
source venv/Scripts/activate  # Windows Git Bash
uvicorn app.main:app --reload
```
Backend runs on: http://localhost:8000  
API Documentation: http://localhost:8000/docs

**Start Frontend** (Terminal 2)
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173

---

## 📊 Database Schema

Current schema includes 13 tables across 3 layers:

**Core Tables (5):**
- **users** - User accounts with role-based access (admin/scholar/validator)
- **projects** - Research projects with AI model selection and budget tracking
- **court_cases** - Individual court opinions from uploaded Parquet files
- **assignments** - (Legacy - being replaced by validator_assignments)
- **verifications** - (Legacy - being replaced by validation_feedback)

**Verification Module Tables (8):**
- **project_contexts** - Project-wide context for AI prompts (applies to all modules)
- **verification_modules** - Research questions with answer types and sample sizes
- **module_case_samples** - Random case samples per module
- **validator_assignments** - Links validators to specific module cases
- **ai_analyses** - AI responses with reasoning and confidence scores
- **validation_feedback** - Validator corrections and reasoning
- **feedback_library** - Scholar-approved corrections for AI improvement

Architecture supports:
- Two-level context system (project + module)
- Per-module validator assignment
- Multi-round AI improvement with feedback loops

See `backend/docs/DATABASE_SCHEMA.txt` for complete schema documentation.

---

## 🔐 Authentication

### API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Create new user | Public |
| POST | `/auth/login` | Get JWT token | Public |
| GET | `/auth/me` | Get current user | Authenticated |

### Testing Authentication (Swagger UI)

1. Navigate to http://localhost:8000/docs
2. Register a user via `POST /auth/register`:
   ```json
   {
     "email": "admin@example.com",
     "password": "yourpassword",
     "role": "admin"
   }
   ```
3. Login via `POST /auth/login` to get JWT token
4. Use token for authenticated endpoints

### User Roles

- **Admin:** Create projects, upload data, assign scholars, manage system
- **Scholar:** Manage assigned projects, assign validators, review results
- **Validator:** Verify AI-generated analyses for assigned cases

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cardozo.edu | admin12345 |
| Scholar | scholar1@cardozo.edu | scholar123 |
| Validator (TA1) | ta1@cardozo.edu | validator123 |
| Validator (TA2) | ta2@cardozo.edu | validator123 |

---

## 📁 Project Structure

```
Court_Opinions_Analyzer/
├── backend/
│   ├── app/
│   │   ├── core/           # Configuration
│   │   ├── routers/        # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── projects.py
│   │   │   ├── uploads.py
│   │   │   └── modules.py  # 🆕 Module management
│   │   ├── utils/          # Helper functions
│   │   ├── database.py     # Database connection
│   │   ├── models.py       # SQLAlchemy models (13 tables)
│   │   ├── schemas.py      # Pydantic schemas
│   │   └── main.py         # FastAPI app
│   ├── docs/               # Documentation
│   ├── venv/               # Virtual environment (not in git)
│   ├── database.db         # SQLite database
│   ├── init_db.py          # Database setup script
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js   # API client with auth
│   │   ├── components/
│   │   │   └── Header.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ProjectDetailPage.jsx  # 🆕 Module creation UI
│   │   │   ├── UploadPage.jsx
│   │   │   └── ViewCasesPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── node_modules/       # Node packages (not in git)
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── IMPLEMENTATION_SCHEDULE.txt  # 🆕 10-day sprint plan
├── PROJECT_PROGRESS.txt         # Development tracker
└── README.md
```

---

## 🛠️ Development Workflow

### Common Commands

**Backend:**
```bash
# Start server
uvicorn app.main:app --reload

# Reset database
python init_db.py --drop
python init_db.py

# Add new dependency
pip install package-name
pip freeze > requirements.txt
```

**Frontend:**
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Add new dependency
npm install package-name
```

**Git:**
```bash
# Check status
git status

# Commit changes
git add .
git commit -m "feat: description"
git push
```

---

## 📈 Development Progress

**✅ Completed (Session 1 - Feb 25, 2026)**
- [x] Project setup and repository initialization
- [x] Complete database schema (5 tables)
- [x] JWT authentication system
- [x] User registration and login
- [x] Role-based access control
- [x] API documentation (Swagger UI)

**✅ Completed (Session 2 - Feb 26, 2026)**
- [x] Admin: Project management (CRUD operations)
- [x] Admin: Parquet file upload system
- [x] Admin: Case listing endpoint
- [x] Complete frontend UI with Cardozo design system
- [x] Dashboard with project management
- [x] Upload page for Parquet files
- [x] Case viewer with dynamic column selector
- [x] Reusable Header component with dual navigation

**✅ Completed (Session 3 - Feb 27, 2026)**
- [x] End-to-end testing and bug fixes
- [x] Delete project functionality with cascade
- [x] Clickable project cards navigation
- [x] ProjectDetailPage with cases view
- [x] Remove Parquet file functionality
- [x] Scholar assignment to projects
- [x] UI/UX improvements (login, modal, dashboard)
- [x] Created scholar1 and ta2 test users
- [x] Scholar visibility in dashboard and project details

**✅ Completed (Session 4 - Mar 1, 2026 - Part 1)**
- [x] Project lifecycle workflow (draft/ready/active/launched)
- [x] Status auto-update logic (draft→ready when parquet+scholar assigned)
- [x] Send to Scholar endpoint and UI (admin)
- [x] Launch Project endpoint and UI (scholar)
- [x] Enhanced dashboard with project ID, status badges, dates
- [x] Display parquet filename in project detail view
- [x] Scholar email enrichment in project responses
- [x] Compact column selector spacing
- [x] AI model selection dropdown (GPT-5.2, Sonnet 4.5, Gemini 3.1)
- [x] API usage tracking module (tokens, cost, budget)
- [x] Role-based dashboard views (admin/scholar/validator)
- [x] Delete project from detail page
- [x] Assign/Unassign scholar functionality

**✅ Completed (Day 1-2 - Mar 1, 2026 - Part 2)**
- [x] Database schema for verification modules (8 new tables)
- [x] Module creation API (5 endpoints: create, list, get, update, delete)
- [x] Pydantic schemas for modules and contexts
- [x] Scholar UI: Module creation form
- [x] Module display with status badges
- [x] Support for 5 answer types (yes/no, multiple choice, integer, text, date)
- [x] Module-specific context (markdown)
- [x] Configurable sample sizes per module

**🚧 Next Steps (Day 3-10 - Verification Workflow)**
- [ ] **Day 3:** Project context management (overarching context for all modules)
- [ ] **Day 4:** Case sampling & validator assignment (per module)
- [ ] **Day 5:** Mock AI analysis generation
- [ ] **Day 6-7:** Validator dashboard and verification UI
- [ ] **Day 8:** Scholar review interface for validator corrections
- [ ] **Day 9:** Real AI integration (Claude API)
- [ ] **Day 10:** Round 2 & feedback loop for AI improvement

See `IMPLEMENTATION_SCHEDULE.txt` for detailed 10-day sprint plan.