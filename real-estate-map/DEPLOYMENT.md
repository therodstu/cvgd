# Clintonville Real Estate Map - Deployment Guide

This guide covers different deployment options for the Clintonville Real Estate Investment Map application.

## Prerequisites

- Docker and Docker Compose installed
- Domain name (for production)
- SSL certificate (for HTTPS)

## Local Development

1. **Start the backend:**
```bash
cd backend
npm install
npm run dev
```

2. **Start the frontend:**
```bash
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Build and start all services:**
```bash
docker-compose up --build
```

2. **Access the application:**
- Application: http://localhost
- API: http://localhost/api

### Manual Docker Build

1. **Build frontend:**
```bash
docker build -f Dockerfile.frontend -t clintonville-frontend .
```

2. **Build backend:**
```bash
cd backend
docker build -t clintonville-backend .
```

## Production Deployment Options

### Option 1: VPS/Cloud Server (DigitalOcean, AWS, etc.)

1. **Set up server with Docker**
2. **Clone repository**
3. **Configure environment variables**
4. **Run with Docker Compose**
5. **Set up SSL with Let's Encrypt**

### Option 2: Platform as a Service (Heroku, Railway, etc.)

1. **Deploy backend to PaaS**
2. **Deploy frontend to static hosting (Netlify, Vercel)**
3. **Configure environment variables**
4. **Set up custom domain**

### Option 3: Container Orchestration (Kubernetes)

1. **Create Kubernetes manifests**
2. **Set up ingress controller**
3. **Configure secrets and config maps**
4. **Deploy to cluster**

## Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=https://your-api-domain.com
```

### Backend (.env)
```
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secure-secret-key
DATABASE_URL=your-database-connection-string
```

## Security Considerations

1. **Use HTTPS in production**
2. **Set secure JWT secrets**
3. **Implement rate limiting**
4. **Use environment variables for secrets**
5. **Regular security updates**

## Monitoring and Maintenance

1. **Set up logging**
2. **Monitor application performance**
3. **Regular backups**
4. **Update dependencies regularly**

## Scaling Considerations

- **Database**: Use PostgreSQL or MongoDB for production
- **Caching**: Implement Redis for session management
- **CDN**: Use CloudFlare or AWS CloudFront
- **Load Balancing**: Multiple backend instances
- **Monitoring**: Prometheus + Grafana

## Support

For deployment issues, check:
1. Docker logs: `docker-compose logs`
2. Backend logs: `docker-compose logs backend`
3. Frontend logs: `docker-compose logs frontend`
