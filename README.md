# Court Opinions Analyzer

ML-powered web application for analyzing US court decisions on the Purcell Principle with human-in-the-loop verification.

**Capstone Project** | Cardozo Law School - Katz School  
**Developer:** Leandro Ardiles  
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
✅ **Database-Driven Architecture** (5-table relational schema)  
✅ **RESTful API** with auto-generated documentation  
🚧 **Parquet File Processing** (Coming soon)  
🚧 **AI Integration** (Claude/GPT-4) (Coming soon)  
🚧 **Data Visualization Dashboard** (Coming soon)

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

- **Admin:** Create projects, upload data, assign validators
- **Scholar:** Review validator work, access analytics
- **Validator:** Verify AI-generated analyses for assigned cases

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

**🚧 In Progress / Next Steps**
- [ ] Admin: Project creation endpoint
- [ ] Admin: Parquet file upload and parsing
- [ ] Admin: Case assignment workflow
- [ ] Validator: Case viewing interface
- [ ] Validator: Verification submission
- [ ] AI integration (Claude/GPT-4)
- [ ] Scholar: Review dashboard
- [ ] Data visualization and analytics

See `PROJECT_PROGRESS.txt` for detailed progress tracking.

---

## 📚 Documentation

- **Database Schema:** `backend/docs/DATABASE_SCHEMA.txt`
- **Schema Changelog:** `backend/docs/CHANGELOG.md`
- **API Docs:** http://localhost:8000/docs (when server running)
- **Development Guide:** `STARTUP_GUIDE.txt`
- **Progress Tracker:** `PROJECT_PROGRESS.txt`

---

## 🧪 Testing

**Manual API Testing:**
1. Start backend server
2. Navigate to http://localhost:8000/docs
3. Use Swagger UI to test endpoints

**Example: Create a User**
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "role": "admin"
  }'
```

---

## 🤝 Contributing

This is a capstone project for academic purposes. 

### Development Standards
- Follow conventional commits format (`feat:`, `fix:`, `docs:`, etc.)
- Update `PROJECT_PROGRESS.txt` after each session
- Document schema changes in `backend/docs/CHANGELOG.md`
- Keep `requirements.txt` and `package.json` up to date

---

## 📝 License

This project is developed as part of academic coursework at Cardozo Law School.

---

## 🙏 Acknowledgments

- **Institution:** Cardozo Law School - Katz School
- **Project Type:** Capstone Project
- **Focus:** Legal Tech, AI-Assisted Analysis, Human-in-the-Loop Systems

---

## 📧 Contact

**Developer:** Leandro Ardiles  
**Repository:** [github.com/leanardiles/Court_Opinions_Analyzer](https://github.com/leanardiles/Court_Opinions_Analyzer)

---

**Last Updated:** February 25, 2026