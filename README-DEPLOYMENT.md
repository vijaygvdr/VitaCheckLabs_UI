# VitaCheckLabs UI ECS Deployment Guide

This guide will help you deploy the VitaCheckLabs UI application to your existing ECS cluster.

## Prerequisites

1. AWS CLI configured with appropriate permissions
2. Docker installed and running
3. An existing ECS cluster (or the script will create one)

## Deployment Options

### 1. POC Deployment (Recommended for Testing) 💰

**Cost Optimized**: ~$2-5/month

Use `deploy-poc.sh` for a cost-effective POC deployment:

```bash
./deploy-poc.sh
```

**POC Features:**
- ✅ Minimal resources (256 CPU, 512 MB RAM)
- ✅ Can scale to 0 instances when not in use
- ✅ 7-day CloudWatch log retention
- ✅ Shared cluster with backend
- ✅ Auto-scaling configured (0-2 instances)

### 2. Production Deployment

Use `deploy.sh` for production with load balancer integration.

## Files Created

- `vitachecklabs-ui/Dockerfile` - Multi-stage Docker build for the React app
- `vitachecklabs-ui/nginx.conf` - Nginx configuration for serving the app
- `vitachecklabs-ui/.dockerignore` - Docker ignore file
- `ecs-task-definition.json` - Production ECS task definition
- `ecs-task-definition-poc.json` - POC ECS task definition
- `ecs-service.json` - ECS service configuration template
- `deploy.sh` - Production deployment script
- `deploy-poc.sh` - POC deployment script

## Quick POC Deployment Steps

1. **Run POC Deployment** (No configuration needed!)
   ```bash
   ./deploy-poc.sh
   ```
   
   The script will automatically:
   - Create ECR repository with lifecycle policy
   - Build and push Docker image
   - Use/create ECS cluster
   - Set up CloudWatch logs (7-day retention)
   - Deploy with minimal resources
   - Configure auto-scaling (0-2 instances)

2. **Access Your Application**
   The script will output the public IP address where your UI is accessible.

## Production Deployment Steps

1. **Update Configuration**
   Edit `deploy.sh` and update these variables:
   ```bash
   AWS_REGION="your-region"
   AWS_ACCOUNT_ID="your-account-id"
   CLUSTER_NAME="your-cluster-name"
   ```

2. **Update ECS Service Configuration**
   Edit `ecs-service.json` and update:
   - `cluster`: Your ECS cluster name
   - `subnets`: Your subnet IDs
   - `securityGroups`: Your security group IDs
   - `loadBalancers`: Your target group ARN (if using ALB)

3. **Run Deployment**
   ```bash
   ./deploy.sh
   ```

## Manual Deployment Steps

If you prefer manual deployment:

1. **Build and Push Docker Image**
   ```bash
   cd vitachecklabs-ui
   docker build -t vitachecklabs-ui .
   
   # Tag for ECR
   docker tag vitachecklabs-ui:latest YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/vitachecklabs-ui:latest
   
   # Login to ECR
   aws ecr get-login-password --region YOUR_REGION | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com
   
   # Push to ECR
   docker push YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/vitachecklabs-ui:latest
   ```

2. **Register Task Definition**
   ```bash
   aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
   ```

3. **Create or Update Service**
   ```bash
   # For new service
   aws ecs create-service --cli-input-json file://ecs-service.json
   
   # For existing service
   aws ecs update-service --cluster YOUR_CLUSTER --service vitachecklabs-ui-service --task-definition vitachecklabs-ui
   ```

## Configuration Notes

- The application runs on port 80 inside the container
- Uses Fargate launch type with 256 CPU and 512 MB memory
- Includes CloudWatch logging
- Nginx serves static files with caching and gzip compression
- Handles React Router client-side routing

## Cost Management Commands

### Scale to 0 (Stop incurring compute costs)
```bash
aws ecs update-service --cluster vitachecklabs-poc-cluster --service vitachecklabs-ui-poc-service --desired-count 0 --region us-east-1
```

### Scale back to 1
```bash
aws ecs update-service --cluster vitachecklabs-poc-cluster --service vitachecklabs-ui-poc-service --desired-count 1 --region us-east-1
```

### Delete service completely
```bash
aws ecs delete-service --cluster vitachecklabs-poc-cluster --service vitachecklabs-ui-poc-service --force --region us-east-1
```

## Cost Estimates

- **POC Deployment**: ~$2-5/month
- **Combined with Backend POC**: ~$5-13/month total
- **When scaled to 0**: ~$0.50/month (just ECR storage)

## Security Considerations

- Update security groups to allow traffic only from your load balancer
- Consider using private subnets if not exposing directly to internet
- Review and update nginx security headers as needed
- Use IAM roles with minimal required permissions

## Monitoring

- CloudWatch logs are configured under `/ecs/vitachecklabs-ui` (production) or `/ecs/vitachecklabs-ui-poc` (POC)
- Service auto-scaling can be configured based on CPU/memory metrics
- Health checks are configured with 60-second grace period