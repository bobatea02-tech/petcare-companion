# PawPal Deployment Guide

## Overview

This guide covers the complete deployment process for PawPal Voice Pet Care Assistant, including backend API, frontend application, database setup, and monitoring infrastructure.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Local Development](#local-development)
4. [Staging Deployment](#staging-deployment)
5. [Production Deployment](#production-deployment)
6. [Database Management](#database-management)
7. [Monitoring and Alerting](#monitoring-and-alerting)
8. [Backup and Recovery](#backup-and-recovery)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- Docker 24.0+
- Kubernetes 1.27+
- kubectl CLI
- Helm 3.12+
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Required Accounts

- GitHub account (for CI/CD)
- Container registry access (GitHub Container Registry)
- Cloud provider account (AWS/GCP/Azure)
- Sentry account (error tracking)
- SendGrid account (email notifications)
- Twilio account (SMS notifications)
- Google Cloud account (Maps API)

## Environment Configuration

### Backend Environment Variables

Create a `.env` file for backend configuration:

```bash
# Application
APP_NAME="PawPal Voice Pet Care Assistant"
DEBUG=false
LOG_LEVEL=INFO
SECRET_KEY=<generate-strong-random-key>

# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/pawpal
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis Cache
REDIS_URL=redis://host:6379/0
REDIS_ENABLED=true
CACHE_DEFAULT_TTL=300

# AI Services
GEMINI_API_KEY=<your-gemini-api-key>
PRIMARY_AI_MODEL=gemini-2.5-pro
FALLBACK_AI_MODEL=gemini-2.5-flash

# External APIs
GOOGLE_MAPS_API_KEY=<your-google-maps-key>
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_PHONE_NUMBER=<your-twilio-number>
SENDGRID_API_KEY=<your-sendgrid-key>
SENDGRID_FROM_EMAIL=noreply@pawpal.com

# Security
FORCE_HTTPS=true
ALLOWED_HOSTS='["https://api.pawpal.com", "https://www.pawpal.com"]'

# Monitoring
SENTRY_DSN=<your-sentry-dsn>
SENTRY_ENVIRONMENT=production
ENABLE_METRICS=true
```

### Frontend Environment Variables

Create a `.env.production` file for frontend:

```bash
NEXT_PUBLIC_API_URL=https://api.pawpal.com/api/v1
NEXT_PUBLIC_APP_NAME="PawPal Voice Pet Care Assistant"
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=true
NEXT_PUBLIC_ENABLE_SERVICE_WORKER=true
NEXT_PUBLIC_SENTRY_DSN=<your-sentry-dsn>
```

## Local Development

### Using Docker Compose

1. Clone the repository:
```bash
git clone https://github.com/your-org/pawpal.git
cd pawpal
```

2. Start all services:
```bash
docker-compose up -d
```

3. Run database migrations:
```bash
docker-compose exec api alembic upgrade head
```

4. Access the application:
- Backend API: http://localhost:8000
- Frontend: http://localhost:3000
- API Documentation: http://localhost:8000/docs

### Manual Setup

#### Backend

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Staging Deployment

### 1. Prepare Kubernetes Cluster

```bash
# Create namespace
kubectl create namespace pawpal-staging

# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
```

### 2. Deploy Database

```bash
# Deploy PostgreSQL (using Helm)
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install pawpal-db bitnami/postgresql \
  --namespace pawpal-staging \
  --set auth.database=pawpal \
  --set auth.username=pawpal \
  --set auth.password=<secure-password> \
  --set primary.persistence.size=50Gi

# Deploy Redis
helm install pawpal-redis bitnami/redis \
  --namespace pawpal-staging \
  --set auth.enabled=false \
  --set master.persistence.size=10Gi
```

### 3. Deploy Backend

```bash
# Apply backend deployment
kubectl apply -f k8s/deployment-backend.yaml -n pawpal-staging

# Run migrations
kubectl exec -n pawpal-staging deployment/pawpal-backend -- \
  alembic upgrade head

# Verify deployment
kubectl get pods -n pawpal-staging
kubectl logs -f deployment/pawpal-backend -n pawpal-staging
```

### 4. Deploy Frontend

```bash
# Apply frontend deployment
kubectl apply -f k8s/deployment-frontend.yaml -n pawpal-staging

# Verify deployment
kubectl get pods -n pawpal-staging
kubectl logs -f deployment/pawpal-frontend -n pawpal-staging
```

### 5. Configure Ingress

```bash
# Install NGINX Ingress Controller
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace

# Install cert-manager for TLS
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Apply ingress configuration
kubectl apply -f k8s/ingress.yaml -n pawpal-staging
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing in CI/CD pipeline
- [ ] Database backup completed
- [ ] Secrets properly configured
- [ ] SSL certificates valid
- [ ] Monitoring and alerting configured
- [ ] Rollback plan documented
- [ ] Team notified of deployment window

### Deployment Steps

1. **Tag Release**
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

2. **Deploy via CI/CD**

Push to `main` branch triggers automatic deployment:
```bash
git checkout main
git merge develop
git push origin main
```

3. **Manual Deployment** (if needed)

```bash
# Update backend
kubectl set image deployment/pawpal-backend \
  api=ghcr.io/your-org/pawpal/backend:v1.0.0 \
  -n pawpal

# Update frontend
kubectl set image deployment/pawpal-frontend \
  frontend=ghcr.io/your-org/pawpal/frontend:v1.0.0 \
  -n pawpal

# Monitor rollout
kubectl rollout status deployment/pawpal-backend -n pawpal
kubectl rollout status deployment/pawpal-frontend -n pawpal
```

4. **Run Database Migrations**

```bash
kubectl exec -n pawpal deployment/pawpal-backend -- \
  alembic upgrade head
```

5. **Verify Deployment**

```bash
# Check health endpoints
curl https://api.pawpal.com/api/v1/health/ready
curl https://api.pawpal.com/api/v1/health/live

# Check frontend
curl https://www.pawpal.com

# Check logs
kubectl logs -f deployment/pawpal-backend -n pawpal --tail=100
kubectl logs -f deployment/pawpal-frontend -n pawpal --tail=100
```

### Rollback Procedure

If issues are detected:

```bash
# Rollback backend
kubectl rollout undo deployment/pawpal-backend -n pawpal

# Rollback frontend
kubectl rollout undo deployment/pawpal-frontend -n pawpal

# Rollback database (if migrations were run)
kubectl exec -n pawpal deployment/pawpal-backend -- \
  alembic downgrade -1
```

## Database Management

### Running Migrations

```bash
# Upgrade to latest
alembic upgrade head

# Upgrade to specific revision
alembic upgrade <revision_id>

# Downgrade one revision
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history
```

### Creating New Migrations

```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "Description of changes"

# Create empty migration
alembic revision -m "Description of changes"

# Edit the generated migration file in alembic/versions/
# Then apply it
alembic upgrade head
```

### Database Backups

#### Automated Backups

Backups run automatically via cron job:

```bash
# View backup cron job
kubectl get cronjob pawpal-db-backup -n pawpal

# Manually trigger backup
kubectl create job --from=cronjob/pawpal-db-backup manual-backup-$(date +%s) -n pawpal
```

#### Manual Backups

```bash
# Using the backup script
python scripts/backup_database.py --s3 --bucket pawpal-backups

# Direct PostgreSQL backup
kubectl exec -n pawpal deployment/pawpal-backend -- \
  pg_dump -h postgres-host -U pawpal -d pawpal -F c -f /backups/manual_backup.sql
```

### Database Restore

```bash
# Restore from backup file
kubectl exec -n pawpal deployment/pawpal-backend -- \
  pg_restore -h postgres-host -U pawpal -d pawpal /backups/backup_file.sql

# Restore from S3
aws s3 cp s3://pawpal-backups/backup_file.sql /tmp/
kubectl cp /tmp/backup_file.sql pawpal/pawpal-backend-pod:/tmp/
kubectl exec -n pawpal pawpal-backend-pod -- \
  pg_restore -h postgres-host -U pawpal -d pawpal /tmp/backup_file.sql
```

## Monitoring and Alerting

### Prometheus Setup

```bash
# Install Prometheus Operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Apply ServiceMonitor
kubectl apply -f k8s/monitoring/prometheus-servicemonitor.yaml

# Apply alerting rules
kubectl apply -f k8s/monitoring/alerting-rules.yaml
```

### Grafana Dashboard

```bash
# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Import dashboard
# Navigate to http://localhost:3000
# Login with admin/prom-operator
# Import k8s/monitoring/grafana-dashboard.json
```

### Sentry Configuration

1. Create project in Sentry
2. Copy DSN
3. Update secrets:
```bash
kubectl create secret generic pawpal-secrets \
  --from-literal=SENTRY_DSN=<your-sentry-dsn> \
  -n pawpal
```

### Log Aggregation

```bash
# Install Loki for log aggregation
helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set grafana.enabled=false

# View logs in Grafana
# Add Loki as data source
# Query: {namespace="pawpal"}
```

## Backup and Recovery

### Backup Strategy

- **Database**: Daily automated backups at 2 AM UTC
- **File Storage**: Continuous replication to S3
- **Configuration**: Version controlled in Git
- **Retention**: 30 days for daily backups, 90 days for monthly

### Disaster Recovery Plan

1. **Database Failure**
   - Restore from latest backup
   - Verify data integrity
   - Run health checks

2. **Application Failure**
   - Rollback to previous version
   - Check logs for root cause
   - Apply hotfix if needed

3. **Complete System Failure**
   - Provision new infrastructure
   - Restore database from backup
   - Deploy latest stable version
   - Verify all services operational

### Recovery Time Objectives (RTO)

- Database restore: < 1 hour
- Application deployment: < 15 minutes
- Full system recovery: < 2 hours

### Recovery Point Objectives (RPO)

- Database: < 24 hours (daily backups)
- File storage: < 1 hour (continuous replication)

## Troubleshooting

### Common Issues

#### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n pawpal

# Describe pod for events
kubectl describe pod <pod-name> -n pawpal

# Check logs
kubectl logs <pod-name> -n pawpal

# Common fixes:
# - Check resource limits
# - Verify secrets are configured
# - Check image pull permissions
```

#### Database Connection Issues

```bash
# Test database connectivity
kubectl exec -n pawpal deployment/pawpal-backend -- \
  python -c "from app.database.connection import engine; print('Connected')"

# Check database service
kubectl get svc -n pawpal | grep postgres

# Verify credentials
kubectl get secret pawpal-secrets -n pawpal -o yaml
```

#### High Memory Usage

```bash
# Check memory usage
kubectl top pods -n pawpal

# Increase memory limits
kubectl set resources deployment/pawpal-backend \
  --limits=memory=2Gi \
  -n pawpal

# Check for memory leaks in logs
kubectl logs deployment/pawpal-backend -n pawpal | grep -i "memory"
```

#### SSL Certificate Issues

```bash
# Check certificate status
kubectl get certificate -n pawpal

# Describe certificate for details
kubectl describe certificate pawpal-tls-cert -n pawpal

# Force renewal
kubectl delete certificate pawpal-tls-cert -n pawpal
kubectl apply -f k8s/ingress.yaml -n pawpal
```

### Performance Optimization

#### Database Query Optimization

```bash
# Enable query logging
kubectl exec -n pawpal deployment/pawpal-backend -- \
  psql -h postgres-host -U pawpal -d pawpal \
  -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"

# Analyze slow queries
kubectl exec -n pawpal deployment/pawpal-backend -- \
  psql -h postgres-host -U pawpal -d pawpal \
  -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

#### Cache Optimization

```bash
# Check cache hit rate
kubectl exec -n pawpal deployment/pawpal-backend -- \
  redis-cli -h redis-host INFO stats | grep hit_rate

# Clear cache if needed
kubectl exec -n pawpal deployment/pawpal-backend -- \
  redis-cli -h redis-host FLUSHDB
```

### Support Contacts

- **DevOps Team**: devops@pawpal.com
- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **Sentry Alerts**: sentry.io/organizations/pawpal
- **Status Page**: status.pawpal.com

## Security Considerations

### Secrets Management

- Use Kubernetes Secrets or external secret managers (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly (every 90 days)
- Never commit secrets to version control
- Use sealed-secrets for GitOps workflows

### Network Security

- Enable network policies to restrict pod-to-pod communication
- Use TLS for all external communications
- Implement rate limiting at ingress level
- Regular security audits and penetration testing

### Access Control

- Use RBAC for Kubernetes access
- Implement least privilege principle
- Enable audit logging
- Regular access reviews

## Compliance

### HIPAA Compliance (if applicable)

- Encrypt data at rest and in transit
- Implement audit logging
- Regular security assessments
- Business Associate Agreements with third parties

### GDPR Compliance

- Data export functionality implemented
- Data deletion capabilities
- Privacy policy and terms of service
- User consent management

## Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Infrastructure Guide](./INFRASTRUCTURE_GUIDE.md)
- [Performance Optimization](./PERFORMANCE_OPTIMIZATION.md)
- [Error Handling](./ERROR_HANDLING.md)
- [GitHub Repository](https://github.com/your-org/pawpal)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
