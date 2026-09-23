# GSWA HyLogger Industry Adoption

CITS5553 Data Science Capstone Project, Group 6, Semester 2 2026.

We are building an automated geological intelligence pipeline that translates GSWA's open HyLogger hyperspectral drill-core dataset into practitioner-ready insight.

The system processes hyperspectral drill-core data to identify mineralogical transitions, classify geological intervals, surface unusual zones, and provide an interface for exploring processed borehole information.

---

# Team

- Raja Venkata Shandilya Puram (24944809)
- Simrat Sandhu (23628445)
- Zhenghao Cui (24483898)
- Dulya Murage (24910402)
- Sahaj Jayeshbhai Patel (24557489)
- Likhita Chowdary Moparthi (24480549)

---

# Technology Stack

## Backend and Data Pipeline

- Python
- nvcl-kit
- pytsg
- pandas
- NumPy
- PostgreSQL / PostGIS
- FastAPI
- Docker Compose

## Frontend

- React
- Vite
- React Router
- Axios
- Framer Motion
- Recharts

The frontend is a custom React application.

---

# System Architecture

```
GSWA NVCL HyLogger Dataset
            |
            v
     nvcl-kit Data Retrieval
            |
            v
     SWIR Data Processing
            |
            v
 Mineral Percentage Conversion
            |
            v
   Rule-based Classification
            |
            v
 PostgreSQL / PostGIS Database
            |
            v
        FastAPI API
            |
            v
      React Frontend
```

---

# Project Structure

```
GSWA-hylogger-Industry-Adoption/

├── api/
│   ├── main.py              FastAPI application
│   └── db.py                Database connection

├── classifier/
│   └── rules_baseline.py    Baseline geological classifier

├── database/
│   └── schema.sql           PostgreSQL/PostGIS schema

├── etl/
│   ├── fetch_holes.py       Download NVCL HyLogger data
│   ├── convert_percentages.py
│   └── load_database.py     Populate database tables

├── web/
│   └── React frontend

├── notebooks/
│
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```

---

# Setup Instructions

## 1. Install Python Dependencies

Create and activate the Python environment:

```bash
conda create -n gswa python=3.10 -y

conda activate gswa

pip install -r requirements.txt
```

---

# 2. Start Backend Services

From the project root:

```bash
docker compose up
```

This starts:

- PostgreSQL/PostGIS database
- FastAPI backend

The API will run at:

```
http://localhost:8000
```

Health check:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "healthy"
}
```

---

# 3. Download GSWA HyLogger Data

Run:

```bash
python etl/fetch_holes.py
```

This retrieves selected GSWA borehole SWIR scan data using nvcl-kit.

Generated file:

```
data/raw_holes.csv
```

---

# 4. Convert Spectral Data into Interval Features

Run:

```bash
python etl/convert_percentages.py
```

This converts raw mineral classifications into interval-level mineral percentage features.

Generated files:

```
data/mineral_percentages.csv

data/interval_quality.csv
```

---

# 5. Run Baseline Classification

Run:

```bash
python classifier/rules_baseline.py
```

This applies the baseline rule-based classifier to processed intervals.

Generated file:

```
data/classified_intervals.csv
```

---

# 6. Load Processed Data into Database

Run:

```bash
python etl/load_database.py
```

This populates PostgreSQL with:

- Borehole metadata
- Classified geological intervals

The FastAPI backend uses this database to provide live data to the frontend.

---

# API Endpoints

The FastAPI backend provides the following endpoints:

| Endpoint | Description |
|---|---|
| `/health` | API health check |
| `/holes` | Retrieve all available boreholes |
| `/holes/{hole_id}` | Retrieve metadata for one borehole |
| `/holes/{hole_id}/intervals` | Retrieve classified intervals for a borehole |

Example:

```bash
curl http://localhost:8000/holes
```

Example response:

```json
{
  "count": 20,
  "holes": [
    {
      "hole_id": "05GJD001",
      "latitude": -33.72188606,
      "longitude": 118.96361011
    }
  ]
}
```

---

# Running the Frontend

The React application is located inside:

```
web/
```

Navigate into the frontend folder:

```bash
cd web
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Vite will provide a local address:

```
http://localhost:5173
```

Open this address in a browser.

---

# Frontend Structure

```
web/src/

├── api/
│   └── client.js              Axios API client

├── components/
│   ├── ui/                    Shared UI components
│   ├── layout/                Navigation and layouts
│   ├── holes/                 Borehole components
│   └── charts/                Data visualisations

├── pages/
│   ├── ExplorerPage.jsx
│   └── ResultsPage.jsx

├── styles/
│   ├── tokens.css
│   └── theme.js
```

---

# Development Workflow

Do not push directly to main.

Create a feature branch:

```bash
git checkout -b feature/your-task-name
```

Push the branch:

```bash
git push origin feature/your-task-name
```

Create a pull request and request teammate review before merging.

---

# Current Implementation Status

Completed:

✅ GSWA NVCL HyLogger data retrieval  
✅ SWIR data processing pipeline  
✅ Mineral percentage conversion  
✅ Interval quality analysis  
✅ Baseline rule-based classification  
✅ PostgreSQL/PostGIS database setup  
✅ FastAPI backend endpoints  
✅ React frontend API integration  
✅ Live borehole and classification data retrieval  

---

# Future Development

Planned improvements include:

- Advanced spectral similarity search
- Improved geological classification methods
- Deep learning-based property prediction
- Additional interactive geological visualisations
- Enhanced industry-focused exploration workflows