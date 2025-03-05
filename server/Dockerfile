# Use Python as the base image
FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Install system dependencies required by Manim
RUN apt-get update && apt-get install -y \
    ffmpeg \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-extra \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libglib2.0-dev \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better layer caching
COPY requirements.txt .

# Install Python dependencies and Manim
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir manim

# Copy the application code
COPY . .

# Create log directory
RUN mkdir -p /app/logs

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=file.py

# Expose the Flask port
EXPOSE 5000

# Run the Flask application
CMD ["python", "file.py"]
