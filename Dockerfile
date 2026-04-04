# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
# Output: /app/frontend/dist/

# Stage 2: Python backend + built frontend
FROM python:3.12-slim
WORKDIR /app

# System deps for asyncpg / psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Application code
COPY pyproject.toml ./
COPY calc_engine/ ./calc_engine/
COPY backend/ ./backend/
COPY alembic/ ./alembic/
COPY alembic.ini ./
COPY scripts/ ./scripts/

# Built frontend from stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

EXPOSE 8000

RUN chmod +x scripts/start.sh
CMD ["./scripts/start.sh"]
