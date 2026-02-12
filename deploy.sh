#!/bin/bash

# Deployment Script for Hostinger VPS
# Usage: ./deploy.sh [backend|frontend|all]

set -e  # Exit on error

BACKEND_DIR="/var/www/jira/backend"
FRONTEND_DIR="/var/www/jira/frontend"
DEPLOY_TYPE=${1:-all}

echo "🚀 Starting deployment process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to deploy backend
deploy_backend() {
    echo -e "${YELLOW}📦 Deploying Backend...${NC}"
    
    if [ ! -d "$BACKEND_DIR" ]; then
        echo -e "${RED}❌ Backend directory not found at $BACKEND_DIR${NC}"
        exit 1
    fi
    
    cd "$BACKEND_DIR"
    
    echo "Installing dependencies..."
    npm install --production
    
    echo "Creating logs directory..."
    mkdir -p logs
    
    echo "Restarting backend with PM2..."
    pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js
    pm2 save
    
    echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
    pm2 status
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "${YELLOW}📦 Deploying Frontend...${NC}"
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        echo -e "${RED}❌ Frontend directory not found at $FRONTEND_DIR${NC}"
        exit 1
    fi
    
    cd "$FRONTEND_DIR"
    
    echo "Installing dependencies..."
    npm install
    
    echo "Building frontend..."
    npm run build
    
    echo "Reloading Nginx..."
    sudo nginx -t && sudo systemctl reload nginx
    
    echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
}

# Main deployment logic
case $DEPLOY_TYPE in
    backend)
        deploy_backend
        ;;
    frontend)
        deploy_frontend
        ;;
    all)
        deploy_backend
        deploy_frontend
        ;;
    *)
        echo -e "${RED}❌ Invalid deployment type: $DEPLOY_TYPE${NC}"
        echo "Usage: ./deploy.sh [backend|frontend|all]"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Deployment completed!${NC}"

