# DOCKER.md - Deployment Guide for NestMart API

This guide details the steps to deploy the NestMart API to an AWS EC2 instance using Docker and Docker Compose.

---

## 1. Prerequisites (Local Machine)

Before deploying, ensure your project is configured for a production environment.

### A. Environment Configuration

**Install the Config Module:**

```bash
npm install @nestjs/config
```

**Update `src/app.module.ts`** to use ConfigService for database credentials instead of hardcoded strings.

**Ensure your `src/main.ts`** listens on `0.0.0.0` to allow external connections:

```typescript
await app.listen(3000, '0.0.0.0');
```

### B. Create Production Docker Files

#### 1. Create `Dockerfile` (Multi-Stage Build)

Place this in the root directory.

```dockerfile
# --- STAGE 1: BUILD ---
FROM node:18-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- STAGE 2: PRODUCTION RUN ---
FROM node:18-alpine

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./

RUN npm install --only=production

EXPOSE 3000

CMD ["node", "dist/main"]
```

#### 2. Create `docker-compose.prod.yml`

Place this in the root directory.

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:3000" # Maps server Port 80 to container Port 3000
    env_file:
      - .env
    environment:
      - DB_HOST=db
    depends_on:
      - db
    restart: always

  db:
    image: postgres:15
    restart: always
    env_file:
      - .env
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### 3. Create `.env.production` File

```env
# Database Configuration
DB_TYPE=postgres
DB_HOST=db
DB_PORT=5432
DB_USERNAME=nest_user
DB_PASSWORD=secure_production_password_change_this
DB_NAME=nestmart_db
DB_SYNCHRONIZE=false
DB_AUTO_LOAD_ENTITIES=true

# JWT Configuration
JWT_SECRET=your_super_secure_production_secret_key_change_this
JWT_EXPIRATION=60m

# Application Configuration
PORT=3000
NODE_ENV=production
```

#### 4. Create `.dockerignore`

Place this in the root directory to exclude unnecessary files from the Docker image.

```
node_modules
dist
.git
.gitignore
.env
.env.*
*.md
README.md
.vscode
.idea
coverage
.DS_Store
```

---

## 2. AWS EC2 Setup

### A. Launch Instance

1. Go to **AWS Console** > **EC2** > **Launch Instance**.
2. **Name**: `NestMart-Server`
3. **OS**: Ubuntu 22.04 LTS (Free Tier)
4. **Instance Type**: `t2.micro`
5. **Key Pair**: Create/Select a key pair (e.g., `Nestmart1.pem`). **Download this file!**
6. **Security Group**: Allow SSH (22), HTTP (80), HTTPS (443)

### B. Connect to Server

Open your terminal where the `.pem` file is located:

```bash
chmod 400 Nestmart1.pem
ssh -i "Nestmart1.pem" ubuntu@<YOUR_PUBLIC_IP>
```

### C. Install Docker & Docker Compose (On Server)

Run these commands inside the AWS SSH terminal:

```bash
# 1. Update Linux
sudo apt-get update

# 2. Install Docker
sudo apt-get install -y docker.io

# 3. Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# 4. Add user to docker group (avoids using sudo)
sudo usermod -aG docker $USER
newgrp docker

# 5. Install Docker Compose (V2 Standalone)
sudo curl -4 -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# 6. Verify Installation
docker --version
docker-compose --version
```

### D. Interview Question: "How do you update the app?"

If you change code, you repeat the process:

```
git pull

docker-compose up -d --build
```

Docker is smart; it only rebuilds the layers that changed.

---

## 3. Deployment

### A. Transfer Files (From Local Machine)

Open a **new terminal window** on your computer (not the SSH window) and run:

```bash
scp -i "Nestmart1.pem" -r \
  ./src \
  ./package.json \
  ./package-lock.json \
  ./tsconfig.json \
  ./tsconfig.build.json \
  ./nest-cli.json \
  ./Dockerfile \
  ./docker-compose.prod.yml \
  ./.env.production \
  ubuntu@<YOUR_PUBLIC_IP>:~/
```

**Note**: Ensure you have a `.env.production` file locally before sending.

### B. Setup Environment on Server

SSH back into your server and prepare the environment:

```bash
# Copy production env file to .env
cp .env.production .env

# Verify the file exists and has correct values
cat .env
```

**If you need to edit the `.env` file manually:**

```bash
nano .env
```

Paste your production configuration:

```env
DB_TYPE=postgres
DB_HOST=db
DB_PORT=5432
DB_USERNAME=nest_user
DB_PASSWORD=secure_production_password_change_this
DB_NAME=nestmart_db
DB_SYNCHRONIZE=false
DB_AUTO_LOAD_ENTITIES=true

JWT_SECRET=your_super_secure_production_secret_key_change_this
JWT_EXPIRATION=60m

PORT=3000
NODE_ENV=production
```

Press `CTRL + X`, then `Y`, then `ENTER` to save.

### C. Start the Application

Back in the AWS SSH terminal:

```bash
# Build and start containers in detached mode
docker-compose -f docker-compose.prod.yml up -d --build

# Verify containers are running
docker ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 4. Network Configuration (AWS Firewall)

If the site does not load, you must open the firewall ports.

1. Go to **AWS Console** > **EC2** > **Instances**
2. Select **NestMart-Server**
3. Click **Security** tab → Click the **Security Group ID**
4. **Edit Inbound Rules**:
   - **Add Rule**: Type `HTTP`, Port `80`, Source `0.0.0.0/0`
   - **Add Rule**: Type `HTTPS`, Port `443`, Source `0.0.0.0/0` (optional for SSL)
   - **Keep Rule**: Type `SSH`, Port `22`, Source `My IP` (for security)

5. **Edit Outbound Rules** (If Docker cannot download images):
   - Ensure there is a rule allowing **All Traffic** to `0.0.0.0/0`

---

## 5. Testing Your Deployment

Once deployed, test your API:

```bash
# Test from your local machine
curl http://<YOUR_PUBLIC_IP>/

# Test a specific endpoint
curl http://<YOUR_PUBLIC_IP>/users

# Test authentication
curl -X POST http://<YOUR_PUBLIC_IP>/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

---

## 6. Troubleshooting & Maintenance

### Check Container Status

```bash
docker ps -a
```

### View Logs (Real-time)

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Only app logs
docker-compose -f docker-compose.prod.yml logs -f app

# Only database logs
docker-compose -f docker-compose.prod.yml logs -f db
```

### Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart only app
docker-compose -f docker-compose.prod.yml restart app
```

### Stop Services

```bash
docker-compose -f docker-compose.prod.yml down
```

### Fix Database Password Errors

If you change the DB password in `.env`, you must reset the database volume:

```bash
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d --build
```

### Update Application

When you change code locally:

1. **Transfer new files** (from your local machine):
   ```bash
   scp -i "Nestmart1.pem" -r ./src ubuntu@<YOUR_PUBLIC_IP>:~/
   ```

2. **Rebuild and restart** (on the server):
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

### Check Disk Space

```bash
df -h
```

### Clean Up Docker Resources

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

### Access Database Directly

```bash
# Connect to PostgreSQL container
docker-compose -f docker-compose.prod.yml exec db psql -U nest_user -d nestmart_db

# Common PostgreSQL commands:
# \dt          - List tables
# \d users     - Describe users table
# SELECT * FROM users;
# \q           - Quit
```

---

## 7. Security Best Practices

### A. Generate Strong Secrets

```bash
# Generate a strong JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use openssl
openssl rand -hex 64
```

### B. Secure Your .env File

```bash
# Set proper permissions
chmod 600 .env

# Never commit .env to git
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore
```

### C. Use Environment-Specific Files

- `.env.development` - Local development
- `.env.production` - Production server
- `.env.example` - Template (commit this to git)

### D. Database Security

1. **Change default passwords** immediately
2. **Set `DB_SYNCHRONIZE=false`** in production
3. **Regular backups**:
   ```bash
   docker-compose -f docker-compose.prod.yml exec db pg_dump -U nest_user nestmart_db > backup.sql
   ```

### E. Restrict SSH Access

In AWS Security Group, change SSH source from `0.0.0.0/0` to **your specific IP address**.

---

## 8. Monitoring

### View Resource Usage

```bash
# Container stats
docker stats

# System resources
htop  # Install with: sudo apt install htop
```

### Setup Log Rotation

```bash
# Edit Docker daemon config
sudo nano /etc/docker/daemon.json
```

Add:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Restart Docker:

```bash
sudo systemctl restart docker
```

---

## 9. Setting Up SSL/HTTPS (Optional)

For production, you should use HTTPS. Install Certbot:

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

Update `docker-compose.prod.yml` to include SSL certificates and expose port 443.

---

## 10. Quick Reference Commands

| Task | Command |
|------|---------|
| Start services | `docker-compose -f docker-compose.prod.yml up -d` |
| Stop services | `docker-compose -f docker-compose.prod.yml down` |
| View logs | `docker-compose -f docker-compose.prod.yml logs -f` |
| Rebuild | `docker-compose -f docker-compose.prod.yml up -d --build` |
| Restart | `docker-compose -f docker-compose.prod.yml restart` |
| Check status | `docker ps` |
| Access container | `docker exec -it <container_id> sh` |
| Database backup | `docker-compose -f docker-compose.prod.yml exec db pg_dump -U nest_user nestmart_db > backup.sql` |

---

## Support

If you encounter issues:

1. Check logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Verify environment variables: `docker-compose -f docker-compose.prod.yml exec app env`
3. Check container health: `docker ps -a`
4. Verify network connectivity: `docker network ls`

---

**🎉 Congratulations!** Your NestMart API is now deployed on AWS EC2 with Docker!