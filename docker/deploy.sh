#!/bin/bash

# FoundryVTT Avant System - Build & Deploy Script
# Builds the avant system and deploys it to the Docker container
# Run from the avantVtt project root directory

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTAINER_NAME="foundry-vtt-v13"
CONTAINER_PATH="/data/Data/systems/avant"
ENDPOINT_URL="http://localhost:30000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    log_error "package.json not found. Please run this script from the avantVtt project root."
    log_info "Current directory: $(pwd)"
    log_info "Expected project root: $PROJECT_ROOT"
    exit 1
fi

# Check if Docker container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log_error "Docker container '$CONTAINER_NAME' not found"
    log_info "Available containers:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    exit 1
fi

log_info "Starting build and deployment process..."
log_info "Project root: $PROJECT_ROOT"

# Change to project root
cd "$PROJECT_ROOT"

# Step 1: Build the system
log_info "Building avant system..."

# Clean build
log_info "Running npm run build..."
npm run build || {
    log_error "Build failed"
    exit 1
}

# Verify dist directory exists
if [ ! -d "dist" ]; then
    log_error "Build did not create dist/ directory"
    exit 1
fi

log_success "Build completed successfully"

# Step 2: Check if container is running
log_info "Checking container status..."
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log_warning "Container is not running, starting it..."
    docker start "$CONTAINER_NAME" || {
        log_error "Failed to start container"
        exit 1
    }
    
    # Wait for container to be ready
    log_info "Waiting for container to start..."
    sleep 5
fi

# Step 3: Deploy to container
log_info "Deploying to container..."

# Copy built files to container
log_info "Copying files to container..."
docker cp "$PROJECT_ROOT/dist/." "$CONTAINER_NAME:$CONTAINER_PATH/" || {
    log_error "Failed to copy files to container"
    exit 1
}

log_success "Files copied successfully"

log_info "Starting container with Docker Compose..."
docker-compose up -d || {
    log_error "Failed to start container"
    exit 1
}

# # Fix permissions on mounted directories
# log_info "Fixing permissions on /data/Data/systems..."
# docker exec "$CONTAINER_NAME" chown -R node:node /data/Data/systems || {
#     log_error "Failed to fix permissions"
#     exit 1
# }

# Step 4: Restart FoundryVTT process (optional, but ensures fresh start)
log_info "Restarting container for clean deployment..."
docker restart "$CONTAINER_NAME" || {
    log_error "Failed to restart container"
    exit 1
}

# Step 5: Wait for container to be ready and verify
log_info "Waiting for container to be ready..."
sleep 10

# Check if container is running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log_success "Container is running"
else
    log_error "Container failed to start"
    exit 1
fi

# Step 6: Show deployment summary
log_success "Deployment completed successfully!"
echo ""
log_info "Deployment Summary:"
echo "  📁 Source: $PROJECT_ROOT"
echo "  🐳 Container: $CONTAINER_NAME"
echo "  📂 Deployed to: $CONTAINER_PATH"
echo "  🌐 Access: $ENDPOINT_URL"
echo ""
log_info "Next steps:"
echo "  1. Open $ENDPOINT_URL in your browser"
echo "  2. Test the avant system"
echo "  3. Check browser console for any errors"
echo ""

# Optional: Show recent logs
log_info "Recent container logs (last 10 lines):"
docker logs --tail 10 "$CONTAINER_NAME" 2>/dev/null || log_warning "Could not retrieve logs"

log_success "All done! 🎉" 