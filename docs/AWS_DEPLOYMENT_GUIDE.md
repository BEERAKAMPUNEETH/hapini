# ☁️ Hapini — AWS Production Deployment Guide

> **Important Safety Note:** This guide and associated files (`aws/cloudformation.yml`, `aws/apprunner.yaml`, `aws/ecs-task-definition.json`, `.github/workflows/deploy.yml`) are **prepared configurations**. No AWS resources have been provisioned, no domains have been purchased, and no cloud charges have been incurred. Deployment will only execute when you explicitly approve and initiate it.

---

## 🏛️ 1. Proposed AWS Cloud Architecture

Hapini is designed with a **unified CloudFront distribution** pattern that hosts both the static React SPA and the containerized Node.js API behind a single HTTPS origin, eliminating cross-origin (CORS) complexity while minimizing monthly cloud infrastructure costs.

```
                                Users / Internet
                                       │
                                       ▼ HTTPS (Port 443)
                 ┌───────────────────────────────────────────┐
                 │          Amazon CloudFront CDN            │
                 │   - Global Edge Caching & Compression     │
                 │   - Free ACM SSL/TLS Certificate          │
                 └─────────────┬─────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
  Default: /*   │                             │   Behavior: /api/*
                ▼                             ▼
┌──────────────────────────────┐ ┌──────────────────────────────────────┐
│       Amazon S3 Bucket       │ │   Application Load Balancer (ALB)    │
│  - Static React SPA assets   │ │   - HTTPS forwarding to Target Group │
│  - Origin Access Control     │ └──────────────────┬───────────────────┘
│  - Zero server maintenance   │                    │ Target Group (:5000)
└──────────────────────────────┘                    ▼
                                 ┌──────────────────────────────────────┐
                                 │     Amazon ECS Fargate / App Runner  │
                                 │   - Node.js 20 + Express API         │
                                 │   - Auto-healing on /api/health      │
                                 │   - In-process Alert Scheduler       │
                                 └──────────┬────────────────┬──────────┘
                                            │                │
                                            ▼                ▼
┌──────────────────────────────────────────────┐ ┌──────────────────────────────┐
│       Amazon RDS for PostgreSQL 16           │ │  Amazon ElastiCache Valkey   │
│  - db.t4g.micro (Free-Tier Eligible)         │ │  - cache.t4g.micro or        │
│  - 20 GB gp3 storage with autoscaling        │ │  - Built-in In-Memory Engine │
│  - Automated daily snapshots & PITR          │ │    ($0/mo cost-saving mode)  │
└──────────────────────────────────────────────┘ └──────────────────────────────┘
```

---

## 💰 2. Cost Analysis & Minimization Strategies

### Expected Cost Categories

| Component | AWS Service | Sizing / Tier | Estimated Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Frontend CDN** | CloudFront | Global edge network (1 TB/mo free) | **$0.00** (Free Tier) |
| **Frontend Storage** | Amazon S3 | Standard storage (< 100 MB) | **~$0.02** |
| **Backend Compute** | ECS Fargate (or App Runner) | 0.25 vCPU, 512 MB RAM (1 task) | **~$9.00 - $14.00** |
| **Load Balancer** | Application Load Balancer | Minimal LCU usage | **~$16.00** *(or $0 if using App Runner!)* |
| **Database** | Amazon RDS PostgreSQL | `db.t4g.micro` (750 hrs free/mo for 12 mos) | **$0.00** (Year 1) / ~$14.00 (After) |
| **Caching Layer** | In-Memory / ElastiCache | Built-in in-memory fallback ($0) or `cache.t4g.micro` | **$0.00** (Fallback) / ~$11.00 (ElastiCache) |
| **Secrets & Config** | SSM Parameter Store | Standard parameters | **$0.00** (Free unlimited) |
| **Domain & SSL** | Route 53 + ACM | 1 Hosted zone + ACM Public Cert | **~$0.50** |
| **Total Estimated Cost** | — | **Cost-Optimized Stack** | **~$9.00 – $25.00 / month** |

### 5 Critical Cost-Minimization Rules Implemented:
1. **Avoid AWS NAT Gateway ($32.40/month + $0.045/GB):** In our CloudFormation template, ECS tasks run in public subnets with public IPs and strict security groups (allowing inbound traffic *only* from the ALB). This provides complete security isolation while saving over $400/year.
2. **App Runner Alternative for Zero ALB Cost ($16/month saved):** If utilizing AWS App Runner (`aws/apprunner.yaml`), App Runner provides built-in SSL termination and load balancing, completely eliminating the $16-20/month base cost of an ALB.
3. **SSM Parameter Store over AWS Secrets Manager:** AWS Secrets Manager charges $0.40 per secret per month ($2.00/mo for 5 secrets). We configure AWS Systems Manager (SSM) Parameter Store standard parameters, which are **100% free**.
4. **Leverage Built-In In-Memory Cache:** The backend includes graceful cache-aside fallback. In early deployment, omitting ElastiCache saves $11.00/month with zero application impact.
5. **AWS Free Tier Maximization:** RDS `db.t4g.micro` offers 750 free hours/month for 12 months, CloudFront offers 1 TB of outbound data transfer free forever, and S3 offers 5 GB free storage.

---

## 🔐 3. Environment Variables, Secrets, IAM & HTTPS

### Secret Storage via AWS SSM Parameter Store
Store production values in SSM Parameter Store with `SecureString` encryption:

```powershell
# 1. Database Connection URL
aws ssm put-parameter `
  --name "/hapini/production/DATABASE_URL" `
  --type "SecureString" `
  --value "postgresql://hapini_admin:REPLACE_WITH_RDS_PASSWORD@<rds-endpoint>:5432/hapini_prod"

# 2. JWT Signing Secret (Minimum 32 random characters)
aws ssm put-parameter `
  --name "/hapini/production/JWT_SECRET" `
  --type "SecureString" `
  --value "hapini_prod_super_secure_jwt_secret_key_random_string_2026"

# 3. Client URL (Allowed CORS Origins)
aws ssm put-parameter `
  --name "/hapini/production/CLIENT_URL" `
  --type "String" `
  --value "https://your-cloudfront-id.cloudfront.net"

# 4. Redis URL (Optional - leave empty to use in-memory fallback)
aws ssm put-parameter `
  --name "/hapini/production/REDIS_URL" `
  --type "String" `
  --value "redis://hapini-cache.xxxxxx.0001.use1.cache.amazonaws.com:6379"
```

### GitHub Actions OIDC Authentication (No Hardcoded AWS Keys!)
Never store static AWS credentials (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) in GitHub repository secrets. Instead, configure an **AWS IAM OpenID Connect (OIDC) identity provider**:

1. **Create OIDC Provider:** Pointing to `https://token.actions.githubusercontent.com` with audience `sts.amazonaws.com`.
2. **Create IAM Role (`hapini-github-deploy-role`):**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
           },
           "StringLike": {
             "token.actions.githubusercontent.com:sub": "repo:BEERAKAMPUNEETH/hapini:*"
           }
         }
       }
     ]
   }
   ```
3. Grant this role least-privilege permissions to push to ECR, update the ECS service, sync to the S3 frontend bucket, and create CloudFront invalidations.

### HTTPS via AWS Certificate Manager (ACM)
- ACM certificates are **100% free** for Amazon-managed services (CloudFront & ALB).
- Simply request a certificate for `hapini.com` and `*.hapini.com` in `us-east-1`, add the generated CNAME DNS validation record, and attach it to the CloudFront distribution.

---

## 📈 4. Logging, Health Checks, Backups & Rollback

### Logging & Auditing
- **Container Application Logs:** Backend logs (`requestLogger`, alert job runs, errors) stream directly to Amazon CloudWatch via the `awslogs` log driver (`/ecs/hapini-backend`). Retention is set to 14 days to eliminate log storage bloat.
- **ALB Access Logs:** Can be routed to an S3 bucket prefix for security audits and traffic analytics.

### Health Checking & Auto-Healing
- **Target Group Health Check:** Configured to ping `GET /api/health` every 15 seconds.
- If a container becomes unresponsive (e.g. unhandled error or event loop lockup), the ALB stops routing traffic to it, and ECS Fargate terminates the unhealthy task and launches a fresh container automatically within 30 seconds.

### Database Backups & Point-in-Time Recovery
- **Automated RDS Snapshots:** Retained for 7 days (configurable up to 35 days). Backups happen in the daily maintenance window (`03:00 - 04:00 UTC`).
- **Point-in-Time Recovery (PITR):** Enables rolling back the database state to any specific second within the retention window in the event of catastrophic data corruption.

### Zero-Downtime Rollout & Automated Rollback
- **ECS Rolling Deployments:** `minimumHealthyPercent` is set to 100%, and `maximumPercent` is set to 200%. During an update, ECS spins up the new task, waits for `/api/health` to return HTTP 200, switches traffic over, and only then tears down the old container.
- **ECS Deployment Circuit Breaker:** If the new task fails its health checks, the deployment automatically cancels and rolls back to the previous healthy task definition revision with zero downtime.
- **Frontend Rollback:** The S3 bucket maintains object versioning. If a broken frontend release occurs, reverting to the previous git tag triggers an S3 sync of the previous bundle and a CloudFront cache invalidation in under 60 seconds.

---

## 🚀 5. How to Deploy (Step-by-Step Instructions)

When you are ready to deploy to AWS, follow these sequential steps:

### Step 1: Deploy Infrastructure via CloudFormation
```powershell
aws cloudformation deploy `
  --template-file aws/cloudformation.yml `
  --stack-name hapini-production `
  --capabilities CAPABILITY_NAMED_IAM `
  --parameter-overrides `
      EnvironmentName=production `
      DBMasterUsername=hapini_admin `
      DBMasterPassword="YOUR_SECURE_PASSWORD"
```

### Step 2: Run Database Migrations & Seeds on RDS
Once the RDS PostgreSQL instance is provisioned:
```powershell
# Set temporary connection string to run initial schema
$env:DATABASE_URL="postgresql://hapini_admin:YOUR_PASSWORD@<rds-endpoint>:5432/hapini_prod"
$env:DB_SSL="true"

# Execute database migrations and seeds
npm --prefix backend run db:migrate
npm --prefix backend run db:seed
```

### Step 3: Configure GitHub Repository Secrets & Variables
In your GitHub repository ([Settings > Secrets and variables > Actions](https://github.com/BEERAKAMPUNEETH/hapini/settings/secrets/actions)):

**Repository Secrets:**
- `AWS_ROLE_ARN`: `arn:aws:iam::<ACCOUNT_ID>:role/hapini-github-deploy-role`

**Repository Variables:**
- `AWS_REGION`: `us-east-1`
- `ECR_REPOSITORY`: `hapini-backend`
- `ECS_CLUSTER_NAME`: `hapini-cluster-production`
- `ECS_SERVICE_NAME`: `hapini-service-production`
- `FRONTEND_S3_BUCKET`: `hapini-frontend-<ACCOUNT_ID>-production`
- `CLOUDFRONT_DISTRIBUTION_ID`: `<DISTRIBUTION_ID_FROM_CLOUDFORMATION>`

### Step 4: Trigger the Deployment Workflow
1. Navigate to the **Actions** tab on GitHub: [https://github.com/BEERAKAMPUNEETH/hapini/actions](https://github.com/BEERAKAMPUNEETH/hapini/actions)
2. Select **Hapini Production Deployment (AWS)** from the sidebar.
3. Click **Run workflow** &rarr; select branch `main` &rarr; click **Run workflow**.

The workflow will verify all backend/frontend tests, build and push the backend container to Amazon ECR, perform a zero-downtime rolling update on ECS Fargate, build the frontend SPA, sync assets to Amazon S3, and invalidate CloudFront caches.
