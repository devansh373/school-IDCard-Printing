# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables

Create a `.env` file with the following variables (use `.env.example` as a template):

#### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication - CRITICAL: Use a strong random secret
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<your-strong-random-secret-at-least-32-chars>

# Admin Credentials - CRITICAL: Use strong passwords
ADMIN_EMAIL=<your-admin-email>
ADMIN_PASSWORD=<your-strong-admin-password>

# Server
NODE_ENV=production
PORT=5000
```

#### Optional Variables

```bash
# ImageKit (if using global config)
IMAGEKIT_PUBLIC_KEY=<your-imagekit-public-key>
IMAGEKIT_PRIVATE_KEY=<your-imagekit-private-key>
IMAGEKIT_URL_ENDPOINT=<your-imagekit-url>

# Email
RESEND_API_KEY=<your-resend-api-key>

# CORS - Comma-separated list of allowed origins
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Database Credentials (for Docker)
POSTGRES_USER=<db-user>
POSTGRES_PASSWORD=<strong-db-password>
POSTGRES_DB=school_id
```

### 2. Security Checklist

- [ ] JWT_SECRET is at least 32 characters and randomly generated
- [ ] ADMIN_PASSWORD is strong and unique
- [ ] Database credentials are not default values
- [ ] ALLOWED_ORIGINS is set to production domains only
- [ ] NODE_ENV is set to "production"
- [ ] All sensitive data is in environment variables, not hardcoded
- [ ] .env file is in .gitignore and never committed

### 3. Database Setup

#### Using Docker Compose

```bash
# Set database credentials in .env file
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_strong_db_password
POSTGRES_DB=school_id

# Start database
docker-compose up -d postgres

# Wait for database to be ready
docker-compose logs -f postgres
```

#### Manual PostgreSQL Setup

```bash
# Create database
createdb school_id

# Set DATABASE_URL in .env
DATABASE_URL=postgresql://user:password@localhost:5432/school_id
```

### 4. Run Migrations

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### 5. Create Super Admin

```bash
# Ensure ADMIN_EMAIL and ADMIN_PASSWORD are set in .env
# Then run the seed script
npm run build
node dist/scripts/seed-admin.js
```

## Deployment Options

### Option 1: Docker Compose (Recommended)

```bash
# 1. Set all environment variables in .env file

# 2. Build and start all services
docker-compose up -d

# 3. Check logs
docker-compose logs -f backend

# 4. Create super admin (if not auto-seeded)
docker-compose exec backend node dist/scripts/seed-admin.js
```

### Option 2: Manual Deployment

```bash
# 1. Install dependencies
npm install

# 2. Build the application
npm run build

# 3. Run migrations
npx prisma migrate deploy

# 4. Create super admin
node dist/scripts/seed-admin.js

# 5. Start the server
npm start
```

### Option 3: Using PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start dist/server.js --name school-id-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

## Post-Deployment

### 1. Health Check

```bash
# Check if server is running
curl http://localhost:5050/health

# Expected response:
{
  "status": "OK",
  "timestamp": "2026-01-27T...",
  "database": "connected",
  "uptime": 123.456
}
```

### 2. Test Admin Login

```bash
# Login with admin credentials
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-admin-email",
    "password": "your-admin-password"
  }'
```

### 3. Monitor Logs

```bash
# Docker Compose
docker-compose logs -f backend

# PM2
pm2 logs school-id-backend

# Direct
tail -f /path/to/logs
```

## Security Best Practices

### 1. Secrets Management

**DO NOT** hardcode secrets in code or commit them to version control.

**Recommended approaches:**
- Use environment variables
- Use Docker Secrets (for Docker Swarm)
- Use cloud provider secret managers (AWS Secrets Manager, Azure Key Vault, etc.)
- Use HashiCorp Vault for enterprise deployments

### 2. Database Backups

Set up automated backups:

```bash
# Example: Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/school-id"
DATE=$(date +%Y%m%d_%H%M%S)

docker-compose exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB | \
  gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

### 3. SSL/TLS Configuration

Use a reverse proxy (nginx, Caddy) with SSL certificates:

```nginx
# Example nginx configuration
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5050;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. Firewall Configuration

```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 443/tcp   # HTTPS
ufw enable
```

### 5. Regular Updates

```bash
# Update dependencies regularly
npm audit
npm audit fix

# Update Docker images
docker-compose pull
docker-compose up -d
```

## Monitoring and Maintenance

### 1. Set Up Monitoring

Consider using:
- **Application monitoring**: New Relic, Datadog, or Sentry
- **Server monitoring**: Prometheus + Grafana
- **Uptime monitoring**: UptimeRobot, Pingdom

### 2. Log Aggregation

Use centralized logging:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Loki + Grafana
- Cloud provider logging (CloudWatch, Azure Monitor)

### 3. Database Maintenance

```bash
# Regular vacuum and analyze
docker-compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "VACUUM ANALYZE;"

# Check database size
docker-compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT pg_size_pretty(pg_database_size('school_id'));"
```

## Troubleshooting

### Server won't start

1. Check environment variables:
   ```bash
   docker-compose exec backend env | grep -E "JWT_SECRET|DATABASE_URL|ADMIN_PASSWORD"
   ```

2. Check logs:
   ```bash
   docker-compose logs backend
   ```

3. Verify database connection:
   ```bash
   docker-compose exec backend npx prisma db pull
   ```

### Database connection issues

1. Check if database is running:
   ```bash
   docker-compose ps postgres
   ```

2. Test connection:
   ```bash
   docker-compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;"
   ```

### Migration failures

1. Check migration status:
   ```bash
   npx prisma migrate status
   ```

2. Reset database (CAUTION: This will delete all data):
   ```bash
   npx prisma migrate reset
   ```

## Rollback Procedure

If deployment fails:

```bash
# 1. Stop the new version
docker-compose down

# 2. Restore database backup
gunzip < /backups/school-id/backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker-compose exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB

# 3. Checkout previous version
git checkout <previous-tag>

# 4. Rebuild and restart
docker-compose up -d --build
```

## Support

For issues or questions:
1. Check the logs first
2. Review this documentation
3. Check the PRODUCTION_READINESS_REPORT.md for known issues
4. Contact the development team
