#!/bin/bash

# AWS CLI Installation Script for VitaCheckLabs UI
# This script installs AWS CLI using the same method as the backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Installing AWS CLI for VitaCheckLabs UI${NC}"
echo "=================================================================="

# Check if Python is available
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo -e "${RED}❌ Python is not installed. Please install Python first.${NC}"
    exit 1
fi

# Determine Python command
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
fi

echo -e "${BLUE}📋 Using Python: $(which $PYTHON_CMD)${NC}"
echo -e "${BLUE}📋 Python version: $($PYTHON_CMD --version)${NC}"
echo ""

# Create virtual environment if it doesn't exist
VENV_DIR="venv"
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    if $PYTHON_CMD -m venv $VENV_DIR; then
        echo -e "${GREEN}✅ Virtual environment created${NC}"
    else
        echo -e "${RED}❌ Failed to create virtual environment${NC}"
        echo -e "${YELLOW}💡 You may need to install python3-venv: sudo apt install python3-venv${NC}"
        exit 1
    fi
else
    echo -e "${BLUE}ℹ️  Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo -e "${YELLOW}🔄 Activating virtual environment...${NC}"
source $VENV_DIR/bin/activate

# Install AWS CLI in virtual environment
echo -e "${YELLOW}📦 Installing AWS CLI in virtual environment...${NC}"
if pip install awscli; then
    echo -e "${GREEN}✅ AWS CLI installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install AWS CLI${NC}"
    exit 1
fi

# Verify installation
echo -e "${YELLOW}🔍 Verifying AWS CLI installation...${NC}"
if python -m awscli --version &> /dev/null; then
    AWS_VERSION=$(python -m awscli --version)
    echo -e "${GREEN}✅ AWS CLI is working: ${AWS_VERSION}${NC}"
else
    echo -e "${RED}❌ AWS CLI installation verification failed${NC}"
    exit 1
fi

# Create alias for convenience
echo -e "${YELLOW}🔧 Setting up AWS CLI alias...${NC}"
if [[ "$SHELL" == *"bash"* ]]; then
    SHELL_RC="$HOME/.bashrc"
elif [[ "$SHELL" == *"zsh"* ]]; then
    SHELL_RC="$HOME/.zshrc"
else
    SHELL_RC="$HOME/.profile"
fi

# Add alias to shell configuration
PROJECT_DIR=$(pwd)
AWS_ALIAS="alias aws='cd $PROJECT_DIR && source venv/bin/activate && python -m awscli'"

if ! grep -q "alias aws=" "$SHELL_RC" 2>/dev/null; then
    echo "" >> "$SHELL_RC"
    echo "# AWS CLI alias for VitaCheckLabs UI" >> "$SHELL_RC"
    echo "$AWS_ALIAS" >> "$SHELL_RC"
    echo -e "${GREEN}✅ AWS CLI alias added to $SHELL_RC${NC}"
    echo -e "${YELLOW}💡 Run 'source $SHELL_RC' or restart your terminal to use 'aws' command${NC}"
else
    echo -e "${BLUE}ℹ️  AWS CLI alias already exists in $SHELL_RC${NC}"
fi

# Install additional AWS packages
echo -e "${YELLOW}📦 Installing additional AWS packages...${NC}"
pip install boto3 botocore

echo ""
echo -e "${GREEN}🎉 AWS CLI installation completed successfully!${NC}"
echo "=================================================================="
echo -e "${GREEN}✅ Installation Summary:${NC}"
echo "   AWS CLI: $(python -m awscli --version)"
echo "   Boto3: Installed"
echo "   Botocore: Installed"
echo "   Virtual Environment: $PROJECT_DIR/venv"
echo ""
echo -e "${BLUE}💡 Usage:${NC}"
echo "   In scripts: source venv/bin/activate && python -m awscli [command]"
echo "   Direct alias: aws [command] (after sourcing shell config)"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "   1. Run './scripts/configure_aws.sh' to configure AWS credentials"
echo "   2. Run './scripts/test_aws_setup.sh' to verify setup"
echo ""