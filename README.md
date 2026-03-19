# Court Opinions Analyzer

AI-powered web application for analyzing court opinions with in-context learning and human-in-the-loop verification.

**Capstone Project** | Katz School of Applied Sciences & Cardozo Law School (Yeshiva University)
**Team Members:** Leandro Ardiles, Divya Nambur Govindareddy, Tanaka Zvakaramba 
**Status:** 🚧 In Development

---

## 📋 Project Overview

A web-based platform that enables legal scholars to analyze court opinions with AI assistance and human verification. The system implements a three-tier workflow:

1. **AI Analysis** → Automated analysis of court opinions using Llama 3.1 (Ollama) or mock AI
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
✅ **AI Provider Selection** (Dummy AI, Llama 3.1 8B, Llama 3.1 70B)  
✅ **Real AI Integration** with Ollama/Llama 3.1  
✅ **Mock AI Analysis** for testing validator workflow  
✅ **Validator Dashboard** showing assigned modules with progress  
✅ **Case-by-Case Validation Interface** with AI review and corrections  
✅ **Validation Completion Summary** with accuracy statistics  
✅ **Scholar Review Interface** with approve/reject workflow  
✅ **Trust Validator Bulk Approve** feature  
✅ **Feedback Library** for AI improvement (Round 2)  
🚧 **Multi-Round Feedback Loop** (Coming soon)

---

## 🏗️ Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database:** SQLite (development) / PostgreSQL (production)
- **ORM:** SQLAlchemy
- **Authentication:** JWT (python-jose) + bcrypt
- **Data Processing:** Pandas, PyArrow (Parquet support)
- **AI Integration:** Ollama (Llama 3.1 8B/70B), requests

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** React Hooks

### AI Models
- **Local Inference:** Ollama (Meta Llama 3.1)
- **Models:** Llama 3.1 8B (laptop), Llama 3.1 70B (GPU)
- **Mock AI:** Built-in dummy responses for testing

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10 or higher
- Node.js 18+ and npm
- Git
- **Ollama** (for real AI analysis) - [Download here](https://ollama.com/download)

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

# Create test users
python create_test_users.py
```

**3. Ollama Setup (for Real AI Analysis)**
```bash
# Install Ollama from https://ollama.com/download

# Download Llama 3.1 8B model (~4.7 GB)
ollama pull llama3.1:8b

# Optional: Download Llama 3.1 70B (~40 GB, requires GPU)
ollama pull llama3.1:70b

# Verify Ollama is running
curl http://localhost:11434
# Should return: "Ollama is running"
```

**4. Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install
```

### Running the Application

**Start Ollama** (Terminal 1)
```bash
# Ollama usually auto-starts on Windows/Mac
# Check if running:
curl http://localhost:11434

# If not running, start manually:
ollama serve
```

**Start Backend** (Terminal 2)
```bash
cd backend
source venv/Scripts/activate  # Windows Git Bash
uvicorn app.main:app --reload
```
Backend runs on: http://localhost:8000  
API Documentation: http://localhost:8000/docs

**Start Frontend** (Terminal 3)
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173

---

## 📊 Database Schema

Current schema includes 13 tables:

- **users** - User accounts with role-based access (admin/scholar/validator)
- **projects** - Research projects containing court case collections
- **court_cases** - Individual court opinions with metadata
- **verification_modules** - Research questions for AI analysis
- **module_case_samples** - Random case samples per module
- **validator_assignments** - Links validators to cases for verification
- **ai_analyses** - AI-generated answers with reasoning and confidence
- **validation_feedback** - Validator corrections and scholar review
- **feedback_library** - Approved corrections for Round 2 training
- **project_contexts** - Project-wide guidance for AI
- And 3 more supporting tables

See `backend/docs/DATABASE_SCHEMA.txt` for complete schema documentation.

---

## 🔐 Authentication

### API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Create new user | Public |
| POST | `/auth/login` | Get JWT token | Public |
| GET | `/auth/me` | Get current user | Authenticated |

### User Roles

- **Admin:** Create projects, upload data, assign scholars, manage system
- **Scholar:** Manage assigned projects, create modules, assign validators, review results
- **Validator:** Verify AI-generated analyses for assigned cases

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cardozo.edu | admin12345 |
| Scholar | scholar1@cardozo.edu | scholar123 |
| Validator (TA1) | ta1@cardozo.edu | validator123 |
| Validator (TA2) | ta2@cardozo.edu | validator123 |

---

## 🤖 AI Provider Options

When creating a module, scholars can choose from:

1. **🎭 Dummy AI** - Instant mock responses for testing validator workflow
2. **🦙 Llama 3.1 8B** - Real AI analysis (local, free, runs on laptop)
3. **🦙 Llama 3.1 70B** - Advanced model (requires GPU, placeholder for now)

**AI Provider is locked after module creation** to ensure data integrity across all cases in a module.

---

## 📁 Project Structure
```
Court_Opinions_Analyzer/
├── backend/
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── utils/          # Helper functions
│   │   │   └── ai_service.py   # AI integration layer
│   │   ├── database.py     # Database connection
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic schemas
│   │   └── main.py         # FastAPI app
│   ├── uploads/            # Uploaded Parquet files
│   ├── venv/               # Virtual environment (not in git)
│   ├── database.db         # SQLite database
│   ├── init_db.py          # Database setup script
│   ├── create_test_users.py  # Test user creation
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/          # React pages
│   │   ├── components/     # Reusable components
│   │   ├── api/            # API client
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
python init_db.py

# Recreate test users
python create_test_users.py

# Add new dependency
pip install package-name
pip freeze > requirements.txt
```

**Ollama:**
```bash
# Check status
curl http://localhost:11434

# List downloaded models
ollama list

# Test model
ollama run llama3.1:8b "Hello!"

# Remove model
ollama rm llama3.1:70b
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

**✅ Completed (Sessions 1-4)**
- [x] Complete authentication system with JWT
- [x] Database schema (13 tables)
- [x] Project management with Parquet upload
- [x] Role-based dashboards
- [x] Project lifecycle workflow
- [x] Scholar assignment

**✅ Completed (Days 1-3)**
- [x] Module creation with 5 answer types
- [x] Two-level context system (project + module)
- [x] Case sampling and validator assignment

**✅ Completed (Days 4-5)**
- [x] Mock AI analysis generation
- [x] Realistic dummy responses by answer type
- [x] Module status tracking

**✅ Completed (Days 6-7)**
- [x] Validator dashboard with progress tracking
- [x] Case-by-case validation interface
- [x] AI review with correct/incorrect decisions
- [x] Validation completion summary
- [x] UI polish and Cardozo branding

**✅ Completed (Day 8)**
- [x] Scholar review interface
- [x] Approve/reject corrections workflow
- [x] Trust Validator bulk approve
- [x] Feedback library integration
- [x] Dynamic button states

**✅ Completed (Day 8.5 - Mar 19, 2026)**
- [x] Ollama/Llama 3.1 integration
- [x] AI provider selection dropdown (3 options)
- [x] AIService abstraction layer with multiple providers
- [x] Real AI analysis with Llama 3.1 8B
- [x] AI provider locked after module creation
- [x] In-context learning foundation (feedback examples in prompts)

**🚧 Next Steps (Days 9-10)**
- [ ] **Day 9:** Progressive in-context learning (4 validation rounds)
- [ ] **Day 10:** Multi-round feedback loop with accuracy improvement metrics
- [ ] Demo preparation and final testing

**Progress: 8.5/10 days complete (85%)** 🎯

---

## 🚀 Future Enhancement Ideas

### Module Management
- **Clone Module** - Duplicate a module with option to change AI provider
  - Use case: Test same research question with different AI models
  - Creates new module preserving all settings (question, answer type, sample size)
  - Allows selecting different AI provider for comparison
  - Enables A/B testing: Dummy AI vs. Llama 8B vs. Llama 70B
  - Supports research: "How does accuracy differ between models?"
- **Module templates** - Save frequently-used module configurations
- **Batch module creation** - Create multiple similar modules at once

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
- **Multiple AI model comparison** - Run same cases through different models simultaneously
- **API-based models** - Add Claude (Anthropic) and GPT-4 (OpenAI) as provider options
- **Fine-tuned models** - Train custom Llama on approved corrections (after 200+ examples)
- **Confidence calibration** - Track when AI is overconfident vs. underconfident
- **Active learning** - Prioritize uncertain cases for human review
- **Error pattern detection** - Identify systematic biases in AI responses

### Workflow Enhancements
- **Batch operations** - Upload multiple Parquet files, assign validators in bulk
- **Email notifications** - Alert validators when new assignments arrive
- **Progress dashboards** - Real-time analytics on project completion rates
- **Export functionality** - Download validated results as CSV/Excel/JSONL for analysis
- **Audit trail** - Complete history of who changed what and when
- **Project cloning** - Duplicate entire projects with all modules and settings

### Research Features
- **Inter-coder reliability reports** - Statistical analysis of validator agreement
- **Confusion matrices** - Visualize AI error patterns by category
- **Longitudinal tracking** - Compare AI performance across multiple rounds
- **Model comparison reports** - Side-by-side accuracy for different AI providers
- **Custom metrics** - Define project-specific accuracy measures
- **Publication-ready exports** - Generate tables and figures for academic papers
- **Training data export** - Export approved corrections as JSONL for fine-tuning

---

## 📚 Documentation

- **API Documentation:** http://localhost:8000/docs (auto-generated Swagger UI)
- **Database Schema:** `backend/docs/DATABASE_SCHEMA.txt`
- **Development Log:** `PROJECT_PROGRESS.txt`

---

## 🤝 Contributing

This is a capstone project for academic purposes. For questions or collaboration:
- **Leandro Ardiles** - [GitHub](https://github.com/leanardiles)
- **Course:** MS in Applied Data Science, Katz School
- **Partner:** Cardozo School of Law

---

## 📄 License

This project is developed as part of academic coursework at Yeshiva University.