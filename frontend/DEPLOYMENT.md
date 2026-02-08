# PawPal Frontend Deployment Guide

This guide covers deploying the PawPal frontend to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Build Optimization](#build-optimization)
4. [Deployment Platforms](#deployment-platforms)
5. [CDN Configuration](#cdn-configuration)
6. [Analytics and Monitoring](#analytics-and-monitoring)
7. [Error Tracking](#error-tracking)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Performance Optimization](#performance-optimization)
10. [Production Checklist](#production-checklist)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Domain name configured
- SSL/TLS certificates
- CDN account (Cloudflare, AWS CloudFront, etc.)

## Environment Configuration

### 1. Copy Production Environment Template

```bash
cd frontend
cp .env.production .env.local
```

### 2. Configure Required Variables

Edit `.env.local` with production values:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.pawpal.com/api/v1

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_MIXPANEL_TOKEN=your-mixpanel-token

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# CDN
NEXT_PUBLIC_CDN_URL=https://cdn.pawpal.com
```

### 3. Security Best Practices

- Never commit `.env.local` to version control
- Use environment-specific configurations
- Rotate API keys regularly
- Enable CSP and HSTS in production
- Use HTTPS for all resources

## Build Optimization

### Production Build

```bash
npm run build
```

This creates an optimized production build with:
- Minified JavaScript and CSS
- Tree-shaking to remove unused code
- Image optimization
- Code splitting
- Static page generation where possible

### Analyze Bundle Size

```bash
ANALYZE=true npm run build
```

This generates a bundle analysis report to identify large dependencies.

### Build Output

Next.js generates:
- `.next/static/` - Static assets (JS, CSS, images)
- `.next/server/` - Server-side code
- `.next/standalone/` - Standalone deployment (if configured)

## Deployment Platforms

### Option 1: Vercel (Recommended)

Vercel is the easiest deployment option for Next.js applications.

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Deploy**

```bash
vercel --prod
```

3. **Configure Environment Variables**

In Vercel dashboard:
- Go to Project Settings > Environment Variables
- Add all `NEXT_PUBLIC_*` variables
- Set different values for Production, Preview, and Development

4. **Configure Domains**

- Add custom domain in Vercel dashboard
- Configure DNS records
- SSL certificates are automatically provisioned

### Option 2: AWS (S3 + CloudFront)

1. **Build Static Export**

Update `next.config.js`:

```javascript
module.exports = {
  output: 'export',
  // ... other config
}
```

2. **Build and Export**

```bash
npm run build
```

3. **Upload to S3**

```bash
aws s3 sync out/ s3://your-bucket-name --delete
```

4. **Configure CloudFront**

- Create CloudFront distribution
- Set S3 bucket as origin
- Configure SSL certificate
- Set cache behaviors

### Option 3: Docker + Kubernetes

1. **Create Dockerfile**

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

2. **Build Docker Image**

```bash
docker build -t pawpal-frontend:latest .
```

3. **Deploy to Kubernetes**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pawpal-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pawpal-frontend
  template:
    metadata:
      labels:
        app: pawpal-frontend
    spec:
      containers:
      - name: frontend
        image: pawpal-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.pawpal.com/api/v1"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## CDN Configuration

### Cloudflare

1. **Add Site to Cloudflare**

- Add domain to Cloudflare
- Update nameservers

2. **Configure Caching**

- Set cache level to "Standard"
- Enable "Always Use HTTPS"
- Enable "Auto Minify" for JS, CSS, HTML

3. **Page Rules**

```
*pawpal.com/_next/static/*
- Cache Level: Cache Everything
- Edge Cache TTL: 1 year

*pawpal.com/api/*
- Cache Level: Bypass
```

### AWS CloudFront

1. **Create Distribution**

```bash
aws cloudfront create-distribution \
  --origin-domain-name your-bucket.s3.amazonaws.com \
  --default-root-object index.html
```

2. **Configure Cache Behaviors**

- `/_next/static/*` - Cache for 1 year
- `/images/*` - Cache for 1 year
- `/*` - Cache for 1 hour with revalidation

## Analytics and Monitoring

### Google Analytics

1. **Create GA4 Property**

- Go to Google Analytics
- Create new GA4 property
- Get Measurement ID

2. **Add to Environment**

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

3. **Initialize in App**

The analytics are automatically initialized in `_app.tsx`.

### Mixpanel

1. **Create Mixpanel Project**

- Sign up at mixpanel.com
- Create new project
- Get project token

2. **Add to Environment**

```bash
NEXT_PUBLIC_MIXPANEL_TOKEN=your-token
```

### Web Vitals Monitoring

Web Vitals are automatically tracked and sent to analytics:

- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- First Contentful Paint (FCP)
- Time to First Byte (TTFB)

## Error Tracking

### Sentry Setup

1. **Create Sentry Project**

- Go to sentry.io
- Create new Next.js project
- Get DSN

2. **Configure Environment**

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
```

3. **Create Sentry Config Files**

`sentry.client.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
})
```

`sentry.server.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
})
```

4. **Verify Integration**

Errors are automatically captured. Check Sentry dashboard for events.

## CI/CD Pipeline

### GitHub Actions

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

1. Runs tests on every push
2. Builds the application
3. Deploys to staging on `staging` branch
4. Deploys to production on `main` branch
5. Runs Lighthouse performance audits

### Required Secrets

Configure these secrets in GitHub repository settings:

```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SENTRY_DSN
SENTRY_AUTH_TOKEN
SENTRY_ORG
```

### Manual Deployment

```bash
# Deploy to staging
git push origin staging

# Deploy to production
git push origin main
```

## Performance Optimization

### Image Optimization

- Use Next.js Image component
- Serve images in WebP/AVIF formats
- Implement lazy loading
- Use appropriate image sizes

### Code Splitting

- Automatic route-based code splitting
- Dynamic imports for large components
- Lazy load non-critical features

### Caching Strategy

- Static assets: Cache for 1 year
- API responses: Cache with revalidation
- Service worker for offline support

### Bundle Size Optimization

- Remove unused dependencies
- Use tree-shaking
- Minimize third-party scripts
- Analyze bundle with `npm run analyze`

### Performance Monitoring

Monitor Core Web Vitals:
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

## Production Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Bundle size analyzed and optimized
- [ ] Environment variables configured
- [ ] API endpoints verified
- [ ] Error tracking configured
- [ ] Analytics configured

### Security

- [ ] HTTPS enabled
- [ ] CSP headers configured
- [ ] HSTS enabled
- [ ] Security headers set
- [ ] API keys secured
- [ ] CORS configured correctly
- [ ] Authentication working

### Performance

- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Caching configured
- [ ] CDN configured
- [ ] Compression enabled
- [ ] Core Web Vitals meet targets

### Monitoring

- [ ] Error tracking active
- [ ] Analytics tracking
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation configured

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Critical user flows tested
- [ ] Performance verified
- [ ] Error tracking verified
- [ ] Analytics verified
- [ ] Rollback plan documented

## Troubleshooting

### Build Failures

- Check Node.js version (18+)
- Clear `.next` directory
- Delete `node_modules` and reinstall
- Check for TypeScript errors

### Performance Issues

- Analyze bundle size
- Check image optimization
- Review caching configuration
- Monitor API response times

### Error Tracking Issues

- Verify Sentry DSN is correct
- Check environment configuration
- Review Sentry dashboard for events
- Check source maps are uploaded

## Support

For deployment issues:
- Check build logs
- Review error tracking dashboard
- Consult Next.js documentation
- Contact development team
