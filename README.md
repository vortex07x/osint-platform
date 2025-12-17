# OSINT Intelligence Platform

AI-powered system for mapping digital footprints and analyzing OSINT data.

## Tech Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** FastAPI (Python)
- **Databases:** PostgreSQL, Neo4j, Redis
- **Scraping:** Playwright
- **AI/ML:** TensorFlow, spaCy, OpenCV

## Getting Started

### Prerequisites
- Docker Desktop installed
- Python 3.11+
- Node.js 18+

### Setup

1. Clone the repository
2. Start databases:
```bash
docker-compose up -d
```

3. Backend setup:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

4. Frontend setup:
```bash
cd frontend
npm install
```

## Project Structure
```
osint-platform/
├── frontend/       - React application
├── backend/        - FastAPI backend
├── scrapers/       - Data collection modules
├── ai-engine/      - ML/AI processing
├── workers/        - Background job workers
└── docs/           - Documentation
```

## Development Status

Phase 1: Foundation ✅
Phase 2: Backend Development (In Progress)