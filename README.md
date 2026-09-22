# GSWA HyLogger Industry Adoption

CITS5553 Data Science Capstone Project, Group 6, Semester 2 2026.

We are building an automated geological intelligence pipeline that translates GSWA's open HyLogger hyperspectral drill-core dataset into practitioner-ready insight. The system detects mineralogical transitions, surfaces unusual intervals, finds similar intervals across holes, and predicts physical rock properties from spectral data.

## Team
- Raja Venkata Shandilya Puram (24944809)
- Simrat Sandhu (23628445)
- Zhenghao Cui (24483898)
- Dulya Murage (24910402)
- Sahaj Jayeshbhai Patel (24557489)
- Likhita Chowdary Moparthi (24480549)

## Tech Stack
Backend and data: Python, nvcl-kit, pytsg, pandas, PostgreSQL, FastAPI, Docker Compose.

Frontend: React with Vite, React Router, Framer Motion, Recharts and Axios. The
site is a custom React application, not Streamlit.

## Setup

1. Create and activate the conda environment:
   conda create -n gswa python=3.10 -y
   conda activate gswa
   pip install -r requirements.txt
   
2. Start the full system:
   docker-compose up

3. Run the data pull:
   python etl/fetch_holes.py


## Running the frontend

The web application lives in `web/`. It runs on its own and does not need the
API or the database to be up, since it falls back to placeholder data.

    cd web
    npm install
    npm run dev

Vite prints a local address, usually http://localhost:5173. Open that in a
browser. The dev server hot reloads, so leave it running while you work.

Other commands, all from inside `web/`:

    npm run build     production build into web/dist
    npm run preview   serve the production build locally
    npm run lint      oxlint over src/

Node 20 or newer is required. Check with `node -v` and `npm -v`.

### How the frontend is laid out

    web/src/styles/tokens.css    colour, type, spacing and motion tokens
    web/src/styles/theme.js      the same chart values, for Recharts
    web/src/components/ui        shared pieces: Button, Card, Badge and so on
    web/src/components/layout    nav bar, footer, page transitions
    web/src/components/holes     hole card and the shared hole selector
    web/src/components/charts    Recharts components
    web/src/pages                one file per route
    web/src/data                 placeholder data and the shared vocabularies

Read `web/src/styles/tokens.css` before adding styles. Every colour, spacing
step and font is defined there, so reuse a token rather than introducing a new
hard coded value. Import shared components from `web/src/components/ui/index.js`.

The pages currently read from `web/src/data/placeholderData.js`, which returns
the same shapes the API returns. Task 9 replaces that module with an Axios
client and nothing else has to change.

## Branching Strategy
Never push directly to main. Always create a feature branch:

    git checkout -b feature/your-task-name
    git push origin feature/your-task-name

Then open a pull request and get one teammate to review before merging.

    
