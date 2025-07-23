#!/bin/bash

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying backend...${NC}"
cd backend
./deploy.sh

cd ..
echo -e "${BLUE}🚀 Deploying frontend...${NC}"
./deploy.sh

echo -e "${GREEN}✅ Both backend and frontend deployed!${NC}" 