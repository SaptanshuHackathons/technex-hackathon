FROM python:3.12-slim

# System deps
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install Qdrant
RUN curl -L https://github.com/qdrant/qdrant/releases/latest/download/qdrant-x86_64-unknown-linux-gnu.tar.gz \
    | tar xz && \
    mv qdrant /usr/local/bin/qdrant

# App directory
WORKDIR /app

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY . .

# Supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose ports
EXPOSE 10000 6333

CMD ["supervisord", "-n"]
