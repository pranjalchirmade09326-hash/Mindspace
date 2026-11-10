FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app
COPY pyproject.toml ./
RUN uv sync --no-dev
COPY app ./app
COPY migrations ./migrations
RUN useradd -r -u 1001 mindspace && chown -R mindspace /app
USER mindspace
EXPOSE 5001
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5001"]
