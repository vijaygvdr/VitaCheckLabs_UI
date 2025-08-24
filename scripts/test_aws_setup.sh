#!/bin/bash

# Test AWS CLI Setup for VitaCheckLabs UI
# Run this script to verify AWS CLI is working correctly

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧪 Testing AWS CLI Setup${NC}"
echo "========================"

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

# Test AWS CLI installation
echo -e "${BLUE}1. Testing AWS CLI installation...${NC}"
if python -m awscli --version &> /dev/null; then
    echo -e "   ${GREEN}✅ AWS CLI installed successfully${NC}"
    AWS_VERSION=$(python -m awscli --version)
    echo "   $AWS_VERSION"
else
    echo -e "   ${RED}❌ AWS CLI not found${NC}"
    echo -e "   ${YELLOW}💡 Run: ./scripts/install_aws_cli.sh${NC}"
    exit 1
fi

echo ""

# Test AWS credentials
echo -e "${BLUE}2. Testing AWS credentials...${NC}"
if python -m awscli sts get-caller-identity &> /dev/null; then
    echo -e "   ${GREEN}✅ AWS credentials configured correctly${NC}"
    IDENTITY=$(python -m awscli sts get-caller-identity)
    echo "   $IDENTITY"
else
    echo -e "   ${RED}❌ AWS credentials not configured or invalid${NC}"
    echo -e "   ${YELLOW}💡 Run: ./scripts/configure_aws.sh${NC}"
    exit 1
fi

echo ""

# Test basic AWS services access
echo -e "${BLUE}3. Testing AWS services access...${NC}"

# Test ECS access
if python -m awscli ecs list-clusters --region us-east-1 &> /dev/null; then
    echo -e "   ${GREEN}✅ ECS access verified${NC}"
else
    echo -e "   ${YELLOW}⚠️  ECS access limited or unavailable${NC}"
fi

# Test ECR access
if python -m awscli ecr describe-repositories --region us-east-1 &> /dev/null; then
    echo -e "   ${GREEN}✅ ECR access verified${NC}"
else
    echo -e "   ${YELLOW}⚠️  ECR access limited or unavailable${NC}"
fi

# Test EC2 access (for VPC/subnets)
if python -m awscli ec2 describe-vpcs --region us-east-1 &> /dev/null; then
    echo -e "   ${GREEN}✅ EC2 access verified${NC}"
else
    echo -e "   ${YELLOW}⚠️  EC2 access limited or unavailable${NC}"
fi

echo ""

# Test Docker (required for deployment)
echo -e "${BLUE}4. Testing Docker...${NC}"
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        echo -e "   ${GREEN}✅ Docker is running${NC}"
        DOCKER_VERSION=$(docker --version)
        echo "   $DOCKER_VERSION"
    else
        echo -e "   ${YELLOW}⚠️  Docker is installed but not running${NC}"
        echo -e "   ${YELLOW}💡 Please start Docker Desktop${NC}"
    fi
else
    echo -e "   ${RED}❌ Docker not found${NC}"
    echo -e "   ${YELLOW}💡 Please install Docker Desktop${NC}"
fi

echo ""

# Test region configuration
echo -e "${BLUE}5. Testing region configuration...${NC}"
REGION=$(python -m awscli configure get region)
if [ "$REGION" = "us-east-1" ]; then
    echo -e "   ${GREEN}✅ Region set to us-east-1 (recommended)${NC}"
elif [ -n "$REGION" ]; then
    echo -e "   ${YELLOW}⚠️  Region set to: $REGION${NC}"
    echo -e "   ${YELLOW}💡 Consider using us-east-1 for lower costs${NC}"
else
    echo -e "   ${RED}❌ No default region configured${NC}"
    echo -e "   ${YELLOW}💡 Run: ./scripts/configure_aws.sh${NC}"
fi

echo ""
echo -e "${GREEN}🎉 AWS Setup Test Complete!${NC}"
echo "======================"
echo ""
echo -e "${BLUE}💡 Available deployment commands:${NC}"
echo "   POC Deployment: ./deploy-poc.sh"
echo "   Production Deployment: ./deploy.sh"
echo ""
echo -e "${BLUE}💡 Or use npm scripts:${NC}"
echo "   cd vitachecklabs-ui"
echo "   npm run deploy:poc"
echo "   npm run deploy:prod"