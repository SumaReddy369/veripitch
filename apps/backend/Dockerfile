# ── Build stage ───────────────────────────────────────────────────────────────
# Uses python:3.12-slim; fastembed pulls onnxruntime (~200 MB) instead of
# PyTorch (~2.5 GB), keeping the final image well under Railway's 4 GB limit.
FROM python:3.12-slim AS builder

WORKDIR /build

# gcc is needed by pdfminer.six (pdfplumber dependency)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Pre-download the fastembed ONNX model into the image so Railway starts
# instantly without a network download on first request.
# The model caches into ~/.cache/fastembed by default; we redirect to /model-cache
# so the runtime stage can copy it.
ENV FASTEMBED_CACHE_PATH=/model-cache
RUN python - <<'EOF'
from fastembed import TextEmbedding
import os
os.makedirs("/model-cache", exist_ok=True)
m = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2",
                  cache_dir="/model-cache")
list(m.embed(["warmup"]))
print("Model cached successfully")
EOF


# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

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

CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2", \
     "--loop", "uvloop", \
     "--http", "h11"]
