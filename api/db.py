import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://gswa:gswa123@localhost:5433/hylogger")


def get_connection():
    """Open a new connection to the database. Caller is responsible for closing it."""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)