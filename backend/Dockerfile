# ── Stage 1: Build Dependencies (Builder Stage) ───────────────────────────────
# We use python:3.12-slim to keep the base image lightweight while providing Python 3.12.
FROM python:3.12-slim AS builder

# Set the working directory for dependencies compilation
WORKDIR /build

# Install compiler toolchains needed to build wheel packages (e.g., C extensions or database drivers)
# Clean up apt caches in the same layer to minimize final image size.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Initialize a clean, isolated Python virtual environment.
# This prevents pollution of system libraries and ensures portability.
RUN python -m venv /opt/venv

# Force all subsequent python/pip commands to run within the created virtual environment
ENV PATH="/opt/venv/bin:$PATH"

# Copy the dependency manifest file first.
# By copying only requirements.txt, Docker caches this layer unless package requirements change.
COPY requirements.txt .

# Install dependencies into the virtual environment without caching wheel files.
RUN pip install --no-cache-dir -r requirements.txt


# ── Stage 2: Hardened Runtime (Runner Stage) ──────────────────────────────────
# Use the same base image to prevent library mismatch errors.
FROM python:3.12-slim AS runner

# Set the operational directory inside the container
WORKDIR /app

# Install curl and libgomp1 (required for FAISS C++ multi-threading) in the runner stage.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy only the compiled virtual environment from the builder stage.
# This leaves compiler tools (gcc, build-essential) behind, reducing image size by ~150-200MB.
COPY --from=builder /opt/venv /opt/venv

# Activate the virtual environment paths in the runner container.
ENV PATH="/opt/venv/bin:$PATH"

# Copy the application code folder and config settings files.
COPY app/ /app/app/
COPY configs/ /app/configs/
COPY crimelens.db* /app/
COPY run.py /app/

# Inform Docker that the container will listen on port 8000 at runtime.
# Note: Catalyst AppSail overrides this dynamically, but EXPOSE serves as documentation.
EXPOSE 8000

# Create a dedicated system user (ksp_user) with UID 10001.
# Running as a non-root user prevents potential container-breakout security vulnerabilities.
RUN useradd -u 10001 ksp_user && \
    chown -R ksp_user:ksp_user /app

# Switch to the non-privileged user for executing the application process.
USER ksp_user

# Docker healthcheck probe to check liveness.
# Executes every 30 seconds. If it fails 3 times, container status changes to unhealthy.
# We query the liveness-probe endpoint: /api/v1/health.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:${X_ZOHO_CATALYST_LISTEN_PORT:-${PORT:-8000}}/api/v1/health || exit 1

# Dynamic entry point command.
# Catalyst AppSail passes a random dynamic port under the environment variable "X_ZOHO_CATALYST_LISTEN_PORT" or "PORT".
# We use 'sh -c' to evaluate these port overrides, defaulting to 8000 for local runs.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${X_ZOHO_CATALYST_LISTEN_PORT:-${PORT:-8000}}"]
