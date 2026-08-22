# Setup Instructions for E-Course Learning Management System

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory with the following configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lms_db?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV=development

# AWS S3 Configuration (Optional - for file storage)
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=your_bucket_name

# Redis Configuration (Optional - for BullMQ queues)
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory with the following configuration:

```env
# Backend API URL
NEXT_PUBLIC_API_URL="http://localhost:3001/api"

# NextAuth Configuration
NEXTAUTH_SECRET="your-nextauth-secret-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Application Configuration
NODE_ENV=development
```

## Database Setup

### Prerequisites
- PostgreSQL installed and running
- Node.js installed (v18 or higher)

### Steps

1. **Create PostgreSQL Database**
   ```sql
   CREATE DATABASE lms_db;
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

4. **Run Database Migrations**
   ```bash
   npm run prisma:migrate
   ```

5. **Seed Database (Optional)**
   ```bash
   npm run prisma:seed
   ```

## Running the Application

### Backend
```bash
cd backend
npm run start:dev
```

The backend will run on `http://localhost:3001`

### Frontend
```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

## Default Users (if seeded)

The database seed includes the following default users:
      
**Admin:**
- Email: admin@ecourse.ac.id
- Password: Password123!

**Dosen (Lecturer):**
- Email: dosen1@ecourse.ac.id
- Password: Password123!

**Mahasiswa (Student):**
- Email: mahasiswa1@ecourse.ac.id
- Password: Password123!

## Troubleshooting

### Authentication Issues
If you encounter "Token tidak valid" errors:
1. Ensure both frontend and backend are using the same JWT_SECRET
2. Check that the JWT_SECRET is at least 32 characters long
3. Verify the NEXTAUTH_SECRET is set in the frontend
4. Make sure the session provider is receiving the session prop

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check the DATABASE_URL connection string
3. Ensure the database `lms_db` exists
4. Check that PostgreSQL credentials are correct

### CORS Issues
The application uses a proxy to avoid CORS issues. If you encounter CORS problems:
1. Verify the proxy route is working at `/api/proxy`
2. Check that NEXT_PUBLIC_API_URL is correct
3. Ensure the backend is running on the expected port (3001)

## Architecture Overview

### Authentication Flow
1. User logs in via NextAuth credentials provider
2. Frontend calls `/api/auth/login` on backend
3. Backend validates credentials and returns JWT token
4. Token is stored in NextAuth session
5. Client components access token via `useSession()` hook
6. API calls include token in Authorization header
7. Proxy forwards Authorization header to backend
8. Backend validates JWT using JwtStrategy
9. Request proceeds if token is valid

### Database Connection
- Backend uses Prisma ORM with PostgreSQL
- PrismaService is global and handles connection lifecycle
- Uses @prisma/adapter-pg for PostgreSQL connection pooling
- Connection string configured via DATABASE_URL environment variable
