# Database Schema Changelog

All notable changes to the database schema will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [v02.25.2026] - 2026-02-25

### Added
- **Initial complete database schema with 5 tables:**
  - `users` - User accounts (admin, scholar, validator roles)
  - `projects` - Research projects with Parquet file metadata
  - `court_cases` - Individual court opinions from Parquet files
  - `assignments` - Links validators to cases for verification
  - `verifications` - Stores validator answers and AI accuracy metrics

### Schema Details
- User roles: admin, scholar, validator (using SQLAlchemy Enum)
- Assignment statuses: pending, in_progress, completed, reviewed
- JSON fields for flexible data storage:
  - `court_cases.ai_analysis` - AI's answers to 9 questions
  - `court_cases.judges_names` - Array of judge names
  - `verifications.validator_answers` - Validator's verification data
- Foreign key relationships with cascade deletes
- Timestamps on all tables (created_at, updated_at)
- Support for multi-tier validator workflow

### Database Engine
- SQLite for development (database.db)
- Designed to switch to PostgreSQL for production

---

## Template for Future Changes

```markdown
## [vMM.DD.YYYY] - YYYY-MM-DD

### Added
- New tables, columns, or relationships

### Changed
- Modified columns, renamed fields, altered types

### Removed
- Deleted tables, columns, or constraints

### Fixed
- Bug fixes in schema design

### Migration Notes
- Special instructions for updating existing databases
```

---

## Notes

- Schema versions are stored in `schema_versions/` folder
- Current schema is always in `DATABASE_SCHEMA.txt` at docs root
- Use `python init_db.py --drop` and `python init_db.py` to reset during development
- For production, use Alembic migrations (to be implemented in Week 5+)
