# PawPal Infrastructure Guide

## Overview

This guide provides detailed information about the infrastructure architecture, components, and operational procedures for PawPal Voice Pet Care Assistant.

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Load Balancer / CDN                        │
│                  (CloudFlare / AWS CloudFront)               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Kubernetes Ingress Controller                   │
│                    (NGINX Ingress)                           │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             ▼                            ▼
┌────────────────────────┐   ┌──────────────────────────────┐
│   Frontend Service     │   │    Backend API Service       │
│   (Next.js)            │   │    (FastAPI)                 │
│   - 3-10 replicas      │   │    - 3-10 replicas           │
│   - Auto-scaling       │   │    - Auto-scaling            │
└────────────────────────┘   └──────────────┬───────────────┘
                                             │
                    ┌────────────────────────┼────────────────┐
             
docker-compose up -d
```

2. **View logs**

```bash
docker-compose logs -f
```

3. **Stop services**

```bash
docker-compose down
```

4. **Rebuild after code changes**

```bash
docker-compose up -d --build
```

### Building Docker Images

**Backend:**

```bash
docker build -t pawpal/backend:latest .
```

**Frontend:**

```bash
cd frontend
docker build -t pawpal/frontend:latest .
```

### Running Individual Containers

**Backend:**

```bash
docker run -d \
  --name pawpal-backend \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/pawpal \
  -e REDIS_URL=redis://host:6379/0 \
  -e SECRET_KEY=your-secret-key \
  pawpal/backend:latest
```

**Frontend:**

```bash
docker run -d \
  --name pawpal-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.pawpal.com/api/v1 \
  pawpal/frontend:latest
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.25+)
- kubectl configured
- Helm 3+ (optional, for dependencies)
- cert-manager (for SSL certificates)
- NGINX Ingress Controller

### Initial Setup

1. **Create namespace**

```bash
kubectl apply -f k8s/namespace.yaml
```

2. **Create secrets**

```bash
# Edit secrets.yaml with actual values
kubectl apply -f k8s/secrets.yaml
```

3. **Create ConfigMap**

```bash
kubectl apply -f k8s/configmap.yaml
```

4. **Deploy PostgreSQL (if not using managed service)**

```bash
helm install postgresql bitnami/postgresql \
  --namespace pawpal \
  --set auth.database=pawpal \
  --set auth.username=pawpal \
  --set persistence.size=50Gi
```

5. **Deploy Redis (if not using managed service)**

```bash
helm install redis bitnami/redis \
  --namespace pawpal \
  --set auth.enabled=false \
  --set master.persistence.size=10Gi
```

6. **Deploy backend**

```bash
kubectl apply -f k8s/deployment-backend.yaml
```

7. **Deploy frontend**

```bash
kubectl apply -f k8s/deployment-frontend.yaml
```

8. **Configure Ingress**

```bash
kubectl apply -f k8s/ingress.yaml
```

9. **Enable autoscaling**

```bash
kubectl apply -f k8s/hpa.yaml
```

### Verifying Deployment

```bash
# Check pod status
kubectl get pods -n pawpal

# Check services
kubectl get svc -n pawpal

# Check ingress
kubectl get ingress -n pawpal

# View logs
kubectl logs -f deployment/pawpal-backend -n pawpal
kubectl logs -f deployment/pawpal-frontend -n pawpal
```

### Running Database Migrations

```bash
kubectl exec -it deployment/pawpal-backend -n pawpal -- alembic upgrade head
```

### Updating Deployments

```bash
# Update backend image
kubectl set image deployment/pawpal-backend \
  api=pawpal/backend:v1.2.0 \
  -n pawpal

# Update frontend image
kubectl set image deployment/pawpal-frontend \
  frontend=pawpal/frontend:v1.2.0 \
  -n pawpal

# Check rollout status
kubectl rollout status deployment/pawpal-backend -n pawpal
kubectl rollout status deployment/pawpal-frontend -n pawpal
```

### Rolling Back Deployments

```bash
# Rollback backend
kubectl rollout undo deployment/pawpal-backend -n pawpal

# Rollback to specific revision
kubectl rollout undo deployment/pawpal-backend --to-revision=2 -n pawpal

# View rollout history
kubectl rollout history deployment/pawpal-backend -n pawpal
```

## CI/CD Pipeline

### GitHub Actions Workflow

The repository includes two CI/CD workflows:

1. **Backend Pipeline** (`.github/workflows/backend-deploy.yml`)
   - Runs tests on every push
   - Builds Docker image
   - Deploys to staging/production
   - Runs database migrations
   - Creates Sentry release

2. **Frontend Pipeline** (`.github/workflows/deploy.yml`)
   - Runs tests and linting
   - Builds optimized production bundle
   - Deploys to Vercel or Kubernetes
   - Runs Lighthouse performance audits

### Required GitHub Secrets

Configure these in repository settings:

**Backend:**
- `KUBE_CONFIG_STAGING` - Base64 encoded kubeconfig for staging
- `KUBE_CONFIG_PRODUCTION` - Base64 encoded kubeconfig for production
- `SENTRY_AUTH_TOKEN` - Sentry authentication token
- `SENTRY_ORG` - Sentry organization name

**Frontend:**
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `NEXT_PUBLIC_API_URL` - Production API URL
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN for frontend

### Manual Deployment

**Deploy to staging:**

```bash
git checkout staging
git merge main
git push origin staging
```

**Deploy to production:**

```bash
git checkout main
git push origin main
```

### Deployment Approval

Production deployments require manual approval in GitHub Actions:

1. Go to Actions tab in GitHub
2. Select the workflow run
3. Click "Review deployments"
4. Approve or reject

## Monitoring and Alerting

### Prometheus Setup

1. **Install Prometheus Operator**

```bash
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

2. **Apply ServiceMonitor**

```bash
kubectl apply -f k8s/monitoring/prometheus-servicemonitor.yaml
```

3. **Apply alerting rules**

```bash
kubectl apply -f k8s/monitoring/alerting-rules.yaml
```

### Grafana Dashboard

1. **Access Grafana**

```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

2. **Import dashboard**

- Open http://localhost:3000
- Login (default: admin/prom-operator)
- Import `k8s/monitoring/grafana-dashboard.json`

### Key Metrics to Monitor

- **Request rate**: Requests per second
- **Response time**: p50, p95, p99 latencies
- **Error rate**: 4xx and 5xx responses
- **CPU usage**: Per pod and cluster-wide
- **Memory usage**: Per pod and cluster-wide
- **Database connections**: Active and pool size
- **Cache hit rate**: Redis cache effectiveness

### Alerting Channels

Configure alerting in Prometheus Alertmanager:

```yaml
receivers:
- name: 'slack'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
    channel: '#alerts'
    
- name: 'pagerduty'
  pagerduty_configs:
  - service_key: 'YOUR_PAGERDUTY_KEY'
```

## Backup and Disaster Recovery

### Database Backups

**Automated backups:**

```bash
# Run backup script
python scripts/backup_database.py --s3 --bucket pawpal-backups

# Schedule with Kubernetes CronJob
kubectl apply -f k8s/cronjob-backup.yaml
```

**Manual backup:**

```bash
# PostgreSQL
kubectl exec -it postgresql-0 -n pawpal -- \
  pg_dump -U pawpal pawpal > backup.sql

# Upload to S3
aws s3 cp backup.sql s3://pawpal-backups/manual/backup-$(date +%Y%m%d).sql
```

**Restore from backup:**

```bash
# Download from S3
aws s3 cp s3://pawpal-backups/backup-20240207.sql backup.sql

# Restore to PostgreSQL
kubectl exec -i postgresql-0 -n pawpal -- \
  psql -U pawpal pawpal < backup.sql
```

### Disaster Recovery Plan

1. **Database failure**
   - Restore from latest backup
   - Verify data integrity
   - Update connection strings if needed

2. **Complete cluster failure**
   - Provision new cluster
   - Restore database from backup
   - Deploy applications using CI/CD
   - Update DNS records

3. **Data center outage**
   - Failover to secondary region
   - Update DNS to point to backup
   - Monitor replication lag

### Recovery Time Objectives (RTO)

- Database restore: < 1 hour
- Application deployment: < 30 minutes
- Full disaster recovery: < 4 hours

### Recovery Point Objectives (RPO)

- Database: < 1 hour (hourly backups)
- File storage: < 24 hours (daily backups)

## Scaling Strategy

### Horizontal Scaling

**Automatic scaling with HPA:**

```bash
# Already configured in k8s/hpa.yaml
kubectl get hpa -n pawpal
```

**Manual scaling:**

```bash
# Scale backend
kubectl scale deployment/pawpal-backend --replicas=5 -n pawpal

# Scale frontend
kubectl scale deployment/pawpal-frontend --replicas=5 -n pawpal
```

### Vertical Scaling

Update resource requests/limits in deployment YAML:

```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

### Database Scaling

**Read replicas:**

```bash
# Configure read replicas in managed database service
# Update application to use read replicas for queries
```

**Connection pooling:**

```bash
# Already configured in app/database/connection.py
# Adjust pool size based on load:
DATABASE_POOL_SIZE=50
DATABASE_MAX_OVERFLOW=20
```

### Cache Scaling

**Redis cluster:**

```bash
# Deploy Redis cluster for high availability
helm install redis bitnami/redis-cluster \
  --namespace pawpal \
  --set cluster.nodes=6
```

## Security Best Practices

### Network Security

- Use network policies to restrict pod communication
- Enable TLS for all external traffic
- Use private subnets for databases
- Implement WAF rules for API protection

### Secrets Management

- Use Kubernetes secrets or external secrets manager
- Rotate secrets regularly (90 days)
- Never commit secrets to version control
- Use RBAC to restrict secret access

### Container Security

- Run containers as non-root user
- Use minimal base images (alpine)
- Scan images for vulnerabilities
- Keep dependencies updated

### Access Control

- Implement RBAC for Kubernetes
- Use service accounts with minimal permissions
- Enable audit logging
- Require MFA for production access

## Troubleshooting

### Pod Crashes

```bash
# View pod logs
kubectl logs -f pod-name -n pawpal

# View previous logs
kubectl logs pod-name --previous -n pawpal

# Describe pod for events
kubectl describe pod pod-name -n pawpal
```

### Database Connection Issues

```bash
# Test database connectivity
kubectl exec -it deployment/pawpal-backend -n pawpal -- \
  python -c "from app.database.connection import engine; import asyncio; asyncio.run(engine.connect())"

# Check database service
kubectl get svc -n pawpal | grep postgres
```

### High Memory Usage

```bash
# Check memory usage
kubectl top pods -n pawpal

# Increase memory limits
kubectl set resources deployment/pawpal-backend \
  --limits=memory=2Gi \
  -n pawpal
```

### Slow Response Times

```bash
# Check application metrics
kubectl port-forward -n pawpal svc/pawpal-backend-metrics 9090:9090

# Check database query performance
kubectl exec -it postgresql-0 -n pawpal -- \
  psql -U pawpal -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### Certificate Issues

```bash
# Check certificate status
kubectl describe certificate pawpal-tls-cert -n pawpal

# Renew certificate
kubectl delete certificate pawpal-tls-cert -n pawpal
kubectl apply -f k8s/ingress.yaml
```

## Support and Maintenance

### Regular Maintenance Tasks

- **Daily**: Monitor alerts and metrics
- **Weekly**: Review logs for errors
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and optimize resource allocation
- **Annually**: Disaster recovery drill

### Health Checks

```bash
# Check all services
kubectl get all -n pawpal

# Check health endpoints
curl https://api.pawpal.com/api/v1/health/ready
curl https://api.pawpal.com/api/v1/health/live
```

### Performance Optimization

- Monitor and optimize database queries
- Implement caching strategies
- Use CDN for static assets
- Enable compression
- Optimize image sizes

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
