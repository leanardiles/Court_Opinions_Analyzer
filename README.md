# Court Opinions Analyzer

ML-powered web application for analyzing US court decisions with human-in-the-loop verification.

**Capstone Project** | Katz School of Applied Sciences & Cardozo Law School (Yeshiva University)
**Team Members:** Leandro Ardiles, Divya Nambur Govindareddy, Tanaka Zvakaramba 
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
✅ **Project Lifecycle Workflow** (draft → ready → active)  
✅ **Parquet Upload & Removal** (one file per project)  
✅ **Dynamic Case Viewer** with on-demand modal  
✅ **Cardozo Law Branded UI** (professional design system)  
✅ **Module-Based Verification** with configurable research questions  
✅ **Two-Level Context System** (project-wide + module-specific)  
✅ **Mock AI Analysis** for testing validator workflow  
✅ **Validator Dashboard** showing assigned modules with progress  
✅ **Case-by-Case Validation Interface** with AI review and corrections  
✅ **Validation Completion Summary** with accuracy statistics  
✅ **Scholar Review Interface** with approve/reject workflow  
✅ **Trust Validator Bulk Approve** feature  
✅ **Feedback Library** for AI improvement (Round 2)  
🚧 **Real AI Integration** (Claude API - Coming next)  
🚧 **Multi-Round Feedback Loop** (Coming soon)

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

Current schema includes 5 main tables:

- **users** - User accounts with role-based access (admin/scholar/validator)
- **projects** - Research projects containing court case collections
- **court_cases** - Individual court opinions with metadata and AI analysis
- **assignments** - Links validators to cases for verification
- **verifications** - Stores validator answers and AI accuracy metrics

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
│   │   ├── utils/          # Helper functions
│   │   ├── database.py     # Database connection
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic schemas
│   │   └── main.py         # FastAPI app
│   ├── docs/               # Documentation
│   ├── venv/               # Virtual environment (not in git)
│   ├── database.db         # SQLite database
│   ├── init_db.py          # Database setup script
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── node_modules/       # Node packages (not in git)
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── PROJECT_PROGRESS.txt    # Development tracker
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
- [x] Project lifecycle workflow (draft/ready/active)
- [x] Status auto-update logic (draft→ready when parquet+scholar assigned)
- [x] Send to Scholar endpoint and UI (admin)
- [x] Removed Launch Project (workflow now module-based)
- [x] Enhanced dashboard with project ID, status badges
- [x] Display parquet filename in project detail view
- [x] Scholar email enrichment in project responses
- [x] AI model selection dropdown (GPT-5.2, Sonnet 4.5, Gemini 3.1)
- [x] API usage tracking module (tokens, cost, budget)
- [x] Role-based dashboard views (admin/scholar/validator)

**✅ Completed (Day 1-2 - Mar 1-2, 2026)**
- [x] Database schema for verification modules (8 new tables)
- [x] Module creation API (5 endpoints)
- [x] Scholar UI: Module creation form with 5 answer types
- [x] Module display with status badges
- [x] Module-specific context (markdown support)

**✅ Completed (Day 3 - Mar 2, 2026)**
- [x] Project context endpoints (create/update/get)
- [x] Project context editor modal with markdown support
- [x] Two-level context system (project-wide + module-specific)
- [x] Version tracking for AI reproducibility

**✅ Completed (Day 4 - Mar 2, 2026)**
- [x] Random case sampling per module (SQL random selection)
- [x] Validator assignment per module
- [x] Module status tracking (draft → sampling_complete → ready_for_validation)
- [x] Sample Cases and Assign Validator buttons
- [x] Validator selection modal
- [x] Module cards show sample count and validator

**✅ Completed (Day 5 - Mar 2, 2026)**
- [x] Mock AI analysis generation endpoint
- [x] Realistic dummy answers by answer type (yes/no, multiple choice, integer, text, date)
- [x] Random confidence scores (65-95%) and plausible reasoning
- [x] Launch AI Analysis button with loading states
- [x] Module status auto-updates (ready_for_validation → ai_analyzing → validation_in_progress)
- [x] Token/cost tracking in mock responses

**✅ Completed (Day 6 - Mar 3, 2026)**
- [x] Validator dashboard showing assigned modules across all projects
- [x] Module assignment cards with progress tracking (X/Y cases completed)
- [x] Validation interface for case-by-case AI review
- [x] AI analysis display with answer, reasoning, and confidence
- [x] Correct/Incorrect decision buttons
- [x] Correction form with reasoning (shown when marking incorrect)
- [x] Context modal displaying project and module guidance
- [x] Navigation between cases (Previous/Next buttons)
- [x] Progress tracking with visual progress bar
- [x] Validation submission endpoint with ValidationFeedback model
- [x] Role-based routing (validators → ValidatorDashboard)
- [x] Project access permissions for validators via assignments

**✅ Completed (Day 7 - Mar 3-5, 2026)**
- [x] Validation completion summary with statistics
- [x] Dropdown filters on validator dashboard (Status, Marked)
- [x] UI polish: button reorganization, AI Answer/Confidence side-by-side
- [x] Standardized section headers throughout validation interface
- [x] Responsive case information grid
- [x] View Context button moved to Research Question section
- [x] Cardozo logo added to header

**✅ Completed (Day 8 - Mar 5, 2026)**
- [x] Module review summary with AI accuracy metrics
- [x] Validator track record display (past validations, approval rate)
- [x] Corrections review interface (case-by-case approve/reject)
- [x] Side-by-side AI vs validator comparison
- [x] Trust Validator bulk approve with confirmation dialog
- [x] Feedback library integration (approved corrections)
- [x] Dynamic button states based on review progress
- [x] Filter reviewed corrections from pending list
- [x] Module assignments include correction counts

**✅ UI Improvements (Mar 2-5, 2026)**
- [x] Dashboard titles: Admin/Scholar/Validator Dashboard
- [x] Removed project launch button (module-based workflow)
- [x] Parquet viewer moved to on-demand modal
- [x] View Source File button for cleaner project pages
- [x] Full-screen modal with column selector and cases table
- [x] Removed project-level validator assignment display
- [x] Improved spacing in project detail header

**🚧 Next Steps (Day 9-10)**
- [ ] **Day 9:** Real AI integration (Claude API)
- [ ] **Day 10:** Round 2 & feedback loop with accuracy improvement metrics

**Progress: 8/10 days complete (80%)** 🎯

---

## 🚀 Future Enhancement Ideas

### Multi-Validator Support
- **Multiple validators per module** - Assign 2+ validators to review the same cases independently
- **Inter-annotator agreement metrics** - Calculate Cohen's Kappa score to measure consistency
- **Disagreement resolution workflow** - Scholar reviews cases where validators disagree
- **Validator quality tracking** - Monitor individual validator accuracy over time
- **Confidence scoring** - Weight validator corrections by their historical approval rate

### Enhanced Document Viewing
- **MS Word preview for validators** - Visual document rendering during case review
  - Implementation: Mammoth.js for free HTML conversion of .docx files
  - Requires: Original Word files stored alongside Parquet data (ZIP archive recommended)
  - Benefit: Validators can see formatted documents with original styling and structure
- **Split-pane viewer** - Display opinion text and validation form side-by-side
- **Annotation tools** - Highlight and annotate relevant passages in opinions

### Advanced AI Features
- **Multiple AI model comparison** - Run same cases through GPT, Claude, and Gemini simultaneously
- **Confidence calibration** - Track when AI is overconfident vs. underconfident
- **Active learning** - Prioritize uncertain cases for human review
- **Error pattern detection** - Identify systematic biases in AI responses
- **Custom fine-tuning** - Train model on domain-specific legal language

### Workflow Enhancements
- **Batch operations** - Upload multiple Parquet files, assign validators in bulk
- **Email notifications** - Alert validators when new assignments arrive
- **Progress dashboards** - Real-time analytics on project completion rates
- **Export functionality** - Download validated results as CSV/Excel for analysis
- **Audit trail** - Complete history of who changed what and when

### Research Features
- **Inter-coder reliability reports** - Statistical analysis of validator agreement
- **Confusion matrices** - Visualize AI error patterns by category
- **Longitudinal tracking** - Compare AI performance across multiple rounds
- **Custom metrics** - Define project-specific accuracy measures
- **Publication-ready exports** - Generate tables and figures for academic papers