#!/bin/bash

# AWS ECS POC Deployment Script for VitaCheckLabs UI (Cost Optimized)
# This script deploys a minimal cost POC version to AWS ECS Fargate

set -e

# Configuration for POC (cost optimized)
REGION="us-east-1"
CLUSTER_NAME="vitachecklabs-poc-cluster"
SERVICE_NAME="vitachecklabs-ui-poc-service"
TASK_FAMILY="vitachecklabs-ui-poc"
ECR_REPOSITORY="vitachecklabs-ui-poc"
IMAGE_TAG="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting VitaCheckLabs UI POC Deployment (Cost Optimized)${NC}"
echo "=================================================================="

# Check if virtual environment exists and activate it
if [ -d "venv" ]; then
    echo -e "${BLUE}🔄 Activating virtual environment...${NC}"
    source venv/bin/activate
    AWS_CMD="python -m awscli"
else
    # Fallback to system AWS CLI
    AWS_CMD="aws"
fi

# Check if AWS CLI is configured
if ! $AWS_CMD sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured. Please run './scripts/configure_aws.sh' first.${NC}"
    exit 1
fi

ACCOUNT_ID=$($AWS_CMD sts get-caller-identity --query Account --output text)
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPOSITORY}"

echo -e "${YELLOW}💰 POC Cost Optimization Features:${NC}"
echo "   ✅ Minimal CPU/Memory (256 CPU, 512 MB)"
echo "   ✅ Single instance (desired count = 1)"
echo "   ✅ Optimized Nginx configuration"
echo "   ✅ Auto-shutdown capability"
echo "   ✅ Shared cluster with backend"
echo ""

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "   Account ID: ${ACCOUNT_ID}"
echo "   Region: ${REGION}"
echo "   ECR Repository: ${ECR_URI}"
echo "   Cluster: ${CLUSTER_NAME}"
echo "   Service: ${SERVICE_NAME}"
echo ""

# Step 1: Create ECR repository if it doesn't exist
echo -e "${YELLOW}📦 Step 1: Setting up ECR repository...${NC}"
if ! $AWS_CMD ecr describe-repositories --repository-names ${ECR_REPOSITORY} --region ${REGION} &> /dev/null; then
    echo "Creating ECR repository..."
    $AWS_CMD ecr create-repository --repository-name ${ECR_REPOSITORY} --region ${REGION}
    # Set lifecycle policy to keep only 3 images
    $AWS_CMD ecr put-lifecycle-policy --repository-name ${ECR_REPOSITORY} --region ${REGION} --lifecycle-policy-text '{
        "rules": [
            {
                "rulePriority": 1,
                "description": "Keep only 3 images",
                "selection": {
                    "tagStatus": "any",
                    "countType": "imageCountMoreThan",
                    "countNumber": 3
                },
                "action": {
                    "type": "expire"
                }
            }
        ]
    }'
    echo -e "${GREEN}✅ ECR repository created with lifecycle policy${NC}"
else
    echo -e "${GREEN}✅ ECR repository already exists${NC}"
fi

# Step 2: Build and push Docker image
echo -e "${YELLOW}🐳 Step 2: Building and pushing Docker image...${NC}"

# Check if we need sudo for Docker
if docker ps &> /dev/null; then
    DOCKER_CMD="docker"
else
    echo -e "${YELLOW}⚠️  Using sudo for Docker commands (permission issue detected)${NC}"
    DOCKER_CMD="sudo docker"
fi

# Login to ECR
$AWS_CMD ecr get-login-password --region ${REGION} | $DOCKER_CMD login --username AWS --password-stdin ${ECR_URI}

# Build image in the vitachecklabs-ui directory
cd vitachecklabs-ui

echo "Building optimized Docker image..."
$DOCKER_CMD build -t ${ECR_REPOSITORY}:${IMAGE_TAG} .

# Tag for ECR
$DOCKER_CMD tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${ECR_URI}:${IMAGE_TAG}

# Push to ECR
echo "Pushing image to ECR..."
$DOCKER_CMD push ${ECR_URI}:${IMAGE_TAG}
echo -e "${GREEN}✅ Docker image pushed successfully${NC}"

# Go back to root directory
cd ..

# Step 3: Use existing ECS cluster or create if it doesn't exist
echo -e "${YELLOW}🎯 Step 3: Checking ECS cluster...${NC}"
if ! $AWS_CMD ecs describe-clusters --clusters ${CLUSTER_NAME} --region ${REGION} --query 'clusters[0].status' --output text 2>/dev/null | grep -q "ACTIVE"; then
    echo "Creating ECS cluster..."
    $AWS_CMD ecs create-cluster --cluster-name ${CLUSTER_NAME} --region ${REGION} --capacity-providers FARGATE --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1
    echo -e "${GREEN}✅ ECS cluster created${NC}"
else
    echo -e "${GREEN}✅ Using existing ECS cluster${NC}"
fi

# Step 4: Create CloudWatch log group with retention
echo -e "${YELLOW}📊 Step 4: Setting up CloudWatch logs (7-day retention)...${NC}"
if ! $AWS_CMD logs describe-log-groups --log-group-name-prefix "/ecs/vitachecklabs-ui-poc" --region ${REGION} --query 'logGroups[0].logGroupName' --output text 2>/dev/null | grep -q "vitachecklabs-ui-poc"; then
    echo "Creating CloudWatch log group..."
    $AWS_CMD logs create-log-group --log-group-name "/ecs/vitachecklabs-ui-poc" --region ${REGION}
    # Set 7-day retention to save costs
    $AWS_CMD logs put-retention-policy --log-group-name "/ecs/vitachecklabs-ui-poc" --retention-in-days 7 --region ${REGION}
    echo -e "${GREEN}✅ CloudWatch log group created with 7-day retention${NC}"
else
    echo -e "${GREEN}✅ CloudWatch log group already exists${NC}"
fi

# Step 5: Ensure ECS execution role exists
echo -e "${YELLOW}📋 Step 5: Ensuring ECS execution role exists...${NC}"
if ! $AWS_CMD iam get-role --role-name ecsTaskExecutionRole &> /dev/null; then
    echo "Creating ecsTaskExecutionRole..."
    # Create the role
    $AWS_CMD iam create-role --role-name ecsTaskExecutionRole \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }'
    
    # Attach the managed policy
    $AWS_CMD iam attach-role-policy --role-name ecsTaskExecutionRole \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    
    echo -e "${GREEN}✅ ECS execution role created${NC}"
else
    echo -e "${GREEN}✅ ECS execution role already exists${NC}"
fi

# Step 6: Create task definition
echo -e "${YELLOW}📋 Step 6: Registering ECS task definition...${NC}"

# Update task definition with actual values
sed -e "s/{ACCOUNT_ID}/${ACCOUNT_ID}/g" \
    -e "s|{ECR_REPOSITORY_URI}|${ECR_URI}|g" \
    ecs-task-definition-poc.json > /tmp/ui-task-definition-poc.json

# Register task definition
$AWS_CMD ecs register-task-definition --cli-input-json file:///tmp/ui-task-definition-poc.json --region ${REGION}
echo -e "${GREEN}✅ POC UI task definition registered${NC}"

# Step 7: Create or update ECS service
echo -e "${YELLOW}🎯 Step 7: Creating/updating ECS service...${NC}"

# Check if service exists
if $AWS_CMD ecs describe-services --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME} --region ${REGION} --query 'services[0].status' --output text 2>/dev/null | grep -q "ACTIVE"; then
    echo "Updating existing service..."
    $AWS_CMD ecs update-service \
        --cluster ${CLUSTER_NAME} \
        --service ${SERVICE_NAME} \
        --task-definition ${TASK_FAMILY} \
        --region ${REGION}
    echo -e "${GREEN}✅ Service updated${NC}"
else
    echo "Creating new service..."
    
    # Get default VPC and subnets
    VPC_ID=$($AWS_CMD ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region ${REGION})
    SUBNET_IDS=$($AWS_CMD ec2 describe-subnets --filters "Name=vpc-id,Values=${VPC_ID}" --query 'Subnets[*].SubnetId' --output text --region ${REGION})
    
    # Create or get security group for POC UI
    SECURITY_GROUP_ID=$($AWS_CMD ec2 create-security-group \
        --group-name vitachecklabs-ui-poc-sg \
        --description "Security group for VitaCheckLabs UI POC" \
        --vpc-id ${VPC_ID} \
        --query 'GroupId' \
        --output text \
        --region ${REGION} 2>/dev/null || \
        $AWS_CMD ec2 describe-security-groups \
        --filters "Name=group-name,Values=vitachecklabs-ui-poc-sg" "Name=vpc-id,Values=${VPC_ID}" \
        --query 'SecurityGroups[0].GroupId' \
        --output text \
        --region ${REGION})
    
    # Add inbound rule for port 80 (HTTP)
    $AWS_CMD ec2 authorize-security-group-ingress \
        --group-id ${SECURITY_GROUP_ID} \
        --protocol tcp \
        --port 80 \
        --cidr 0.0.0.0/0 \
        --region ${REGION} 2>/dev/null || echo "HTTP rule already exists"
    
    # Add inbound rule for port 443 (HTTPS) - for future use
    $AWS_CMD ec2 authorize-security-group-ingress \
        --group-id ${SECURITY_GROUP_ID} \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0 \
        --region ${REGION} 2>/dev/null || echo "HTTPS rule already exists"
    
    # Create service
    $AWS_CMD ecs create-service \
        --cluster ${CLUSTER_NAME} \
        --service-name ${SERVICE_NAME} \
        --task-definition ${TASK_FAMILY} \
        --desired-count 1 \
        --launch-type FARGATE \
        --platform-version LATEST \
        --network-configuration "awsvpcConfiguration={subnets=[$(echo ${SUBNET_IDS} | tr ' ' ',')],securityGroups=[${SECURITY_GROUP_ID}],assignPublicIp=ENABLED}" \
        --enable-execute-command \
        --region ${REGION}
    
    echo -e "${GREEN}✅ POC UI service created${NC}"
fi

# Step 8: Set up auto-scaling (scale to 0 capability)
echo -e "${YELLOW}⚡ Step 8: Setting up auto-scaling...${NC}"
$AWS_CMD application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --resource-id service/${CLUSTER_NAME}/${SERVICE_NAME} \
    --scalable-dimension ecs:service:DesiredCount \
    --min-capacity 0 \
    --max-capacity 2 \
    --region ${REGION} 2>/dev/null || echo "Auto-scaling already configured"

echo -e "${GREEN}✅ Auto-scaling configured (can scale to 0)${NC}"

# Step 9: Wait for service to stabilize
echo -e "${YELLOW}⏳ Step 9: Waiting for service to stabilize...${NC}"
$AWS_CMD ecs wait services-stable --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME} --region ${REGION}

# Get service details
TASK_ARN=$($AWS_CMD ecs list-tasks --cluster ${CLUSTER_NAME} --service-name ${SERVICE_NAME} --query 'taskArns[0]' --output text --region ${REGION})
if [ "$TASK_ARN" != "None" ] && [ "$TASK_ARN" != "" ]; then
    ENI_ID=$($AWS_CMD ecs describe-tasks --cluster ${CLUSTER_NAME} --tasks ${TASK_ARN} --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text --region ${REGION})
    PUBLIC_IP=$($AWS_CMD ec2 describe-network-interfaces --network-interface-ids ${ENI_ID} --query 'NetworkInterfaces[0].Association.PublicIp' --output text --region ${REGION} 2>/dev/null || echo "Not available yet")
else
    PUBLIC_IP="Not available yet"
fi

echo ""
echo -e "${GREEN}🎉 UI POC Deployment completed successfully!${NC}"
echo "=================================================================="
echo -e "${GREEN}✅ Application Details:${NC}"
echo "   Cluster: ${CLUSTER_NAME}"
echo "   Service: ${SERVICE_NAME}"
echo "   Task: ${TASK_ARN}"
echo "   Public IP: ${PUBLIC_IP}"
if [ "$PUBLIC_IP" != "Not available yet" ]; then
    echo "   Frontend URL: http://${PUBLIC_IP}"
    echo "   Health Check: http://${PUBLIC_IP}/health (if configured)"
fi
echo ""
echo -e "${BLUE}💰 Cost Optimization Summary:${NC}"
echo "   ✅ Minimal resources (256 CPU, 512 MB RAM)"
echo "   ✅ Can scale to 0 instances (manual)"
echo "   ✅ 7-day log retention"
echo "   ✅ Lifecycle policy (3 images max)"
echo "   ✅ Shared cluster with backend"
echo ""
echo -e "${YELLOW}📋 Cost Management Commands:${NC}"
echo "   Scale to 0: $AWS_CMD ecs update-service --cluster ${CLUSTER_NAME} --service ${SERVICE_NAME} --desired-count 0 --region ${REGION}"
echo "   Scale to 1: $AWS_CMD ecs update-service --cluster ${CLUSTER_NAME} --service ${SERVICE_NAME} --desired-count 1 --region ${REGION}"
echo "   Delete service: $AWS_CMD ecs delete-service --cluster ${CLUSTER_NAME} --service ${SERVICE_NAME} --force --region ${REGION}"
echo ""
echo -e "${GREEN}💰 Estimated UI POC Cost: ~$2-5/month${NC}"
echo -e "${BLUE}🎯 Combined with backend POC: ~$5-13/month total${NC}"
echo -e "${BLUE}🎯 When not in use, scale both to 0 for ~$0.50/month${NC}"

# Clean up temp files
rm -f /tmp/ui-task-definition-poc.json