# ── Build stage ───────────────────────────────────────────────────────────────
# Installs dependencies + pre-downloads the ONNX embedding model.
# Uses python:3.12-slim + fastembed (ONNX, ~200 MB) — no PyTorch needed.
FROM python:3.12-slim AS builder

WORKDIR /build

# gcc + libpq-dev required by pdfminer.six (pdfplumber) and psycopg2
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install to the DEFAULT Python location (NOT --prefix) so the next
# RUN step can import the packages without any PYTHONPATH tricks.
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the fastembed ONNX model so Railway starts instantly
# without a network download on first request.
RUN python -c "\
import os; \
os.makedirs('/model-cache', exist_ok=True); \
from fastembed import TextEmbedding; \
m = TextEmbedding(model_name='sentence-transformers/all-MiniLM-L6-v2', cache_dir='/model-cache'); \
list(m.embed(['warmup'])); \
print('Model cached successfully')"


# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Copy all installed Python packages + executables from builder
COPY --from=builder /usr/local/lib   /usr/local/lib
COPY --from=builder /usr/local/bin   /usr/local/bin

# Copy pre-downloaded ONNX model cache
COPY --from=builder /model-cache /model-cache

# Non-root user for security
RUN useradd --no-create-home --shell /bin/false appuser
USER appuser

# Copy application source
COPY --chown=appuser:appuser app/ ./app/

# Tell fastembed where the pre-baked model lives
ENV FASTEMBED_CACHE_PATH=/model-cache

EXPOSE 8000

# Railway injects $PORT dynamically — fall back to 8000 for local dev.
# Use 1 worker on Railway Trial (limited RAM); scale up on paid plans.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
