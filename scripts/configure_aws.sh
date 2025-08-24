#!/bin/bash

# AWS CLI Configuration Helper Script for VitaCheckLabs UI
# This script helps configure AWS CLI with your credentials

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 AWS CLI Configuration Helper${NC}"
echo "==============================="

# Navigate to project directory
cd "$(dirname "$0")/.."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Virtual environment not found. Please run './scripts/install_aws_cli.sh' first.${NC}"
    exit 1
fi

# Activate virtual environment
echo -e "${BLUE}🔄 Activating virtual environment...${NC}"
source venv/bin/activate

# Check if AWS CLI is installed
if ! python -m awscli --version &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please run './scripts/install_aws_cli.sh' first.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 You need to provide the following information:${NC}"
echo "1. AWS Access Key ID (from IAM user)"
echo "2. AWS Secret Access Key (from IAM user)"
echo "3. Default region: us-east-1 (recommended)"
echo "4. Default output format: json (recommended)"
echo ""

# Check if AWS is already configured
if python -m awscli sts get-caller-identity &> /dev/null; then
    echo -e "${YELLOW}⚠️  AWS CLI is already configured. Current identity:${NC}"
    python -m awscli sts get-caller-identity
    echo ""
    read -p "Do you want to reconfigure? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}ℹ️  Keeping existing configuration.${NC}"
        exit 0
    fi
fi

# Run AWS configure
echo -e "${YELLOW}🔧 Starting AWS CLI configuration...${NC}"
python -m awscli configure

echo ""
echo -e "${YELLOW}🔍 Verifying AWS configuration...${NC}"

# Test the configuration
if python -m awscli sts get-caller-identity &> /dev/null; then
    echo -e "${GREEN}✅ AWS CLI configuration completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Your AWS Identity:${NC}"
    python -m awscli sts get-caller-identity
    echo ""
    echo -e "${GREEN}🎉 You're ready to deploy to AWS!${NC}"
else
    echo -e "${RED}❌ AWS CLI configuration failed. Please check your credentials.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}💡 Available commands:${NC}"
echo "   Deploy POC: ./deploy-poc.sh"
echo "   Deploy Production: ./deploy.sh"
echo "   Test AWS Setup: ./scripts/test_aws_setup.sh"