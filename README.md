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
Python, nvcl-kit, pytsg, PostgreSQL, FastAPI, Streamlit, Docker Compose (will change any stack based on further discussions)  

## Setup

1. Create and activate the conda environment:
   conda create -n gswa python=3.10 -y
   conda activate gswa
   pip install -r requirements.txt
   
2. Start the full system:
   docker-compose up

3. Run the data pull:
   python etl/fetch_holes.py

## Branching Strategy
Never push directly to main. Always create a feature branch:

    git checkout -b feature/your-task-name
    git push origin feature/your-task-name

Then open a pull request and get one teammate to review before merging.

    
