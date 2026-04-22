# ── Build stage ───────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

# Install build dependencies (pdfplumber needs pdfminer which needs gcc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Runtime stage ─────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Copy only the installed packages from the builder
COPY --from=builder /install /usr/local

# Non-root user for security
RUN useradd --no-create-home --shell /bin/false appuser
USER appuser

# Copy application source
COPY --chown=appuser:appuser app/ ./app/

EXPOSE 8000

# Use 2 workers per CPU core; tune with $WEB_CONCURRENCY
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", \
     "--workers", "2", "--loop", "uvloop", "--http", "h11"]
